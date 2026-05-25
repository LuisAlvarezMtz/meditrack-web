import {
    registrarMedicina,
    actualizarMedicina
} from "../../services/medicina.service.js";
import { notifyError, notifySuccess } from "../../core/notify.js";
import { createFormSubmitLock } from "../../core/helpers/form-submit-lock.js";
import { medicamentosState } from "./medicamentos.state.js";

import { cargarMedicamentos } from "./medicamentos.controller.js";

const modal = document.getElementById("modalMed");
const form = document.getElementById("medForm");
const modalTitle = document.getElementById("modalTitle");
const editIdInput = document.getElementById("editId");
const nameInput = document.getElementById("name");
const dosageFormInput = document.getElementById("dosageForm");
const expirationDateInput = document.getElementById("expirationDate");
const submitButton = form?.querySelector(".btn-save");
const openModalButton = document.getElementById("btnOpenModal");
const closeModalButton = document.getElementById("btnCloseModal");
const submitLock = createFormSubmitLock({
    form,
    submitButton,
    fields: [nameInput, dosageFormInput, expirationDateInput],
    buttons: [openModalButton, closeModalButton],
    getIdleText: ({ isEditing }) => isEditing ? "Guardar Cambios" : "Registrar Medicina",
    getPendingText: ({ isEditing }) => isEditing ? "Actualizando..." : "Registrando..."
});

export function initMedicamentosModal() {

    document.getElementById("btnOpenModal").onclick = () => {
        if (medicamentosState.guardando) return;
        modalTitle.innerText = "Registrar Medicina";
        form.reset();
        editIdInput.value = "";
        _clearFieldErrors();
        setSubmitState(false, false);
        modal.classList.add("active");
    };

    document.getElementById("btnCloseModal").onclick = () => {
        if (medicamentosState.guardando) return;
        modal.classList.remove("active");
    };

    form.onsubmit = async (e) => {
        e.preventDefault();

        if (medicamentosState.guardando) return;

        const fields = [
            { el: nameInput,           valid: !!nameInput.value.trim() },
            { el: expirationDateInput, valid: !!expirationDateInput.value }
        ];

        let hasError = false;
        fields.forEach(({ el, valid }) => {
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
                    if (el.value.trim()) {
                        el.classList.remove("input-error");
                        errMsg?.remove();
                        el.removeEventListener("input", clear);
                    }
                });
            } else if (errMsg) {
                errMsg.remove();
            }
        });

        if (hasError) return;

        const id = editIdInput.value;
        const isEditing = Boolean(id);

        const dto = {
            name: nameInput.value.trim(),
            dosageForm: dosageFormInput.value,
            expirationDate: expirationDateInput.value
        };

        try {
            medicamentosState.guardando = true;
            setSubmitState(true, isEditing);

            if (id) {
                await actualizarMedicina(id, dto);
                notifySuccess("Medicina actualizada correctamente");
            } else {
                await registrarMedicina(dto);
                notifySuccess("Medicina registrada correctamente");
            }

            modal.classList.remove("active");
            form.reset();
            editIdInput.value = "";
            await cargarMedicamentos();
        } catch (error) {
            console.error("Error al guardar medicina:", error);
            notifyError(error.message || "No se pudo guardar la medicina");
        } finally {
            medicamentosState.guardando = false;
            setSubmitState(false, isEditing);
        }
    };
}

export function abrirModalEditar(med) {
    if (!med) {
        notifyError("No se encontró la medicina seleccionada");
        return;
    }

    modalTitle.innerText = "Editar Medicina";
    editIdInput.value = med.id;
    nameInput.value = med.name ?? med.nombre ?? "";
    dosageFormInput.value = med.dosageForm;
    expirationDateInput.value =
        med.expirationDate.split("T")[0];

    _clearFieldErrors();
    setSubmitState(false, true);

    modal.classList.add("active");
}

function setSubmitState(isSubmitting, isEditing) {
    submitLock.setLocked(isSubmitting, { isEditing });
}

function _clearFieldErrors() {
    [nameInput, expirationDateInput].forEach(el => {
        el.classList.remove("input-error");
        el.parentElement.querySelector(".field-error-msg")?.remove();
    });
}
