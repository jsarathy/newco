# newco

Hospital revenue cycle modelling — patient journey analytics for inpatient claims.

## What this project does

Builds a per-hospital model of the financial lifecycle of an inpatient encounter — from pre-authorisation through discharge to claim settlement — using each hospital's own historical data. As more hospitals are onboarded, a convergence layer learns shared patterns across the network while preserving hospital-specific behaviour.

See `docs/elephant_one_pager.md` for the conceptual approach.

## Repository structure

```
newco/
├── data/
│   ├── raw/           # Untouched hospital data — never commit, never modify
│   ├── inventoried/   # File manifests and entity-relationship documentation
│   ├── profiled/      # Outputs from automated data profiling
│   └── sample/        # Audit working area (e.g., 30-encounter audit)
├── scripts/           # Reusable Python scripts
├── notebooks/         # Jupyter notebooks for exploratory analysis
├── docs/              # Project documentation
├── .gitignore
├── requirements.txt
└── README.md
```

## Setup for new team members

Prerequisites: Python 3.12 installed and on PATH. Verify with `py -3.12 --version`.

1. Clone the repository:
```
   git clone https://github.com/jsarathy/newco.git
   cd newco
```

2. Create a virtual environment:
```
   py -3.12 -m venv .venv
```

3. Activate the environment:
   - **Windows (PowerShell):** `.\.venv\Scripts\Activate.ps1`
   - **macOS / Linux:** `source .venv/bin/activate`

4. Upgrade pip and install dependencies:
```
   python -m pip install --upgrade pip
   pip install "setuptools<81"
   pip install -r requirements.txt
```
   The `setuptools<81` pin works around a `pkg_resources` compatibility issue with `ydata-profiling`.

5. Recreate the gitignored data folders locally:
```
   mkdir data\raw, data\sample, data\profiled
```

6. In VS Code: `Ctrl+Shift+P` → "Python: Select Interpreter" → choose the `.venv` option.

7. Verify the setup:
Run
```
   python scripts/setup_check.py
```
   Should print Python version and "OK" for all four libraries, ending with "All good."

## Data handling

- **Never commit hospital data.** The `.gitignore` blocks all CSV/XLSX files and the `data/raw/`, `data/sample/`, `data/profiled/` directories. Belt and braces, but verify before every commit.
- Treat `data/raw/` as read-only. All transformations write to other folders.
- Anonymise on extraction wherever possible. We do not need names, full addresses, phone numbers, Aadhaar, or full ABHA IDs to do this work.

## Status

Pre-data phase. First hospital data delivery expected by [date]. Initial audit and pilot plan deliverable target: 10 June 2026.