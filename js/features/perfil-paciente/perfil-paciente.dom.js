import { sanitizePhoneValue } from "../../utils/form-validation.js";

function resolveFullName(paciente) {
    return String(paciente?.name || paciente?.nombre || "").trim() || "Paciente";
}

export function renderPerfilPaciente(elements, paciente) {
    console.log("RENDER PACIENTE:", paciente);
    const fullName = resolveFullName(paciente);
    const initials = fullName
        .split(" ")
        .map((part) => part[0] || "")
        .join("")
        .substring(0, 2)
        .toUpperCase();

    if (elements.patientName) {
        elements.patientName.textContent = fullName;
    }
    if (elements.patientAvatar) {
        elements.patientAvatar.textContent = initials;
    }

    if (elements.topbarPatientName) {
        elements.topbarPatientName.textContent = fullName.split(" ").slice(0, 2).join(" ");
    }
    if (elements.topbarPatientAvatar) {
        elements.topbarPatientAvatar.textContent = initials;
    }

    elements.inputName.value = String(paciente?.name || paciente?.nombre || "").trim();
    elements.inputPhone.value = sanitizePhoneValue(paciente?.phoneNumber || "");
    elements.inputEdad.value = paciente?.age ?? paciente?.edad ?? "";
    elements.inputCurp.value = String(paciente?.curp || "").trim();
}

export function setPerfilPacienteEditMode(elements, isEditing) {
    elements.inputName.disabled = !isEditing;
    elements.inputPhone.disabled = !isEditing;
    elements.inputEdad.disabled = !isEditing;
    elements.inputCurp.disabled = !isEditing;
    elements.profileActions.classList.toggle("hidden", !isEditing);
    elements.addDiseaseBox.classList.toggle("hidden", !isEditing);
    elements.btnEditProfile.textContent = isEditing ? "Viendo Perfil" : "Editar Perfil";
}

export function resetPerfilPacienteForm(elements, paciente, enfermedades) {
    elements.inputName.value = String(paciente?.name || paciente?.nombre || "").trim();
    elements.inputPhone.value = sanitizePhoneValue(paciente?.phoneNumber || "");
    elements.inputEdad.value = paciente?.age ?? paciente?.edad ?? "";
    elements.inputCurp.value = String(paciente?.curp || "").trim();
}

export function getPerfilPacienteDTO(elements, enfermedades) {
    return {
        name: String(elements.inputName.value || "").trim(),
        phoneNumber: sanitizePhoneValue(elements.inputPhone.value),
        age: Number(elements.inputEdad.value),
        curp: elements.inputCurp.value.trim()
            ? elements.inputCurp.value.trim().toUpperCase()
            : null,
        chronicDiseases: enfermedades.length ? [...enfermedades] : null
    };
}

export function setSavingState(elements, isSaving, modoEdicion) {
    elements.btnSaveProfile.disabled = isSaving;
    elements.btnCancelProfile.disabled = isSaving;
    elements.btnEditProfile.disabled = isSaving;
    elements.inputName.disabled = isSaving || !modoEdicion;
    elements.inputPhone.disabled = isSaving || !modoEdicion;
    elements.inputEdad.disabled = isSaving || !modoEdicion;
    elements.inputCurp.disabled = isSaving || !modoEdicion;
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

export function mostrarPerfilCargado() {
    const loadingDiv = document.getElementById("loading");
    const profileCard = document.getElementById("profile-card");
    if (loadingDiv) loadingDiv.classList.add("hidden");
    if (profileCard) profileCard.classList.remove("hidden");
}
