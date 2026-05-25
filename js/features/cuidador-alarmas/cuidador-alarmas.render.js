import { cuidadorAlarmasState } from "./cuidador-alarmas.state.js";
import { alarmaStatus, fmt, fmtShort } from "./cuidador-alarmas.utils.js";

const STATUS_LABEL = { active: "Activo", paused: "Pausado", ended: "Finalizado" };

const ESTADO_LABEL = {
  PENDING: "Pendiente",
  TAKEN: "Tomada",
  OMITTED: "Omitida"
};

function getTakeStatus(toma = {}) {
  return toma.status ?? toma.estado ?? "";
}

function getScheduledAt(toma = {}) {
  return toma.scheduledAt ?? toma.fechaHora;
}

function getMedicineName(toma = {}) {
  return toma.medicineName ?? toma.medicinaNombre ?? "Medicamento";
}

function getAlarmConfigId(toma = {}) {
  return toma.alarmConfigId ?? toma.alarmaConfigId;
}

function countTotal(alarm) {
  const start = new Date(alarm.inicio);
  const end   = new Date(alarm.fin);
  const diff  = end - start;
  if (diff <= 0) return 1;
  return Math.floor(diff / (alarm.frecHoras * 3600000)) + 1;
}

// ── Stats ──────────────────────────────────────────────────────────────────

export function updateStats() {
  const active = cuidadorAlarmasState.alarms.filter(a => alarmaStatus(a) === "active").length;
  const total  = cuidadorAlarmasState.alarms.length;

  const activeEl    = document.getElementById("statActive");
  const activeSubEl = document.getElementById("statActiveSub");
  if (active === 0) {
    activeEl.textContent   = "—";
    activeEl.style.cssText = "font-size:18px;padding-top:4px";
    activeSubEl.textContent = "Sin alarmas activas";
  } else {
    activeEl.textContent   = active;
    activeEl.style.cssText = "";
    activeSubEl.innerHTML  = `<span class="stat-dot" style="background:var(--primary)"></span>En curso`;
  }
  document.getElementById("barActive").style.width = total ? (active / total * 100) + "%" : "0%";

  const today      = cuidadorAlarmasState.todayAlarms.length;
  const todayEl    = document.getElementById("statToday");
  const todaySubEl = document.getElementById("statTodaySub");
  if (today === 0) {
    todayEl.textContent   = "—";
    todayEl.style.cssText = "font-size:18px;padding-top:4px";
    todaySubEl.textContent = "Sin tomas hoy";
  } else {
    todayEl.textContent   = today;
    todayEl.style.cssText = "";
    todaySubEl.innerHTML  = `<span class="stat-dot" style="background:#007bff"></span>Programadas`;
  }
  document.getElementById("barToday").style.width = today ? Math.min(100, today * 10) + "%" : "0%";

  const now   = new Date();
  const nexts = cuidadorAlarmasState.todayAlarms
    .filter(t => new Date(getScheduledAt(t)) >= now)
    .map(t => ({ t: new Date(getScheduledAt(t)), name: getMedicineName(t) }))
    .sort((a, b) => a.t - b.t);

  if (nexts.length) {
    document.getElementById("statNext").textContent    = nexts[0].t.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("statNextMed").textContent = nexts[0].name;
  } else {
    document.getElementById("statNext").textContent    = "—";
    document.getElementById("statNextMed").textContent = "Sin alarmas";
  }

  document.getElementById("statMeds").textContent = cuidadorAlarmasState.medsCount || "—";
}

// ── Item de lista ──────────────────────────────────────────────────────────

function buildAlarmItemHtml(a) {
  const isSelected = cuidadorAlarmasState.selectedId === Number(a.id);

  return `
    <div class="alarm-item${isSelected ? " selected" : ""}" data-id="${a.id}">
      <div class="alarm-item-row">
        <div class="alarm-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/>
            <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>
          </svg>
        </div>
        <div class="alarm-item-info">
          <div class="alarm-item-name">${a.medName}</div>
          <div class="alarm-item-dates">${fmtShort(new Date(a.inicio))} → ${fmtShort(new Date(a.fin))}</div>
        </div>
        <div class="alarm-item-badges">
          <span class="freq-pill">Cada ${a.frecHoras}h</span>
        </div>
      </div>
    </div>`;
}

// ── Panel de detalle ───────────────────────────────────────────────────────

