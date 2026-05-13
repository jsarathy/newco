"""
telangana_ce_scraper.py
-----------------------
Scrapes Telangana district Clinical Establishment registers.

Deps:  pip install requests beautifulsoup4 pdfplumber pandas

Design
------
- Each step (HTTP, file IO, parsing) is its own small method.
- Extraction strategies are static pure functions: testable without
  the network, instantiation, or fixtures beyond a PDF path.
- Strategies are an ordered chain; first non-empty wins.
- The one try/except is isolated in `_safe_process`, so exception
  handling never tangles with control flow.
"""

from __future__ import annotations

import re
import time
from pathlib import Path
from typing import Callable, Iterable
from urllib.parse import urljoin

import pandas as pd
import pdfplumber
import requests
from bs4 import BeautifulSoup


class TelanganaCEScraper:
    """Scrapes one district's Clinical Establishment PDFs into a DataFrame."""

    DEFAULT_USER_AGENT = "newco-research-bot/0.1 (contact: you@example.com)"

    # Matches: "<sl_no> <body…> <DD-MM-YYYY> <10-digit mobile> <remarks…>"
    _ROW_PATTERN = re.compile(
        r"(?P<sl>^\d+)\s+(?P<body>.+?)\s+(?P<date>\d{2}-\d{2}-\d{4})"
        r"\s+(?P<mobile>\d{10})\s*(?P<remarks>.*?)(?=\n\d+\s+|\n\[\[PAGE|\Z)",
        re.MULTILINE | re.DOTALL,
    )

    def __init__(
        self,
        district: str,
        page_url: str,
        out_root: Path | str,
        session: requests.Session | None = None,
        sleep_secs: float = 1.0,
    ):
        self.district = district
        self.page_url = page_url
        self.out_dir = Path(out_root) / district
        self.out_dir.mkdir(parents=True, exist_ok=True)
        self.session = session or self._build_session()
        self.sleep_secs = sleep_secs
        # Extraction strategies in priority order.
        self.extractors: tuple[Callable[[Path], pd.DataFrame], ...] = (
            self.extract_tables,
            self.extract_text_rows,
        )

    # ---- public --------------------------------------------------------------

    def scrape(self) -> pd.DataFrame:
        """Scrape the district. Empty DataFrame if nothing was found."""
        html = self._fetch_page()
        pdf_urls = self._find_pdf_links(html)
        return self._scrape_pdfs(pdf_urls)

    # ---- HTTP ----------------------------------------------------------------

    @classmethod
    def _build_session(cls) -> requests.Session:
        s = requests.Session()
        s.headers.update({"User-Agent": cls.DEFAULT_USER_AGENT})
        return s

    def _fetch_page(self) -> str:
        r = self.session.get(self.page_url, timeout=30)
        r.raise_for_status()
        return r.text

    def _find_pdf_links(self, html: str) -> list[str]:
        soup = BeautifulSoup(html, "html.parser")
        return [
            urljoin(self.page_url, a["href"])
            for a in soup.find_all("a", href=True)
            if a["href"].lower().endswith(".pdf")
        ]

    def _local_path_for(self, pdf_url: str) -> Path:
        name = re.sub(r"[^a-zA-Z0-9._-]", "_", pdf_url.rsplit("/", 1)[-1])
        return self.out_dir / name

    def _download(self, pdf_url: str) -> Path:
        path = self._local_path_for(pdf_url)
        if path.exists():
            return path
        r = self.session.get(pdf_url, timeout=60)
        r.raise_for_status()
        path.write_bytes(r.content)
        return path

    # ---- extraction strategies (pure, individually testable) -----------------

    @staticmethod
    def extract_tables(pdf_path: Path) -> pd.DataFrame:
        """Strategy 1: pdfplumber.extract_tables() — for gridded PDFs."""
        records: list[dict] = []
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                for table in page.extract_tables() or []:
                    records.extend(
                        TelanganaCEScraper._table_to_records(table, pdf_path.name, page_num)
                    )
        return pd.DataFrame(records)

    @staticmethod
    def _table_to_records(table: list[list[str]], pdf_name: str, page_num: int) -> list[dict]:
        if not table or len(table) < 2:
            return []
        header = [(c or "").strip() for c in table[0]]
        records = []
        for row in table[1:]:
            cells = [(c or "").strip() for c in row]
            rec = dict(zip(header, cells))
            rec.update(__pdf=pdf_name, __page=page_num)
            records.append(rec)
        return records

    @staticmethod
    def extract_text_rows(pdf_path: Path) -> pd.DataFrame:
        """Strategy 2: regex over plain text — for non-gridded PDFs."""
        text = TelanganaCEScraper._read_full_text(pdf_path)
        return pd.DataFrame(TelanganaCEScraper._parse_rows(text, pdf_path.name))

    @staticmethod
    def _read_full_text(pdf_path: Path) -> str:
        chunks = []
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                chunks.append(f"\n[[PAGE {page_num}]]\n" + (page.extract_text() or ""))
        return "".join(chunks)

    @staticmethod
    def _parse_rows(text: str, pdf_name: str) -> list[dict]:
        return [
            {
                "sl_no":      m["sl"],
                "raw_body":   " ".join(m["body"].split()),
                "apply_date": m["date"],
                "mobile":     m["mobile"],
                "remarks":    " ".join(m["remarks"].split()),
                "__pdf":      pdf_name,
            }
            for m in TelanganaCEScraper._ROW_PATTERN.finditer(text)
        ]

    # ---- orchestration -------------------------------------------------------

    def _extract(self, pdf_path: Path) -> pd.DataFrame:
        """Run extractors in order; return the first non-empty DataFrame."""
        for strategy in self.extractors:
            df = strategy(pdf_path)
            if not df.empty:
                return df
        return pd.DataFrame()

    def _process_pdf(self, pdf_url: str) -> pd.DataFrame:
        path = self._download(pdf_url)
        df = self._extract(path)
        df["__district"] = self.district
        return df

    def _safe_process(self, pdf_url: str) -> pd.DataFrame:
        try:
            return self._process_pdf(pdf_url)
        except Exception as e:
            print(f"[{self.district}] error on {pdf_url}: {e}")
            return pd.DataFrame()

    def _scrape_pdfs(self, pdf_urls: Iterable[str]) -> pd.DataFrame:
        frames = []
        for pdf_url in pdf_urls:
            frames.append(self._safe_process(pdf_url))
            time.sleep(self.sleep_secs)
        non_empty = [f for f in frames if not f.empty]
        return pd.concat(non_empty, ignore_index=True) if non_empty else pd.DataFrame()


# ---- runner ------------------------------------------------------------------

DISTRICTS = {
    "sangareddy": "https://sangareddy.telangana.gov.in/clinical-establishment-act-2010/",
    # Add the other 32 here.
}

OUT_ROOT = Path("data/raw/clinical_establishments")


def scrape_all(districts: dict[str, str], out_root: Path) -> pd.DataFrame:
    frames = [TelanganaCEScraper(d, url, out_root).scrape() for d, url in districts.items()]
    non_empty = [f for f in frames if not f.empty]
    return pd.concat(non_empty, ignore_index=True) if non_empty else pd.DataFrame()


if __name__ == "__main__":
    combined = scrape_all(DISTRICTS, OUT_ROOT)
    if combined.empty:
        print("No data scraped.")
    else:
        out_csv = OUT_ROOT / "clinical_establishments_all.csv"
        combined.to_csv(out_csv, index=False)
        print(f"Saved {len(combined)} rows → {out_csv}")
