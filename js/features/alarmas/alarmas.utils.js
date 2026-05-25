import { medNames } from "./alarmas.state.js";

export function fmt(d) {
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) + " " +
         d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export function fmtShort(d) {
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function toLocal(d) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function parseDateSafe(value, fallback = new Date()) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fallback;
}

export function normalizeAlarm(raw) {
  const now = new Date();
  const fallbackStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
  const fallbackEnd = new Date(fallbackStart.getTime() + 7 * 24 * 3600000);

  const medId = String(raw?.medicineId ?? raw?.medicinaId ?? raw?.medId ?? "");
  const inicio = parseDateSafe(raw?.startDate ?? raw?.fechaInicio ?? raw?.inicio, fallbackStart);
  const fin = parseDateSafe(raw?.endDate ?? raw?.fechaFin ?? raw?.fin, fallbackEnd);

  return {
    id: Number(raw?.id ?? raw?.configId ?? Date.now()),
    medId,
    medName: String(raw?.medicineName ?? raw?.medicinaNombre ?? raw?.medName ?? medNames[medId] ?? "Medicamento"),
    dosis: String(raw?.dosis ?? raw?.dosisPorToma ?? "Sin dosis"),
    frecHoras: Number(raw?.frequencyHours ?? raw?.frecuenciaHoras ?? raw?.frecHoras ?? 8) || 8,
    inicio: toLocal(inicio),
    fin: toLocal(fin),
    instrucciones: String(raw?.instrucciones ?? ""),
    activo: (raw?.active ?? raw?.activo) !== false
  };
}

export function alarmaStatus(alarm) {
  const now = new Date();
  if (!alarm.activo) return "paused";
  if (new Date(alarm.fin) < now) return "ended";
  return "active";
}
