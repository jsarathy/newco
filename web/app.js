// --- Data (edit these as needed) ---

const teamRows = [
  [
    { id: "jiten-sarathy", name: "Jiten Sarathy", role: "" },
    { id: "krishna-kottapalli", name: "Krishna Kottapalli", role: "" },
    { id: "ramesh-viswanatham", name: "Ramesh Viswanatham", role: "" },
    { id: "vikram-vijay", name: "Vikram Vijay", role: "" },
    { id: "aditya-poosarla", name: "Aditya Poosarla", role: "" },
  ],
  [
    { id: "sathya-garimela", name: "Sathya Garimela", role: "" },
    { id: "jyothsna-diaz", name: "Jyothsna Diaz", role: "" },
    { id: "sowmya-kottapalli", name: "Sowmya Kottapalli", role: "" },
  ],
];

const others = [
  { id: "isprit", name: "iSPRIT" },
  { id: "abdm",   name: "ABDM" },
  { id: "ohum",   name: "Ohum" },
];

const hospitals = [
  { id: "jyothi", name: "Jyothi Hospital" },
  { id: "maasharada", name: "MaaSharada" },
  { id: "swaasthya", name: "Swaasthya" },
  { id: "samarpan", name: "Samarpan" },
  { id: "surya", name: "Surya Hospital" },
];

// --- Render team (each row sorted alphabetically by last name) ---

const lastName = n => n.trim().split(/\s+/).pop().toLowerCase();

const teamEl = document.getElementById("team");
teamRows.forEach(row => {
  const rowEl = document.createElement("div");
  rowEl.className = "team-row";
  [...row]
    .sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)))
    .forEach(member => {
      const card = document.createElement("div");
      card.className = "team-card clickable";
      card.innerHTML = `
        <div class="name">${member.name}</div>
        <div class="role">${member.role}</div>
      `;
      card.addEventListener("click", () => {
        window.location.href = `member.html?id=${member.id}`;
      });
      rowEl.appendChild(card);
    });
  teamEl.appendChild(rowEl);
});

// --- Render hospital list ---

const listEl = document.getElementById("hospital-list");
[...hospitals].sort((a, b) => a.name.localeCompare(b.name)).forEach(h => {
  const li = document.createElement("li");
  li.textContent = h.name;
  li.addEventListener("click", () => {
    window.location.href = `hospital.html?id=${h.id}`;
  });
  listEl.appendChild(li);
});

// --- Render others list ---

const othersEl = document.getElementById("others-list");
if (othersEl) {
  others.forEach(o => {
    const li = document.createElement("li");
    li.textContent = o.name;
    li.addEventListener("click", () => {
      window.location.href = `other.html?id=${o.id}`;
    });
    othersEl.appendChild(li);
  });
}

