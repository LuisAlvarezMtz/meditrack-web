import { createBlockingConfirmationModal } from "../../core/helpers/confirmation-modal.js";

let deleteConfirmation = null;

function getDeleteConfirmation(elements) {
    if (!deleteConfirmation) {
        deleteConfirmation = createBlockingConfirmationModal({
            modal: elements.modalDeleteConfirm,
            confirmButton: elements.btnConfirmDelete,
            cancelButton: elements.btnCancelDelete,
            closeButton: elements.btnCloseDeleteConfirm,
            idleConfirmText: "Eliminar",
            pendingConfirmText: "Eliminando...",
            showModal: () => elements.modalDeleteConfirm.classList.add("active"),
            hideModal: () => elements.modalDeleteConfirm.classList.remove("active"),
            isModalOpen: () => elements.modalDeleteConfirm.classList.contains("active")
        });
    }

    return deleteConfirmation;
}

export function setMedicinasLoading(elements) {
    elements.medContainer.innerHTML = '<p class="med-loading">Cargando medicinas...</p>';
}

export function setMedicinasLoadError(elements) {
    elements.medContainer.innerHTML = '<p class="med-loading">No se pudieron cargar las medicinas.</p>';
}

export function closeAccountMenu(elements) {
    elements.accountMenuWrap.classList.remove("open");
    elements.accountMenuBtn.setAttribute("aria-expanded", "false");
}

export function closePatientSelector(elements) {
    elements.patientProfileSelectorWrap.classList.remove("open");
    elements.patientProfileSelectorBtn.setAttribute("aria-expanded", "false");
}

