import {
    obtenerMisMedicinas,
    eliminarMedicina
} from "../../services/medicina.service.js";
import { obtenerMisAlarmasConfig } from "../../services/alarma.service.js";
import { notifyError, notifySuccess } from "../../core/notify.js";

import { medicamentosState } from "./medicamentos.state.js";
import { renderMeds } from "./medicamentos.render.js";
import {
    initMedicamentosModal,
    abrirModalEditar
} from "./medicamentos.modal.js";
import { createBlockingConfirmationModal } from "../../core/helpers/confirmation-modal.js";

const container = document.getElementById("medContainer");
const modalDeleteConfirm = document.getElementById("modalDeleteConfirm");
const btnCloseDeleteConfirm = document.getElementById("btnCloseDeleteConfirm");
const btnCancelDelete = document.getElementById("btnCancelDelete");
const btnConfirmDelete = document.getElementById("btnConfirmDelete");

const deleteConfirmation = createBlockingConfirmationModal({
    modal: modalDeleteConfirm,
    confirmButton: btnConfirmDelete,
    cancelButton: btnCancelDelete,
    closeButton: btnCloseDeleteConfirm,
    idleConfirmText: "Eliminar",
    pendingConfirmText: "Eliminando...",
    showModal: () => modalDeleteConfirm?.classList.add("active"),
    hideModal: () => modalDeleteConfirm?.classList.remove("active"),
    isModalOpen: () => modalDeleteConfirm?.classList.contains("active") === true
});

export async function cargarMedicamentos() {
    if (medicamentosState.cargando) return;

    medicamentosState.cargando = true;
    container.innerHTML = `<p class="med-loading">Cargando medicamentos...</p>`;

    try {
        [medicamentosState.lista, medicamentosState.alarmasConfig] = await Promise.all([
            obtenerMisMedicinas(),
            obtenerMisAlarmasConfig().catch(() => [])
        ]);
        renderMeds(medicamentosState.lista, medicamentosState.alarmasConfig);
    } catch (error) {
        console.error("Error al cargar medicamentos:", error);
        container.innerHTML = `<p class="med-loading">No se pudieron cargar los medicamentos.</p>`;
    } finally {
        medicamentosState.cargando = false;
    }
}


export function initMedicamentos() {
    if (medicamentosState.inicializado) {
        cargarMedicamentos();
        return;
    }

    medicamentosState.inicializado = true;
    initMedicamentosModal();
    initDeleteConfirmationModal();
    cargarMedicamentos();

    container.addEventListener("click", async (e) => {
        const id = e.target.dataset.id || e.target.closest("button")?.dataset.id;

        // Caso Eliminar 
        if (e.target.classList.contains("btn-delete")) {
            const isConfirmed = await solicitarConfirmacionEliminacion();
            if (!isConfirmed) return;

            try {
                await eliminarMedicina(id);
                await cargarMedicamentos();
                deleteConfirmation.close();
                notifySuccess("Medicina eliminada correctamente");
            } catch (error) {
                console.error("Error al eliminar medicina:", error);
                deleteConfirmation.setLocked(false);
                notifyError(error.message || "No se pudo eliminar la medicina");
            }
        }

        // Caso Editar 
        if (e.target.classList.contains("btn-edit")) {
            const med = medicamentosState.lista.find(m => m.id == id);
            abrirModalEditar(med);
        }

        // Caso Alarma 
        if (e.target.classList.contains("btn-reminder")) {
            const med = medicamentosState.lista.find(m => m.id == id);
            const config = medicamentosState.alarmasConfig.find(a => (a.medicineId ?? a.medicinaId) == id) ?? null;
            import("./medicamentos.alarma.js").then(module => {
                module.abrirModalAlarma(id, med?.name ?? med?.nombre ?? "", config);
            });
        }
    });
}

function initDeleteConfirmationModal() {
    deleteConfirmation.bind();
}

function solicitarConfirmacionEliminacion() {
    return deleteConfirmation.open();
}
