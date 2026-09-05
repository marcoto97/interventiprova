const $ = (id) => document.getElementById(id);

const store = {
  get(key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

let clienti = store.get("it_clienti", [
  {
    id: crypto.randomUUID(),
    nome: "Cliente Demo Srl",
    email: "demo@cliente.it",
    telefono: "+39 010 000000",
    indirizzo: "Genova"
  }
]);

let interventi = store.get("it_interventi", []);

function esc(v = "") {
  return String(v).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function setView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active-view"));
  $(name).classList.add("active-view");

  document.querySelectorAll(".nav-btn[data-view]").forEach(b => {
    b.classList.toggle("active", b.dataset.view === name);
  });

  const titles = {
    dashboard: "Dashboard",
    nuovo: "Nuovo intervento",
    interventi: "Interventi",
    clienti: "Clienti"
  };

  $("pageTitle").textContent = titles[name] || "Interventi Tecnici";
  document.querySelector(".sidebar").classList.remove("open");
  renderAll();
}

document.querySelectorAll("[data-go]").forEach(b => {
  b.addEventListener("click", () => setView(b.dataset.go));
});

document.querySelectorAll(".nav-btn[data-view]").forEach(b => {
  b.addEventListener("click", () => setView(b.dataset.view));
});

$("menuBtn").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = $("loginEmail").value.trim();
  const pass = $("loginPassword").value.trim();

  if (!email || !pass) return;

  localStorage.setItem("it_user", email);
  showApp(email);
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("it_user");
  $("mainApp").classList.add("hidden");
  $("loginView").classList.remove("hidden");
});

function showApp(email) {
  $("loginView").classList.add("hidden");
  $("mainApp").classList.remove("hidden");
  $("welcomeText").textContent = `Accesso: ${email}`;
  renderAll();
}

$("clienteForm").addEventListener("submit", (e) => {
  e.preventDefault();

  clienti.unshift({
    id: crypto.randomUUID(),
    nome: $("clienteNome").value.trim(),
    email: $("clienteEmail").value.trim(),
    telefono: $("clienteTelefono").value.trim(),
    indirizzo: $("clienteIndirizzo").value.trim()
  });

  store.set("it_clienti", clienti);
  e.target.reset();
  renderAll();
});

$("interventoForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const c = clienti.find(x => x.id === $("clienteSelect").value);

  interventi.unshift({
    id: crypto.randomUUID(),
    clienteId: c?.id || "",
    cliente: c?.nome || "",
    data: $("dataIntervento").value,
    oraInizio: $("oraInizio").value,
    oraFine: $("oraFine").value,
    macchina: $("macchina").value.trim(),
    seriale: $("seriale").value.trim(),
    problema: $("problema").value.trim(),
    lavoro: $("lavoro").value.trim(),
    materiali: $("materiali").value.trim(),
    stato: $("stato").value,
    tecnico: $("tecnico").value.trim()
  });

  store.set("it_interventi", interventi);
  e.target.reset();
  setDefaults();
  setView("interventi");
});

$("searchInterventi").addEventListener("input", renderInterventi);

function setDefaults() {
  const now = new Date();
  $("dataIntervento").value = now.toISOString().slice(0, 10);
  $("oraInizio").value = now.toTimeString().slice(0, 5);
}

function renderClientSelect() {
  $("clienteSelect").innerHTML = clienti.length
    ? clienti.map(c => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("")
    : `<option value="">Nessun cliente disponibile</option>`;
}

function renderClients() {
  $("clientCount").textContent = clienti.length;

  $("clientList").innerHTML = clienti.length
    ? clienti.map(c => `
      <div class="client-item">
        <div>
          <strong>${esc(c.nome)}</strong>
          <small>${esc(c.email || "—")} · ${esc(c.telefono || "—")}</small>
          <small>${esc(c.indirizzo || "")}</small>
        </div>
      </div>
    `).join("")
    : `<div class="empty">Nessun cliente inserito.</div>`;
}

function tableHtml(items) {
  if (!items.length) {
    return `<div class="empty">Nessun intervento trovato.</div>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Cliente</th>
            <th>Macchina</th>
            <th>Seriale</th>
            <th>Tecnico</th>
            <th>Stato</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(i => {
            const cls =
              i.stato === "Completato"
                ? "done"
                : i.stato === "Aperto"
                  ? "open"
                  : "";

            return `
              <tr>
                <td>${esc(i.data)}</td>
                <td>${esc(i.cliente)}</td>
                <td>${esc(i.macchina || "—")}</td>
                <td>${esc(i.seriale || "—")}</td>
                <td>${esc(i.tecnico || "—")}</td>
                <td><span class="status ${cls}">${esc(i.stato)}</span></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderInterventi() {
  const q = $("searchInterventi").value.trim().toLowerCase();

  const filtered = !q
    ? interventi
    : interventi.filter(i =>
        [i.cliente, i.macchina, i.seriale, i.tecnico, i.stato]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );

  $("interventiTable").innerHTML = tableHtml(filtered);
}

function renderDashboard() {
  $("statTotali").textContent = interventi.length;
  $("statAperti").textContent = interventi.filter(i => i.stato !== "Completato").length;
  $("statCompletati").textContent = interventi.filter(i => i.stato === "Completato").length;
  $("statClienti").textContent = clienti.length;
  $("recentTable").innerHTML = tableHtml(interventi.slice(0, 5));
}

function renderAll() {
  renderClientSelect();
  renderClients();
  renderInterventi();
  renderDashboard();
}

setDefaults();

const savedUser = localStorage.getItem("it_user");
if (savedUser) {
  showApp(savedUser);
}
