import { cuidadorAlarmasState } from "./cuidador-alarmas.state.js";
import { renderAlarms, renderDetail, renderDetailEdit } from "./cuidador-alarmas.render.js";
import { deleteAlarm, updateAlarm } from "./cuidador-alarmas.controller.js";
import { initHistoryView } from "./cuidador-alarmas.history.js";

export function bindUiEvents() {
  document.querySelectorAll(".tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(x => x.classList.remove("active"));
      tab.classList.add("active");
      const filter = tab.dataset.filter;
      cuidadorAlarmasState.currentFilter = filter;
      cuidadorAlarmasState.selectedId = null;

      const layout = document.querySelector(".list-detail-layout");
      const alarmList = document.getElementById("alarmList");
      const searchBox = document.querySelector(".search-box");
      const historyContent = document.getElementById("historyContent");

      if (filter === "history") {
        layout?.classList.add("show-history");
        if(alarmList) alarmList.style.display = "none";
        if(searchBox) searchBox.style.display = "none";
        if(historyContent) historyContent.style.display = "flex";
        initHistoryView();
      } else {
        layout?.classList.remove("show-history");
        if(alarmList) alarmList.style.display = "flex";
        if(searchBox) searchBox.style.display = "flex";
        if(historyContent) historyContent.style.display = "none";
        renderAlarms();
      }
    });
  });

  document.getElementById("searchInput").addEventListener("input", e => {
    cuidadorAlarmasState.searchQuery = e.target.value;
    renderAlarms();
  });

  document.getElementById("detailPanel").addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "delete")      deleteAlarm(id);
    if (btn.dataset.action === "edit") {
      const alarm = cuidadorAlarmasState.alarms.find(a => Number(a.id) === id);
      if (alarm) renderDetailEdit(alarm);
    }
    if (btn.dataset.action === "cancel-edit") renderDetail();
    if (btn.dataset.action === "save-edit")   _handleSaveEdit(id);
  });
}

async function _handleSaveEdit(id) {
  const alarm = cuidadorAlarmasState.alarms.find(a => Number(a.id) === id);
  if (!alarm) return;

  const inicioEl = document.getElementById("editFechaInicio");
  const finEl    = document.getElementById("editFechaFin");
  const frecEl   = document.getElementById("editFrecuencia");

  const inicio    = inicioEl?.value;
  const fin       = finEl?.value;
  const frecHoras = Number(frecEl?.value);

  const fields = [
    { el: inicioEl, valid: !!inicio },
    { el: finEl,    valid: !!fin },
    { el: frecEl,   valid: !!frecHoras }
  ];

  let hasError = false;
  fields.forEach(({ el, valid }) => {
    if (!el) return;
    el.classList.toggle("input-error", !valid);
    let errMsg = el.parentElement.querySelector(".edit-field-error");
    if (!valid) {
      hasError = true;
      if (!errMsg) {
        errMsg = document.createElement("span");
        errMsg.className = "edit-field-error";
        errMsg.textContent = "Este campo es obligatorio";
        el.parentElement.appendChild(errMsg);
      }
      el.addEventListener("input", function clear() {
        if (el.value) {
          el.classList.remove("input-error");
          errMsg?.remove();
          el.removeEventListener("input", clear);
        }
      }, { once: false });
    } else if (errMsg) {
      errMsg.remove();
    }
  });

  if (hasError) return;

  const btn = document.querySelector(`[data-action="save-edit"][data-id="${id}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Actualizando...";
  }

  try {
    await updateAlarm(id, {
      medicineId:      Number(alarm.medId),
      patientId:       Number(cuidadorAlarmasState.pacienteId),
      startDate:       inicio,
      endDate:         fin,
      frequencyHours:  frecHoras
    });
  } catch {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Actualizar alarma";
    }
  }
}
