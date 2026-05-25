import { renderEnfermedades } from "./dashboard-cuidador.utils.js";
import { createBlockingConfirmationModal } from "../../core/helpers/confirmation-modal.js";
import { createFormSubmitLock } from "../../core/helpers/form-submit-lock.js";

let patientMenuDismissReady = false;
let unlinkConfirmReady = false;
let unlinkConfirmation = null;
let registerFormSubmitLock = null;

function getRegisterFormSubmitLock(elements) {
    if (!registerFormSubmitLock) {
        registerFormSubmitLock = createFormSubmitLock({
            form: elements.registerForm,
            submitButton: elements.registerSubmitButton,
            fields: [
                elements.registerForm?.name,
                elements.registerForm?.phoneNumber,
                elements.registerForm?.edad,
                elements.passwordInput,
                elements.confirmPasswordInput
            ],
            buttons: [
                elements.btnCloseModal,
                elements.btnAddPatient,
                elements.togglePasswordBtn,
                elements.toggleConfirmPasswordBtn
            ],
            getIdleText: () => "Registrar Paciente",
            getPendingText: () => "Registrando..."
        });
    }

    return registerFormSubmitLock;
}

function getUnlinkConfirmation(elements) {
    if (!unlinkConfirmation) {
        unlinkConfirmation = createBlockingConfirmationModal({
            modal: elements.modalUnlinkConfirm,
            confirmButton: elements.btnConfirmUnlink,
            cancelButton: elements.btnCancelUnlink,
            closeButton: elements.btnCloseUnlinkConfirm,
            idleConfirmText: "Desvincular",
            pendingConfirmText: "Desvinculando...",
            showModal: () => {
                elements.modalUnlinkConfirm.style.display = "flex";
            },
            hideModal: () => {
                elements.modalUnlinkConfirm.style.display = "none";
            },
            isModalOpen: () => elements.modalUnlinkConfirm.style.display === "flex"
        });
    }

    return unlinkConfirmation;
}

export function setPacientesLoading(elements, loading) {
    if (!loading) return;
    elements.patientContainer.innerHTML = `
        <div class="patients-loading">Cargando pacientes...</div>
    `;
}

export function cerrarAccountMenu(elements) {
    if (!elements.accountMenuWrap || !elements.accountMenuBtn) return;
    elements.accountMenuWrap.classList.remove("open");
    elements.accountMenuBtn.setAttribute("aria-expanded", "false");
}

export function cerrarModal(elements) {
    if (getRegisterFormSubmitLock(elements).isLocked()) return;

    elements.modal.style.display = "none";
    elements.registerForm.reset();
    elements.passwordInput.type = "password";
    elements.confirmPasswordInput.type = "password";
    elements.passwordInput.closest(".password-group")?.classList.remove("visible");
    elements.confirmPasswordInput.closest(".password-group")?.classList.remove("visible");
    elements.confirmPasswordInput.setCustomValidity("");
}

export function setRegisterFormLocked(elements, locked) {
    getRegisterFormSubmitLock(elements).setLocked(locked);
}

function closePatientMenus(container, except = null) {
    container.querySelectorAll(".patient-menu-wrap.open").forEach((menuWrap) => {
        if (except && menuWrap === except) return;

        menuWrap.classList.remove("open");
        const trigger = menuWrap.querySelector(".btn-menu");
        trigger?.setAttribute("aria-expanded", "false");
    });
}

function ensurePatientMenuDismissBehavior(elements) {
    if (patientMenuDismissReady) return;

    patientMenuDismissReady = true;

    window.addEventListener("click", () => {
        closePatientMenus(elements.patientContainer);
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closePatientMenus(elements.patientContainer);
        }
    });
}

export function closeUnlinkConfirmModal(elements) {
    getUnlinkConfirmation(elements).close();
}

export function setUnlinkConfirmationLocked(elements, locked) {
    getUnlinkConfirmation(elements).setLocked(locked);
}

function ensureUnlinkConfirmBindings(elements) {
    if (unlinkConfirmReady || !elements.modalUnlinkConfirm) return;
    unlinkConfirmReady = true;

    getUnlinkConfirmation(elements).bind();
}

function solicitarConfirmacionDesvincular(elements, pacienteNombre) {
    if (!elements.modalUnlinkConfirm) return Promise.resolve(false);

    ensureUnlinkConfirmBindings(elements);

    if (elements.unlinkConfirmMessage) {
        elements.unlinkConfirmMessage.textContent = `Se desvinculara a ${pacienteNombre}. Esta accion no se puede deshacer.`;
    }

    return getUnlinkConfirmation(elements).open();
}