function buildDetailHtml(a) {
  const st    = alarmaStatus(a);
  const total = countTotal(a);

  const tomasHoy = cuidadorAlarmasState.todayAlarms.filter(
    t => Number(getAlarmConfigId(t)) === Number(a.id)
  );

  const pillsHtml = tomasHoy.length
    ? tomasHoy.map(t => {
        const status = getTakeStatus(t);
        const hora  = new Date(getScheduledAt(t)).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
        const label = ESTADO_LABEL[status] ?? status ?? "";
        let extraClass = "";
        if (status === "TAKEN") extraClass = " next-pill-tomada";
        else if (status === "OMITTED") extraClass = " next-pill-omitida";
        return `<span class="next-pill${extraClass}">${hora}${label ? " · " + label : ""}</span>`;
      }).join("")
    : `<div class="no-next">
        <div class="no-next-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span class="no-next-text">Sin tomas programadas para hoy</span>
      </div>`;

  return `
    <div class="detail-content">
      <div class="detail-content-inner">
        <div class="detail-head">
          <div class="detail-head-name">${a.medName}</div>
          <span class="status-badge ${st}">${STATUS_LABEL[st]}</span>
        </div>
        <div class="detail-info-grid">
          <div class="detail-info-box">
            <div class="detail-info-label">Inicio</div>
            <div class="detail-info-val">${fmt(new Date(a.inicio))}</div>
          </div>
          <div class="detail-info-box">
            <div class="detail-info-label">Fin</div>
            <div class="detail-info-val">${fmt(new Date(a.fin))}</div>
          </div>
          <div class="detail-info-box">
            <div class="detail-info-label">Frecuencia</div>
            <div class="detail-info-val">Cada ${a.frecHoras} horas</div>
          </div>
          <div class="detail-info-box">
            <div class="detail-info-label">Total de tomas</div>
            <div class="detail-info-val">${total} toma${total !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div class="detail-nexts-label">Tomas de hoy</div>
        <div class="detail-nexts-pills">${pillsHtml}</div>
      </div>
      <div class="detail-action-bar">
        <button class="btn-detail btn-edit" data-action="edit" data-id="${a.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button class="btn-detail btn-delete" data-action="delete" data-id="${a.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>`;
}

// ── Panel de edición ───────────────────────────────────────────────────────

function buildDetailEditHtml(a) {
  const opts = [1, 2, 3, 4, 6, 8, 10, 12]
    .map(h => `<option value="${h}"${a.frecHoras === h ? " selected" : ""}>Cada ${h} hora${h > 1 ? "s" : ""}</option>`)
    .join("");

  return `
    <div class="detail-content">
      <div class="detail-content-inner">
        <div class="detail-head">
          <div class="detail-head-name">${a.medName}</div>
          <span class="status-badge status-editing">Editando</span>
        </div>
        <div class="alarm-edit-form">
          <div class="edit-form-group">
            <label class="edit-label">Fecha y Hora de Inicio</label>
            <input type="datetime-local" id="editFechaInicio" class="edit-input" value="${a.inicio}" required>
          </div>
          <div class="edit-form-group">
            <label class="edit-label">Fecha y Hora de Fin</label>
            <input type="datetime-local" id="editFechaFin" class="edit-input" value="${a.fin}" required>
          </div>
          <div class="edit-form-group">
            <label class="edit-label">Frecuencia</label>
            <select id="editFrecuencia" class="edit-input" required>
              ${opts}
            </select>
          </div>
        </div>
      </div>
      <div class="detail-action-bar">
        <button class="btn-detail btn-cancel-edit" data-action="cancel-edit" data-id="${a.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Cancelar
        </button>
        <button class="btn-detail btn-save-edit" data-action="save-edit" data-id="${a.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Actualizar alarma
        </button>
      </div>
    </div>`;
}

// ── Exports de render ──────────────────────────────────────────────────────

export function renderDetailEdit(alarm) {
  const panel = document.getElementById("detailPanel");
  if (!panel) return;
  panel.innerHTML = buildDetailEditHtml(alarm);
}

export function renderDetail() {
  const panel = document.getElementById("detailPanel");
  if (!panel) return;

  const sel = cuidadorAlarmasState.selectedId != null
    ? cuidadorAlarmasState.alarms.find(a => Number(a.id) === cuidadorAlarmasState.selectedId)
    : null;

  if (!sel) {
    const hasAlarms = cuidadorAlarmasState.alarms.length > 0;
    if (hasAlarms) {
      panel.innerHTML = `
        <div class="detail-empty">
          <div class="detail-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div class="detail-empty-title">Selecciona un recordatorio</div>
          <div class="detail-empty-text">Haz clic en cualquier item de la lista para ver sus detalles y opciones de gestión.</div>
        </div>`;
    } else {
      panel.innerHTML = `
        <div class="detail-empty">
          <div class="detail-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="detail-empty-title">Sin recordatorios</div>
          <div class="detail-empty-text">Este paciente no tiene recordatorios configurados. Ve a Medicinas para crear uno.</div>
          <a href="cuidador-medicinas.html" class="btn-link-meds">Ir a Medicinas</a>
        </div>`;
    }
    return;
  }

  panel.innerHTML = buildDetailHtml(sel);
}

export function renderAlarms() {
  const list = document.getElementById("alarmList");
  if (!list) return;

  let filtered = [...cuidadorAlarmasState.alarms];

  if (cuidadorAlarmasState.currentFilter === "active") {
    filtered = filtered.filter(a => alarmaStatus(a) === "active");
  }
  if (cuidadorAlarmasState.searchQuery) {
    filtered = filtered.filter(a =>
      a.medName.toLowerCase().includes(cuidadorAlarmasState.searchQuery.toLowerCase())
    );
  }

  if (!filtered.length) {
    list.innerHTML = `
      <div class="list-empty">
        <div class="list-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div class="list-empty-title">Sin recordatorios</div>
        <div class="list-empty-text">
          ${cuidadorAlarmasState.searchQuery
            ? "No se encontraron resultados para tu búsqueda."
            : "Este paciente no tiene recordatorios configurados."}
        </div>
      </div>`;
    renderDetail();
    updateStats();
    return;
  }

  list.innerHTML = filtered.map(buildAlarmItemHtml).join("");

  list.querySelectorAll(".alarm-item").forEach(el => {
    el.addEventListener("click", () => {
      const id = Number(el.dataset.id);
      cuidadorAlarmasState.selectedId = id;
      renderAlarms();
    });
  });

  renderDetail();
  updateStats();
}
