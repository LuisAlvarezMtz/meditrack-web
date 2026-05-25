import { sanitizePhoneValue } from "../../utils/form-validation.js";

function resolveFullName(cuidador) {
    return String(cuidador?.name || "Cuidador").trim() || "Cuidador";
}

export function renderPerfilCuidador(elements, cuidador, pacientes) {
    const fullName = String(cuidador?.name || "Cuidador").trim() || "Cuidador";
    const topbarName = fullName.split(" ").slice(0, 2).join(" ") || "Cuidador";
    const initials = fullName
        .split(" ")
        .map((part) => part[0] || "")
        .join("")
        .substring(0, 2)
        .toUpperCase();

    elements.profileStatus.textContent = "";
    elements.caregiverName.textContent = fullName;
    elements.caregiverAvatar.textContent = initials;

    if (elements.topbarCaregiverName) {
        elements.topbarCaregiverName.textContent = topbarName;
    }

    if (elements.topbarCaregiverAvatar) {
        elements.topbarCaregiverAvatar.textContent = initials;
    }

    elements.inputName.value = fullName;
    elements.inputPhone.value = sanitizePhoneValue(cuidador?.phoneNumber || "");
    elements.inputOcupacion.value = String(cuidador?.occupation ?? cuidador?.ocupacion ?? "").trim();
    elements.infoCodigo.textContent = cuidador?.linkCode ?? cuidador?.codigoVinculacion ?? "No disponible";
    elements.infoPacientes.textContent = String(Array.isArray(pacientes) ? pacientes.length : 0);
}

export function setPerfilCuidadorEditMode(elements, isEditing) {
    elements.inputName.disabled = !isEditing;
    elements.inputPhone.disabled = !isEditing;
    elements.inputOcupacion.disabled = !isEditing;
    elements.profileActions.classList.toggle("hidden", !isEditing);
    elements.btnEditProfile.textContent = isEditing ? "Viendo Perfil" : "Editar Perfil";
}

export function resetPerfilCuidadorForm(elements, cuidador) {
    const fullName = resolveFullName(cuidador);
    elements.inputName.value = fullName;
    elements.inputPhone.value = sanitizePhoneValue(cuidador?.phoneNumber || "");
    elements.inputOcupacion.value = String(cuidador?.occupation ?? cuidador?.ocupacion ?? "").trim();
}

export function getPerfilCuidadorDTO(elements) {
    return {
        name: String(elements.inputName.value || "").trim(),
        phoneNumber: sanitizePhoneValue(elements.inputPhone.value),
        occupation: String(elements.inputOcupacion.value || "").trim()
    };
}

export function renderPerfilCuidadorError(elements) {
    elements.profileStatus.textContent = "No se pudo cargar la información del perfil";
}

export function setSavingState(elements, isSaving, modoEdicion) {
    elements.btnSaveProfile.disabled = isSaving;
    elements.btnCancelProfile.disabled = isSaving;
    elements.btnEditProfile.disabled = isSaving;
    elements.inputName.disabled = isSaving || !modoEdicion;
    elements.inputPhone.disabled = isSaving || !modoEdicion;
    elements.inputOcupacion.disabled = isSaving || !modoEdicion;
    elements.btnContinueReauth.disabled = isSaving;
    elements.btnCancelReauth.disabled = isSaving;
    elements.btnSaveProfile.textContent = isSaving ? "Guardando..." : "Guardar Cambios";
}

export function openReauthModal(elements) {
    elements.reauthModal.classList.remove("hidden");
    elements.reauthModal.setAttribute("aria-hidden", "false");
}

export function closeReauthModal(elements) {
    elements.reauthModal.classList.add("hidden");
    elements.reauthModal.setAttribute("aria-hidden", "true");
}
