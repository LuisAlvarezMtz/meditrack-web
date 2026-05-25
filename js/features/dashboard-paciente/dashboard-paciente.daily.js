import { obtenerAlarmasDelDia } from "../../services/alarma.service.js";
import { obtenerMisMedicinas } from "../../services/medicina.service.js";
import { ROUTES } from "../../core/config.js";

const ESTADO = {
  TAKEN:    { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", label: "Tomada"   },
  PROXIMA:  { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Pendiente"  },
  ATRASADA: { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca", label: "Atrasada" },
  OMITTED:  { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca", label: "Omitida"  }
};

function _diasRestantes(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaStr);
  fin.setHours(0, 0, 0, 0);
  return Math.ceil((fin - hoy) / 86400000);
}

function _fmtHora(fechaHora) {
  return new Date(fechaHora).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function _status(alarma = {}) {
  return alarma.status ?? alarma.estado ?? "";
}

function _scheduledAt(alarma = {}) {
  return alarma.scheduledAt ?? alarma.fechaHora;
}

function _medicineName(alarma = {}) {
  return alarma.medicineName ?? alarma.medicinaNombre ?? "Medicamento";
}

function _estadoInfoSemantic(estado, fechaHora) {
  if (estado === "TAKEN")  return ESTADO.TAKEN;
  if (estado === "OMITTED") return ESTADO.OMITTED;
  // PENDIENTE: pasada = atrasada, futura = próxima
  return new Date(fechaHora) < new Date() ? ESTADO.ATRASADA : ESTADO.PROXIMA;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function _metricsSkeleton() {
  const el = document.getElementById("dailyMetrics");
  if (!el) return;
  el.innerHTML = Array(4)
    .fill(`<div class="ds-metric-card">
      <div class="ds-skeleton ds-skeleton--number"></div>
      <div class="ds-skeleton ds-skeleton--label"></div>
    </div>`)
    .join("");
}

function _sectionSkeleton(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `
    <div class="ds-skeleton-row">
      <div class="ds-skeleton"></div>
      <div class="ds-skeleton"></div>
      <div class="ds-skeleton ds-skeleton--short"></div>
    </div>`;
}

function _sortMedicinasPorVencimiento(medicinas = []) {
  return [...medicinas].sort((a, b) => {
    const fechaA = new Date(a.expirationDate ?? a.fechaFin ?? 0).getTime();
    const fechaB = new Date(b.expirationDate ?? b.fechaFin ?? 0).getTime();

    if (Number.isNaN(fechaA) && Number.isNaN(fechaB)) return 0;
    if (Number.isNaN(fechaA)) return 1;
    if (Number.isNaN(fechaB)) return -1;

    return fechaA - fechaB;
  });
}

// ── Metrics ───────────────────────────────────────────────────────────────────

function _renderMetrics(alarmas, medicinas) {
  const el = document.getElementById("dailyMetrics");
  if (!el) return;

  const completadas = alarmas.filter(a => _status(a) === "TAKEN").length;
  const pendientes  = alarmas.filter(a => _status(a) === "PENDING").length;
  const activos     = medicinas.filter(m => {
    const dias = _diasRestantes(m.expirationDate ?? m.fechaFin);
    return dias === null || dias >= 0;
  }).length;

  const items = [
    { label: "Tomas hoy",    value: alarmas.length, color: "var(--text-muted)" },
    { label: "Completadas",  value: completadas,     color: "#22c55e" },
    { label: "Pendientes",   value: pendientes,      color: "#f59e0b" },
    { label: "Medicamentos", value: activos,         color: "var(--text-muted)" }
  ];

  el.innerHTML = items
    .map(
      i => `<div class="ds-metric-card">
        <div class="ds-metric-value" style="color:${i.color}">${i.value}</div>
        <div class="ds-metric-label">${i.label}</div>
      </div>`
    )
    .join("");
}

// ── Tomas de hoy ─────────────────────────────────────────────────────────────

function _renderTomasHoy(alarmas) {
  const el = document.getElementById("tomasHoyContent");
  if (!el) return;

  if (!alarmas.length) {
    el.innerHTML = `
      <div class="ds-empty">
        <div class="ds-empty-icon">💊</div>
        <p>No hay tomas programadas para hoy.</p>
      </div>`;
    return;
  }

  const total       = alarmas.length;
  const completadas = alarmas.filter(a => _status(a) === "TAKEN").length;
  const pct         = Math.round((completadas / total) * 100);

  const sorted = [...alarmas].sort(
    (a, b) => new Date(_scheduledAt(a)) - new Date(_scheduledAt(b))
  );

  // Prioridad: Próxima/Pendiente primero, luego el resto; cortar a 3
  const upcoming  = sorted.filter(a => _status(a) === "PENDING");
  const rest      = sorted.filter(a => _status(a) !== "PENDING");
  const visible   = [...upcoming, ...rest].slice(0, 3);

  const PILL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`;

  const cardsHtml = visible
    .map(a => {
      const e = _estadoInfoSemantic(_status(a), _scheduledAt(a));
      return `
        <div class="ds-toma-card">
          <div class="ds-toma-icon" style="background:${e.bg};color:${e.color}">${PILL_SVG}</div>
          <div class="ds-toma-info">
            <div class="ds-toma-nombre">${_medicineName(a)}</div>
            <div class="ds-toma-hora-text">${_fmtHora(_scheduledAt(a))}</div>
          </div>
          <span class="ds-badge" style="background:${e.bg};color:${e.color};border-color:${e.border}">${e.label}</span>
        </div>`;
    })
    .join("");

  const verTodas = total > 3
    ? `<a class="ds-ver-todas" href="${ROUTES.ALARMAS}">Ver todas (${total}) →</a>`
    : "";

  el.innerHTML = `
    <div class="ds-progress-wrap">
      <div class="ds-progress-info">
        <span>${completadas} de ${total} completadas</span>
        <span>${pct}%</span>
      </div>
      <div class="ds-progress-bar-bg">
        <div class="ds-progress-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>
    <div class="ds-toma-list">${cardsHtml}</div>
    ${verTodas}`;
}

// ── Medicamentos activos ──────────────────────────────────────────────────────

function _renderMedicamentosActivos(medicinas) {
  const el = document.getElementById("medicamentosActivosContent");
  if (!el) return;

  if (!medicinas.length) {
    el.innerHTML = `
      <div class="ds-empty">
        <div class="ds-empty-icon">🏥</div>
        <p>No tienes medicamentos registrados.</p>
      </div>`;
    return;
  }

  const rows = medicinas
    .map(m => {
      const dias = _diasRestantes(m.expirationDate ?? m.fechaFin);
      let badge, badgeStyle, dotColor;
      if (dias === null || dias < 0) {
        badge = "Vencida";    badgeStyle = "background:#fee2e2;color:#b91c1c;border-color:#fecaca"; dotColor = "#ef4444";
      } else if (dias <= 7) {
        badge = "Por vencer"; badgeStyle = "background:#fef3c7;color:#92400e;border-color:#fde68a"; dotColor = "#f59e0b";
      } else {
        badge = "Vigente";    badgeStyle = "background:#dcfce7;color:#166534;border-color:#bbf7d0"; dotColor = "#22c55e";
      }
      const diasText = dias === null
        ? "Sin fecha de vencimiento"
        : dias < 0
          ? "Expirado"
          : `${dias} día${dias !== 1 ? "s" : ""} restantes`;
      const metaParts = [m.dosageForm, diasText].filter(Boolean).join(" · ");

      return `
        <div class="ds-med-row">
          <div class="ds-med-dot" style="background:${dotColor}"></div>
          <div class="ds-med-info">
            <div class="ds-med-nombre">${m.name ?? m.nombre}</div>
            <div class="ds-med-meta">${metaParts}</div>
          </div>
          <span class="ds-badge" style="${badgeStyle}">${badge}</span>
        </div>`;
    })
    .join("");

  el.innerHTML = `<div class="ds-med-list">${rows}</div>`;
}

function _renderMedicamentosPorVencer(medicinas) {
  const el = document.getElementById("medicamentosPorVencerContent");
  if (!el) return;

  const porVencer = _sortMedicinasPorVencimiento(
    medicinas.filter(m => {
      const dias = _diasRestantes(m.expirationDate ?? m.fechaFin);
      return dias !== null && dias >= 0 && dias <= 30;
    })
  ).slice(0, 6);

  if (!porVencer.length) {
    el.innerHTML = `
      <div class="ds-empty ds-empty-compact">
        <div class="ds-empty-icon">OK</div>
        <p>No hay medicinas proximas a vencer en los siguientes 30 dias.</p>
      </div>`;
    return;
  }

  const rows = porVencer
    .map(m => {
      const dias = _diasRestantes(m.expirationDate ?? m.fechaFin);
      const fecha = new Date(m.expirationDate ?? m.fechaFin);
      const fechaTexto = Number.isNaN(fecha.getTime())
        ? "Fecha no disponible"
        : fecha.toLocaleDateString("es-MX");
      const estado = dias <= 7 ? "Urgente" : "Proximo";
      const estadoClass = dias <= 7 ? "is-urgent" : "is-warning";
      const diasTexto = dias === 0
        ? "Vence hoy"
        : `Vence en ${dias} dia${dias !== 1 ? "s" : ""}`;

      return `
        <div class="ds-exp-row">
          <div class="ds-exp-info">
            <div class="ds-exp-name">${m.name ?? m.nombre ?? "Medicamento"}</div>
            <div class="ds-exp-meta">${fechaTexto}${m.dosageForm ? ` · ${m.dosageForm}` : ""}</div>
          </div>
          <div class="ds-exp-side">
            <span class="ds-badge ${estadoClass}">${estado}</span>
            <span class="ds-exp-days">${diasTexto}</span>
          </div>
        </div>`;
    })
    .join("");

  const total = medicinas.filter(m => {
    const dias = _diasRestantes(m.expirationDate ?? m.fechaFin);
    return dias !== null && dias >= 0 && dias <= 30;
  }).length;

  const verMas = total > porVencer.length
    ? `<a class="ds-ver-todas" href="${ROUTES.MEDICAMENTOS}">Ver todas (${total}) -></a>`
    : "";

  el.innerHTML = `
    <div class="ds-exp-summary">
      <strong>${total}</strong>
      <span>medicinas por vencer en 30 dias</span>
    </div>
    <div class="ds-exp-list">${rows}</div>
    ${verMas}`;
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function initDailySection() {
  _metricsSkeleton();
  _sectionSkeleton("tomasHoyContent");
  _sectionSkeleton("medicamentosActivosContent");
  _sectionSkeleton("medicamentosPorVencerContent");

  const [alarmas, medicinas] = await Promise.all([
    obtenerAlarmasDelDia().catch(() => []),
    obtenerMisMedicinas().catch(() => [])
  ]);

  _renderMetrics(alarmas, medicinas);
  _renderTomasHoy(alarmas);
  _renderMedicamentosActivos(medicinas);
  _renderMedicamentosPorVencer(medicinas);
}
