import { logout } from "../../core/auth.js";
import { notifyError, notifySuccess } from "../../core/notify.js";
import * as data from "./cuidador-medicinas.data.js";
import {
    bindCuidadorMedicinasEvents
} from "./cuidador-medicinas.events.js";
import * as dom from "./cuidador-medicinas.dom.js";
import {
    cuidadorMedicinasState as state,
    getCuidadorMedicinasElements,
    hasRequiredCuidadorMedicinasElements
} from "./cuidador-medicinas.state.js";
import { createCuidadorMedicinasActions } from "./cuidador-medicinas.actions.js";
import { createCuidadorAlarmaModule } from "./cuidador-medicinas.alarma.js";

export async function initCuidadorMedicinasPage() {
    const elements = getCuidadorMedicinasElements();
    if (!hasRequiredCuidadorMedicinasElements(elements)) {
        console.error("Cuidador medicinas: faltan elementos requeridos en el DOM.");
        return;
    }

    const actions = createCuidadorMedicinasActions({
        elements,
        state,
        data,
        dom,
        notify: {
            error: notifyError,
            success: notifySuccess
        }
    });

    if (!actions.validarRolCuidador()) {
        return;
    }

    actions.setTopbarData();

    const alarmaModule = createCuidadorAlarmaModule({
        elements,
        state,
        notify: { error: notifyError, success: notifySuccess },
        onAlarmaGuardada: () => dom.renderMedicinas(elements, state.lista, state.alarmasConfig)
    });
    alarmaModule.init();

    bindCuidadorMedicinasEvents(elements, {
        onCloseAccountMenu: () => dom.closeAccountMenu(elements),
        onClosePatientSelector: () => dom.closePatientSelector(elements),
        onCloseModal: () => dom.closeModal(elements),
        onCloseAlarmaModal: () => alarmaModule.cerrar(),
        onDeleteConfirmChoice: (confirmado) => dom.responderConfirmacionEliminacion(elements, confirmado),
        onLogout: () => logout(),
        onChangePaciente: async (pacienteId) => actions.cambiarPaciente(pacienteId),
        onOpenCreateModal: () => dom.openCreateModal(elements),
        onSubmitForm: async () => actions.guardarDesdeFormulario(),
        onEditMedicina: async (id, button) => actions.abrirEdicion(id, button),
        onDeleteMedicina: async (id) => actions.eliminarMedicina(id),
        onReminderClick: (id) => {
            const med = state.lista.find(m => String(m.id) === String(id));
            alarmaModule.abrir(Number(id), med?.name ?? med?.nombre ?? "");
        }
    });

    await actions.bootstrapPacientes();
}
