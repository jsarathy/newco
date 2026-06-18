// --- Data (edit these as needed) ---

const team = [
  { name: "Jiten Sarathy", role: "Founder / Project Lead" },
  // add more team members here
];

const hospitals = [
  { id: "jyothi", name: "Jyothi Hospitals / Jyothi Nursing Home, Vizianagaram" },
  // add more hospitals here
];

// --- Render team ---

const teamEl = document.getElementById("team");
team.forEach(member => {
  const card = document.createElement("div");
  card.className = "team-card";
  card.innerHTML = `
    <div class="name">${member.name}</div>
    <div class="role">${member.role}</div>
  `;
  teamEl.appendChild(card);
});

// --- Render hospital list ---

const listEl = document.getElementById("hospital-list");
hospitals.forEach(h => {
  const li = document.createElement("li");
  li.textContent = h.name;
  li.addEventListener("click", () => {
    window.location.href = `hospital.html?id=${h.id}`;
  });
  listEl.appendChild(li);
});
