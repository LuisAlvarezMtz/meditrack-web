import { crearAlarmaConfig } from "../../services/alarma.service.js";
import { notifyError, notifySuccess } from "../../core/notify.js";
import { medicamentosState } from "./medicamentos.state.js";

const modal = document.getElementById("modalAlarma");
const form = document.getElementById("alarmaForm");
const title = document.getElementById("modalAlarmaTitle");
const medicinaNombreLabel = document.getElementById("modalAlarmaMedicinaNombre");
const btnGuardar = document.getElementById("btnGuardarAlarma");
const btnVerDetalles = document.getElementById("btnVerDetallesAlarma");

function cerrarModalAlarma() {
    modal.classList.remove("active");
}

function _mostrarModoCrear() {
    title.textContent = "Programar recordatorio";
    form.reset();
    ["fechaInicio", "fechaFin", "frecuenciaHoras"].forEach(id => {
        const el = document.getElementById(id);
        el.disabled = false;
        el.classList.remove("input-error");
        el.parentElement.querySelector(".field-error-msg")?.remove();
    });
    btnGuardar.style.display = "";
    btnVerDetalles.style.display = "none";
}

function _mostrarModoVer(config) {
    title.textContent = "Configuración de alarma";
    document.getElementById("fechaInicio").value = (config.startDate ?? config.fechaInicio)?.slice(0, 16) ?? "";
    document.getElementById("fechaFin").value = (config.endDate ?? config.fechaFin)?.slice(0, 16) ?? "";
    document.getElementById("frecuenciaHoras").value = config.frequencyHours ?? config.frecuenciaHoras;
    ["fechaInicio", "fechaFin", "frecuenciaHoras"].forEach(id => {
        document.getElementById(id).disabled = true;
    });
    btnGuardar.style.display = "none";
    btnVerDetalles.style.display = "";
    const configId = config.id ?? config.configId ?? "";
    btnVerDetalles.href = `/pages/alarmas.html${configId ? "?id=" + configId : ""}`;
}

export function initAlarmaModal() {
    document.getElementById("btnCloseAlarma").onclick = () => cerrarModalAlarma();
    document.getElementById("btnCancelAlarma").onclick = () => cerrarModalAlarma();

    form.onsubmit = async (e) => {
        e.preventDefault();

        if (form.dataset.submitting === "true") return;

        const inicioEl = document.getElementById("fechaInicio");
        const finEl    = document.getElementById("fechaFin");
        const frecEl   = document.getElementById("frecuenciaHoras");

        const fields = [
            { el: inicioEl, valid: !!inicioEl?.value },
            { el: finEl,    valid: !!finEl?.value },
            { el: frecEl,   valid: !!frecEl?.value }
        ];

        let hasError = false;
        fields.forEach(({ el, valid }) => {
            if (!el) return;
            el.classList.toggle("input-error", !valid);
            let errMsg = el.parentElement.querySelector(".field-error-msg");
            if (!valid) {
                hasError = true;
                if (!errMsg) {
                    errMsg = document.createElement("span");
                    errMsg.className = "field-error-msg";
                    errMsg.textContent = "Este campo es obligatorio";
                    el.parentElement.appendChild(errMsg);
                }
                el.addEventListener("input", function clear() {
                    if (el.value) {
                        el.classList.remove("input-error");
                        errMsg?.remove();
                        el.removeEventListener("input", clear);
                    }
                });
                el.addEventListener("change", function clearSel() {
                    if (el.value) {
                        el.classList.remove("input-error");
                        errMsg?.remove();
                        el.removeEventListener("change", clearSel);
                    }
                });
            } else if (errMsg) {
                errMsg.remove();
            }
        });

        if (hasError) return;

        form.dataset.submitting = "true";
        btnGuardar.disabled = true;
        const originalText = btnGuardar.textContent;
        btnGuardar.textContent = "Guardando...";

        const dto = {
            medicineId: Number(document.getElementById("alarmaMedicinaId").value),
            startDate: inicioEl.value,
            endDate: finEl.value,
            frequencyHours: Number(frecEl.value)
        };

        try {
            const nuevaConfig = await crearAlarmaConfig(dto);

            // Actualizar estado local para que el ícono refleje la alarma sin recargar
            const medicinaId = dto.medicineId;
            const yaExiste = medicamentosState.alarmasConfig.findIndex(a => (a.medicineId ?? a.medicinaId) == medicinaId);
            const configGuardada = nuevaConfig ?? { ...dto };
            if (yaExiste >= 0) {
                medicamentosState.alarmasConfig[yaExiste] = configGuardada;
            } else {
                medicamentosState.alarmasConfig.push(configGuardada);
            }

            // Actualizar visualmente solo el botón de esa tarjeta
            const btn = document.querySelector(`.btn-reminder[data-id="${medicinaId}"]`);
            if (btn) {
                btn.classList.add("has-alarm");
                btn.title = "Ver configuración de alarma";
            }

            notifySuccess("Alarma configurada con exito");
            cerrarModalAlarma();
            form.reset();
        } catch (error) {
            console.error("Error al configurar alarma:", error);
            notifyError(error.message || "Hubo un error al guardar la alarma.");
        } finally {
            delete form.dataset.submitting;
            btnGuardar.disabled = false;
            btnGuardar.textContent = originalText;
        }
    };
}

// Funcion llamada desde el boton del reloj en el render
export function abrirModalAlarma(medicinaId, medicinaNombre = "", config = null) {
    document.getElementById("alarmaMedicinaId").value = medicinaId;
    medicinaNombreLabel.textContent = medicinaNombre;

    if (config) {
        _mostrarModoVer(config);
    } else {
        _mostrarModoCrear();
    }

    modal.classList.add("active");
}
