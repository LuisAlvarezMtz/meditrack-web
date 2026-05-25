import { abrirModalAlarma } from "./medicamentos.alarma.js"; 
import { abrirModalEditar } from "./medicamentos.modal.js";

const container = document.getElementById("medContainer");

export function renderMeds(lista, alarmasConfig = []) {
    container.innerHTML = "";

    if (!lista || lista.length === 0) {
        container.innerHTML = "<p>No tienes medicinas registradas.</p>";
        return;
    }

    lista.forEach((med) => {
        const tieneAlarma = alarmasConfig.some(a => (a.medicineId ?? a.medicinaId) == med.id);
        const reminderClass = tieneAlarma ? "btn-reminder has-alarm" : "btn-reminder";
        const medicineName = med.name ?? med.nombre ?? "Sin nombre";
        const registeredBy = med.registeredByName ?? med.registradoPorNombre ?? med.registeredBy ?? med.registradoPor ?? "--";
        const reminderTitle = tieneAlarma ? "Ver configuración de alarma" : "Configurar alarma";

        container.insertAdjacentHTML("beforeend", `
            <div class="med-card glass-card" data-id="${med.id}">
                <button class="btn-delete" data-id="${med.id}" title="Eliminar">✖</button>
                <div>
                    <span class="type">${med.dosageForm ?? "-"}</span>
                    <h4>${medicineName}</h4>
                    <p style="font-size: 0.8rem; color: #64748b;">
                        Expira: ${formatDate(med.expirationDate)}
                    </p>
                </div>
                <div class="card-footer">
                    <span class="registered-by">
                        Registrado por: ${registeredBy}
                    </span>
                    <div class="card-actions">
                        <button class="btn-edit" data-id="${med.id}">✏️</button>
                        <button class="${reminderClass}" data-id="${med.id}" title="${reminderTitle}">⏰</button>
                    </div>
                </div>
            </div>
        `);
    });
}

function formatDate(dateStr) {
    if(!dateStr) return "--/--/--";
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}/${year}`;
}