// ===================== Calendar =====================
(function () {
  const SEED = (typeof EVENTS !== "undefined") ? EVENTS : {};
  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const grid    = document.getElementById("cal-grid");
  const rangeEl = document.getElementById("cal-range");
  if (!grid) return;

  // ---- persistence: seed is base; user adds + removals stored separately ----
  const LS_ADDS = "newco_events_adds";       // { date: [ev,...] }  (ev has _id)
  const LS_REMOVED = "newco_events_removed";  // [ id, ... ]
  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  let userAdds = loadJSON(LS_ADDS, {});
  let removed  = new Set(loadJSON(LS_REMOVED, []));

  let events = {};
  function rebuild() {
    events = {};
    Object.keys(SEED).forEach(date => {
      SEED[date].forEach((e, i) => {
        const id = "s:" + date + ":" + i;
        if (removed.has(id)) return;
        (events[date] = events[date] || []).push(Object.assign({ _id: id }, e));
      });
    });
    Object.keys(userAdds).forEach(date => {
      userAdds[date].forEach(e => {
        if (removed.has(e._id)) return;
        (events[date] = events[date] || []).push(e);
      });
    });
  }
  function addEvent(date, ev) {
    ev._id = "u:" + Date.now() + ":" + Math.random().toString(36).slice(2, 7);
    userAdds[date] = userAdds[date] || [];
    userAdds[date].push(ev);
    saveJSON(LS_ADDS, userAdds);
    rebuild();
  }
  function deleteEvent(date, id) {
    if (id.indexOf("u:") === 0) {
      if (userAdds[date]) userAdds[date] = userAdds[date].filter(e => e._id !== id);
      saveJSON(LS_ADDS, userAdds);
    } else {
      removed.add(id);
      saveJSON(LS_REMOVED, Array.from(removed));
    }
    rebuild();
  }
  rebuild();

  const pad = n => String(n).padStart(2, "0");
  const key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

  let ref = new Date();
  ref = new Date(ref.getFullYear(), ref.getMonth(), 1);

  function monthHTML(year, month, isCurrent) {
    const first = new Date(year, month, 1).getDay();
    const days  = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    let cells = "";
    for (let i = 0; i < first; i++) cells += `<div class="cal-cell empty"></div>`;
    for (let d = 1; d <= days; d++) {
      const k = key(year, month, d);
      const has = !!(events[k] && events[k].length);
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      cells += `<div class="cal-cell${has ? " has-event" : ""}${isToday ? " today" : ""}" data-date="${k}">${d}</div>`;
    }
    return `
      <div class="cal-month${isCurrent ? " current" : ""}">
        <div class="cal-month-name">${MONTHS[month]} ${year}</div>
        <div class="cal-dow">${DOW.map(x => `<span>${x}</span>`).join("")}</div>
        <div class="cal-days">${cells}</div>
      </div>`;
  }

  function render() {
    const prev = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
    const next = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    grid.innerHTML =
      monthHTML(prev.getFullYear(), prev.getMonth(), false) +
      monthHTML(ref.getFullYear(),  ref.getMonth(),  true) +
      monthHTML(next.getFullYear(), next.getMonth(), false);
    rangeEl.textContent =
      `${MONTHS[prev.getMonth()].slice(0,3)} – ${MONTHS[next.getMonth()].slice(0,3)} ${next.getFullYear()}`;
  }

  // ---- Day popup ----
  const overlay = document.getElementById("cal-modal");
  const mDate   = document.getElementById("cal-modal-date");
  const mBody   = document.getElementById("cal-modal-body");

  function prettyDate(k) {
    const [y, m, d] = k.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  }
  function escapeCal(s) {
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function openDay(k) {
    mDate.textContent = prettyDate(k);
    const list = events[k] || [];
    const listHTML = list.length
      ? list.map(e => `
          <div class="cal-event">
            <button class="cal-del" data-id="${escapeCal(e._id)}" data-date="${k}" title="Delete" aria-label="Delete event">&times;</button>
            <div class="cal-event-title">${escapeCal(e.title)}${e.time ? ` <span class="cal-event-time">${escapeCal(e.time)}</span>` : ""}</div>
            ${e.note ? `<div class="cal-event-note">${escapeCal(e.note)}</div>` : ""}
          </div>`).join("")
      : `<div class="cal-empty-note">No events on this date.</div>`;
    const formHTML = `
      <div class="cal-add" data-date="${k}">
        <div class="cal-add-title">Add event</div>
        <input class="cal-add-input" id="cal-add-title" type="text" placeholder="Title" autocomplete="off">
        <input class="cal-add-input" id="cal-add-time" type="text" placeholder="Time (optional)" autocomplete="off">
        <input class="cal-add-input" id="cal-add-note" type="text" placeholder="Note (optional)" autocomplete="off">
        <button class="cal-add-btn" id="cal-add-btn" type="button">Add</button>
      </div>`;
    mBody.innerHTML = listHTML + formHTML;
    overlay.hidden = false;
  }
  function closeDay() { overlay.hidden = true; }

  grid.addEventListener("click", e => {
    const cell = e.target.closest(".cal-cell[data-date]");
    if (cell) openDay(cell.dataset.date);
  });

  mBody.addEventListener("click", e => {
    const del = e.target.closest(".cal-del[data-id]");
    if (del) {
      deleteEvent(del.dataset.date, del.dataset.id);
      render();
      openDay(del.dataset.date);
      return;
    }
    const btn = e.target.closest("#cal-add-btn");
    if (!btn) return;
    const k = btn.closest(".cal-add").dataset.date;
    const titleEl = document.getElementById("cal-add-title");
    const title = titleEl.value.trim();
    if (!title) { titleEl.focus(); return; }
    const time = document.getElementById("cal-add-time").value.trim();
    const note = document.getElementById("cal-add-note").value.trim();
    addEvent(k, { title, time: time || undefined, note: note || undefined });
    render();
    openDay(k);
  });

  document.getElementById("cal-modal-close").addEventListener("click", closeDay);
  overlay.addEventListener("click", e => { if (e.target.id === "cal-modal") closeDay(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDay(); });

  document.getElementById("cal-prev").addEventListener("click", () => {
    ref = new Date(ref.getFullYear(), ref.getMonth() - 1, 1); render();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    ref = new Date(ref.getFullYear(), ref.getMonth() + 1, 1); render();
  });

  // ---- Search ----
  const search  = document.getElementById("cal-search");
  const results = document.getElementById("cal-results");
  function runSearch(q) {
    q = q.trim().toLowerCase();
    if (!q) { results.hidden = true; results.innerHTML = ""; return; }
    const hits = [];
    Object.keys(events).forEach(k => {
      events[k].forEach(e => {
        if (`${e.title || ""} ${e.note || ""}`.toLowerCase().includes(q)) hits.push({ k, e });
      });
    });
    hits.sort((a, b) => a.k.localeCompare(b.k));
    results.innerHTML = hits.length
      ? hits.map(h => `
          <div class="cal-result" data-date="${h.k}">
            <span class="cal-result-title">${escapeCal(h.e.title)}</span>
            <span class="cal-result-date">${prettyDate(h.k)}</span>
          </div>`).join("")
      : `<div class="cal-result none">No matching events.</div>`;
    results.hidden = false;
  }
  search.addEventListener("input", e => runSearch(e.target.value));
  results.addEventListener("click", e => {
    const r = e.target.closest(".cal-result[data-date]");
    if (!r) return;
    const [y, m] = r.dataset.date.split("-").map(Number);
    ref = new Date(y, m - 1, 1);
    render();
    results.hidden = true;
    search.value = "";
    openDay(r.dataset.date);
  });
  document.addEventListener("click", e => {
    if (!e.target.closest(".cal-search-wrap")) results.hidden = true;
  });

  render();
})();