export function setPatientHeader(elements, state, paciente = {}) {
    state.pacienteNombre = paciente.name || state.pacienteNombre || "Paciente";
    elements.patientNameTitle.textContent = state.pacienteNombre;
    elements.patientSubtitle.textContent = `Cuidador: ${state.cuidadorNombre}`;
    elements.patientMeta.textContent = `Edad: ${paciente.age ?? paciente.edad ?? "--"}`;

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(state.pacienteNombre)}&background=0D8ABC&color=fff`;
    elements.patientAvatar.src = avatarUrl;
    elements.patientAvatar.alt = `Avatar de ${state.pacienteNombre}`;
}

export function renderPatientSelectorDropdown(elements, state) {
    elements.patientProfileDropdown.innerHTML = "";

    state.pacientes.forEach((paciente) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "patient-option";
        option.dataset.patientId = String(paciente.id);
        option.textContent = paciente.name || `Paciente ${paciente.id}`;

        if (String(paciente.id) === String(state.pacienteId)) {
            option.classList.add("active");
        }

        elements.patientProfileDropdown.appendChild(option);
    });
}

export function renderMedicinas(elements, lista, alarmasConfig = []) {
    elements.medContainer.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
        elements.medContainer.innerHTML = '<p class="med-loading">Este paciente no tiene medicinas registradas.</p>';
        return;
    }

    lista.forEach((med) => {
        const tieneAlarma = Array.isArray(alarmasConfig)
            ? alarmasConfig.some(a => Number(a.medicineId ?? a.medicinaId) === Number(med.id))
            : isReminderActive(med);
        const reminderClass = tieneAlarma ? "btn-reminder has-alarm" : "btn-reminder";
        const reminderTitle = tieneAlarma ? "Ver configuración de alarma" : "Configurar alarma";

        const card = document.createElement("div");
        card.className = "med-card glass-card";
        card.innerHTML = `
            <button class="btn-delete" data-id="${med.id}" title="Eliminar" type="button">✖</button>
            <div>
                <span class="type">${med.dosageForm || "-"}</span>
                <h4>${med.name ?? med.nombre ?? "-"}</h4>
                <p class="med-expiration">Expira: ${formatDate(med.expirationDate)}</p>
            </div>
            <div class="card-footer">
                <span class="registered-by">Registrado por: ${med.registeredByName ?? med.registradoPorNombre ?? "--"}</span>
                <div class="card-actions">
                    <button class="btn-edit" data-id="${med.id}" type="button">✏️</button>
                    <button class="${reminderClass}" data-id="${med.id}" title="${reminderTitle}" type="button">⏰</button>
                </div>
            </div>
        `;

        elements.medContainer.appendChild(card);
    });
}

export function renderQuickStats(elements, lista = []) {
    const total = Array.isArray(lista) ? lista.length : 0;
    const porVencer = Array.isArray(lista)
        ? lista.filter((med) => estaPorVencer(med.expirationDate, 30)).length
        : 0;

    elements.quickTotalMedicinas.textContent = String(total);
    elements.quickPorVencer.textContent = String(porVencer);
}

export function openCreateModal(elements) {
    elements.modalTitle.textContent = "Registrar Medicina";
    elements.medForm.reset();
    elements.editId.value = "";
    _clearFieldErrors(elements);
    setFormFieldsEnabled(elements, true);
    elements.modalMed.classList.add("active");
}

export function closeModal(elements) {
    if (elements.medForm?.dataset.submitting === "true") return;

    elements.modalMed.classList.remove("active");
    elements.medForm.reset();
    elements.editId.value = "";
    setFormFieldsEnabled(elements, true);
}

export function fillEditModal(elements, med) {
    elements.modalTitle.textContent = "Editar Medicina";
    elements.editId.value = med.id;
    elements.name.value = med.name ?? med.nombre ?? "";
    setDosageFormValue(elements, med.dosageForm || "Tableta");
    elements.expirationDate.value = normalizeDateForInput(med.expirationDate);
    _clearFieldErrors(elements);
    setFormFieldsEnabled(elements, true);
    elements.modalMed.classList.add("active");
}

export function getFormPayload(elements) {
    return {
        name: elements.name.value.trim(),
        dosageForm: elements.dosageForm.value,
        expirationDate: elements.expirationDate.value
    };
}

export function syncPatientInUrl(state, pacienteId) {
    const paciente = state.pacientes.find((p) => String(p.id) === String(pacienteId));
    const params = new URLSearchParams(window.location.search);

    params.set("pacienteId", String(pacienteId));
    if (paciente?.name) {
        params.set("pacienteNombre", paciente.name);
    }

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
}

export function solicitarConfirmacionEliminacion(elements) {
    return getDeleteConfirmation(elements).open();
}

export function responderConfirmacionEliminacion(elements, confirmado) {
    getDeleteConfirmation(elements).respond(confirmado);
}

export function closeDeleteConfirmation(elements) {
    getDeleteConfirmation(elements).close();
}

export function setDeleteConfirmationLocked(elements, locked) {
    getDeleteConfirmation(elements).setLocked(locked);
}

function normalizeDateForInput(value) {
    if (!value) return "";
    return value.includes("T") ? value.split("T")[0] : value;
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("es-MX");
}

function setDosageFormValue(elements, value) {
    const found = Array.from(elements.dosageForm.options).some((opt) => opt.value === value);

    if (!found && value) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        elements.dosageForm.appendChild(option);
    }

    elements.dosageForm.value = value;
}

function setFormFieldsEnabled(elements, enabled) {
    elements.name.disabled = !enabled;
    elements.dosageForm.disabled = !enabled;
    elements.expirationDate.disabled = !enabled;
}

function _clearFieldErrors(elements) {
    [elements.name, elements.expirationDate].forEach(el => {
        el.classList.remove("input-error");
        el.parentElement.querySelector(".field-error-msg")?.remove();
    });
}

function isReminderActive(med = {}) {
    return Boolean(
        med.recordatorioActivo
        || med.alarmaActiva
        || med.tieneAlarma
        || med.reminderActive
    );
}

function estaPorVencer(expirationDate, diasLimite) {
    if (!expirationDate) return false;

    const fechaExp = new Date(expirationDate);
    if (Number.isNaN(fechaExp.getTime())) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + diasLimite);

    return fechaExp >= hoy && fechaExp <= limite;
}