export function renderSidebarStats(elements, pacientes) {
    const total = pacientes.length;
    const conCondiciones = pacientes.filter(
        p => {
            const list = p.chronicDiseases ?? p.enfermedadesCronicas;
            return Array.isArray(list) && list.length > 0;
        }
    ).length;

    if (elements.statTotalPacientes) elements.statTotalPacientes.textContent = total || "0";
    if (elements.statConCondiciones) elements.statConCondiciones.textContent = conCondiciones || "0";
}

export function renderSidebarStatsAsync(elements, { tomasVencidas, tomasProximas, medsPorVencer }) {
    if (elements.statTomasVencidas) elements.statTomasVencidas.textContent = tomasVencidas;
    if (elements.statTomasProximas) elements.statTomasProximas.textContent = tomasProximas;
    if (elements.statMedsPorVencer) elements.statMedsPorVencer.textContent = medsPorVencer;
}

export function renderPacientes(elements, pacientesConDetalle, handlers = {}) {
    ensurePatientMenuDismissBehavior(elements);

    elements.patientCount.textContent = `Pacientes Asignados (${pacientesConDetalle.length})`;
    elements.patientContainer.innerHTML = "";

    if (!pacientesConDetalle.length) {
        elements.patientContainer.innerHTML = `
            <div class="patients-loading">No hay pacientes registrados todavia.</div>
        `;
        return;
    }

    pacientesConDetalle.forEach(p => {
        const initials = p.name
            .split(" ")
            .map(n => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        const enfermedades = p.chronicDiseases ?? p.enfermedadesCronicas ?? [];

        const card = document.createElement("div");
        card.className = "patient-card";
        card.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%; margin-bottom: 0.8rem;">
                <div class="patient-avatar">${initials}</div>
                <div class="patient-info" style="flex: 1;">
                    <div style="margin-bottom: 0.6rem;">
                        <h4 style="margin: 0;">
                            ${p.name}, 
                            <span class="patient-age-inline">
                                ${p.age ?? p.edad ?? "N/A"} a\u00f1os
                            </span>
                        </h4>
                    </div>

                    <div class="patient-conditions">
                        ${renderEnfermedades(enfermedades, false)}
                    </div>
                </div>
            </div>

            <div class="patient-actions">
                <button class="btn-action btn-profile" data-id="${p.id}">
                    Ver Perfil
                </button>

                <button class="btn-action btn-medicine" data-id="${p.id}">
                    Medicinas
                </button>

                <button class="btn-action btn-notes">
                    Recordatorios
                </button>

                <div class="patient-menu-wrap">
                    <button class="btn-action btn-menu" type="button" aria-haspopup="menu" aria-expanded="false">
                        &#x22EE;
                    </button>
                    <div class="patient-menu-dropdown" role="menu">
                        <button class="patient-menu-item btn-unlink-patient" type="button" role="menuitem">
                            Desvincular paciente
                        </button>
                    </div>
                </div>
            </div>
        `;

        card.querySelector(".btn-profile")
            .addEventListener("click", () => {
                window.location.href = `../../pages/perfil-paciente.html?id=${p.id}`;
            });

        card.querySelector(".btn-medicine")
            .addEventListener("click", () => {
                const patientName = encodeURIComponent(p.name || "Paciente");
                window.location.href = `../../pages/cuidador-medicinas.html?pacienteId=${p.id}&pacienteNombre=${patientName}`;
            });

        card.querySelector(".btn-notes")
            .addEventListener("click", () => {
                const patientName = encodeURIComponent(p.name || "Paciente");
                window.location.href = `../../pages/cuidador-alarmas.html?pacienteId=${p.id}&pacienteNombre=${patientName}`;
            });

        const conditionsDiv = card.querySelector(".patient-conditions");
        conditionsDiv.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-see-more");
            if (!btn) return;

            const isExpanded = btn.dataset.expanded === "true";
            conditionsDiv.innerHTML = renderEnfermedades(
                enfermedades,
                !isExpanded
            );
        });

        const menuWrap = card.querySelector(".patient-menu-wrap");
        const menuButton = card.querySelector(".btn-menu");
        const unlinkButton = card.querySelector(".btn-unlink-patient");

        menuButton.addEventListener("click", (event) => {
            event.stopPropagation();

            const willOpen = !menuWrap.classList.contains("open");
            closePatientMenus(elements.patientContainer, menuWrap);
            menuWrap.classList.toggle("open", willOpen);
            menuButton.setAttribute("aria-expanded", String(willOpen));
        });

        unlinkButton.addEventListener("click", async (event) => {
            event.stopPropagation();

            const confirmado = await solicitarConfirmacionDesvincular(elements, p.name);
            if (!confirmado) return;

            menuWrap.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");

            await handlers.onDesvincularPaciente?.(p);
        });

        elements.patientContainer.appendChild(card);
    });
}

