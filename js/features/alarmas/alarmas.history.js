import { obtenerHistorial } from "../../services/alarma.service.js";

const historyContent = document.getElementById("historyContent");
const btnPrevWeek = document.getElementById("btnPrevWeek");
const btnNextWeek = document.getElementById("btnNextWeek");
const historyDatePicker = document.getElementById("historyDatePicker");
const historyDateRange = document.getElementById("historyDateRange");
const historyStatsContainer = document.getElementById("historyStatsContainer");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const historyLoading = document.getElementById("historyLoading");

const hStatTomadas = document.getElementById("hStatTomadas");
const hStatOmitidas = document.getElementById("hStatOmitidas");
const hStatPendientes = document.getElementById("hStatPendientes");
const hAdherenceText = document.getElementById("hAdherenceText");
const hAdherenceBar = document.getElementById("hAdherenceBar");

let currentDate = new Date();
let isHistoryInitialized = false;

const urlParams = new URLSearchParams(window.location.search);
const pacienteId = urlParams.get("pacienteId") || null;
const STATUS_LABEL = {
  PENDING: "Pendiente",
  TAKEN: "Tomada",
  OMITTED: "Omitida"
};

function getTakeStatus(item = {}) {
  return item.status ?? item.estado ?? "";
}

function getScheduledAt(item = {}) {
  return item.scheduledAt ?? item.fechaHora ?? "";
}

function getMedicineName(item = {}) {
  return item.medicineName ?? item.medicinaNombre ?? "Medicamento";
}

export function initHistoryView() {
  if (isHistoryInitialized) {
    loadWeek(currentDate);
    return;
  }
  
  btnPrevWeek.addEventListener("click", () => navigateWeek(-1));
  btnNextWeek.addEventListener("click", () => navigateWeek(1));
  
  historyDatePicker.addEventListener("change", (e) => {
    if (e.target.value) {
      currentDate = new Date(e.target.value + "T00:00:00");
      loadWeek(currentDate);
    }
  });

  isHistoryInitialized = true;
  loadWeek(currentDate);
}

function navigateWeek(direction) {
  currentDate.setDate(currentDate.getDate() + (direction * 7));
  loadWeek(currentDate);
}

function getStartAndEndOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function formatDateRange(start, end) {
  const startDay = start.getDate();
  const startMonth = start.getMonth();
  const endDay = end.getDate();
  const endMonth = end.getMonth();
  const endYear = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} de ${MESES[startMonth]} ${endYear}`;
  } else {
    return `${startDay} de ${MESES[startMonth]} - ${endDay} de ${MESES[endMonth]} ${endYear}`;
  }
}

async function loadWeek(date) {
  const { start, end } = getStartAndEndOfWeek(date);
  const startStr = formatDateISO(start);
  const endStr = formatDateISO(end);
  
  historyDateRange.textContent = formatDateRange(start, end);
  
  showLoading();

  try {
    const data = await obtenerHistorial(pacienteId, startStr, endStr);
    renderHistory(data);
  } catch (error) {
    console.error("Error cargando historial", error);
    showEmpty();
  }
}

function showLoading() {
  historyList.style.display = "none";
  historyStatsContainer.style.display = "none";
  historyEmpty.style.display = "none";
  historyLoading.style.display = "flex";
}

function showEmpty() {
  historyLoading.style.display = "none";
  historyList.style.display = "none";
  historyStatsContainer.style.display = "none";
  historyEmpty.style.display = "flex";
}

function renderHistory(data) {
  historyLoading.style.display = "none";
  
  if (!data || data.length === 0) {
    showEmpty();
    return;
  }

  historyEmpty.style.display = "none";
  
  let tomadas = 0, omitidas = 0, pendientes = 0;
  data.forEach(item => {
    const status = getTakeStatus(item);
    if (status === "TAKEN") tomadas++;
    else if (status === "OMITTED") omitidas++;
    else pendientes++;
  });
  
  const total = data.length;
  const adherence = total > 0 ? Math.round((tomadas / total) * 100) : 0;
  
  hStatTomadas.textContent = tomadas;
  hStatOmitidas.textContent = omitidas;
  hStatPendientes.textContent = pendientes;
  hAdherenceText.textContent = `${adherence}%`;
  hAdherenceBar.style.width = `${adherence}%`;
  
  historyStatsContainer.style.display = "block";
  historyList.style.display = "flex";
  
  const grouped = data.reduce((acc, item) => {
    const dStr = getScheduledAt(item).split("T")[0];
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  
  historyList.innerHTML = "";
  
  sortedDates.forEach(dateStr => {
    const groupEl = document.createElement("div");
    groupEl.className = "history-day-group";
    
    const titleEl = document.createElement("div");
    titleEl.className = "history-day-title";
    titleEl.textContent = getRelativeDayName(dateStr);
    groupEl.appendChild(titleEl);
    
    const items = grouped[dateStr].sort((a, b) => getScheduledAt(b).localeCompare(getScheduledAt(a)));
    
    items.forEach(item => {
      const status = getTakeStatus(item);
      const timeStr = getScheduledAt(item).split("T")[1].substring(0, 5);
      
      let icon = "⏳";
      let badgeClass = "badge-pendiente";
      if (status === "TAKEN") { icon = "OK"; badgeClass = "badge-tomada"; }
      if (status === "OMITTED") { icon = "X"; badgeClass = "badge-omitida"; }
      
      let shapeText = "";
      if (item.dosageForm) {
        shapeText = ` &middot; ${item.dosageForm.toLowerCase()}`;
      }

      const itemEl = document.createElement("div");
      itemEl.className = "history-item";
      itemEl.innerHTML = `
        <div class="h-item-icon">${icon}</div>
        <div class="h-item-info">
          <span class="h-item-name">${getMedicineName(item)}<span style="font-weight: normal; color: var(--text-muted);">${shapeText}</span></span>
        </div>
        <div class="h-item-time">${timeStr}</div>
        <span class="badge ${badgeClass}">${STATUS_LABEL[status] ?? status}</span>
      `;
      groupEl.appendChild(itemEl);
    });
    
    historyList.appendChild(groupEl);
  });
}

function getRelativeDayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.getTime() === today.getTime()) return "Hoy";
  if (d.getTime() === yesterday.getTime()) return "Ayer";
  
  const dayName = DIAS[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MESES[d.getMonth()];
  return `${dayName} ${dayNum} de ${monthName}`;
}

