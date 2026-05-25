import { logout } from "../../core/auth.js";
import { PHONE_DIGITS, sanitizePhoneValue } from "../../utils/form-validation.js";
import { notifyError, notifySuccess } from "../../core/notify.js";
import { actualizarPerfilPaciente, obtenerPerfilPaciente } from "./perfil-paciente.data.js";
import {
    getPerfilPacienteDTO,
    renderPerfilPaciente,
    resetPerfilPacienteForm,
    setPerfilPacienteEditMode,
    setSavingState,
    openReauthModal,
    closeReauthModal
} from "./perfil-paciente.dom.js";
import { renderTags } from "./perfil-paciente.tags.js";

const PERFIL_PACIENTE_CACHE_KEY = "perfilPacienteCache";

function getPacienteIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id") || params.get("pacienteId");
    if (!idParam) return null;

    const id = Number(idParam);
    return Number.isFinite(id) && id > 0 ? id : null;
}

function isCaregiverContext() {
    return getPacienteIdFromUrl() !== null;
}

function buildCacheKey() {
    const pacienteId = getPacienteIdFromUrl();
    return pacienteId
        ? `${PERFIL_PACIENTE_CACHE_KEY}:caregiver:${pacienteId}`
        : `${PERFIL_PACIENTE_CACHE_KEY}:self`;
}

export function createPerfilPacienteActions({ elements, state }) {
    const caregiverMode = isCaregiverContext();
    const perfilCacheKey = buildCacheKey();

    function limpiarTextoOpcional(value) {
        const text = String(value ?? "").trim();
        return text || null;
    }

    function normalizarEnfermedades(value) {
        if (Array.isArray(value)) {
            return value
                .map((item) => String(item ?? "").trim())
                .filter(Boolean);
        }

        if (typeof value === "string") {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return [];
    }

    function normalizarPaciente(payload) {
        if (!payload) return null;

        const candidate =
            payload.paciente ||
            payload.patient ||
            payload.data?.paciente ||
            payload.data?.patient ||
            payload.data ||
            payload;

        return {
            ...candidate,
            name: String(candidate?.name ?? candidate?.nombre ?? "").trim(),
            curp: limpiarTextoOpcional(candidate?.curp ?? candidate?.CURP),
            enfermedadesCronicas: normalizarEnfermedades(
                candidate?.chronicDiseases ?? candidate?.enfermedadesCronicas ?? candidate?.enfermedades
            )
        };
    }

    function leerPerfilCache() {
        try {
            const raw = sessionStorage.getItem(perfilCacheKey);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn("No se pudo leer cache de perfil paciente:", error);
            return null;
        }
    }

    function guardarPerfilCache(paciente) {
        try {
            sessionStorage.setItem(perfilCacheKey, JSON.stringify(paciente));
        } catch (error) {
            console.warn("No se pudo guardar cache de perfil paciente:", error);
        }
    }

    function enriquecerPacienteConCache(paciente) {
        const cache = normalizarPaciente(leerPerfilCache());
        if (!cache) return paciente;

        const mismoPaciente = cache.id && paciente?.id ? cache.id === paciente.id : true;
        if (!mismoPaciente) return paciente;

        return {
            ...cache,
            ...paciente,
            name: String(paciente?.name || cache?.name || "").trim(),
            curp: limpiarTextoOpcional(paciente?.curp) || cache?.curp || null,
            enfermedadesCronicas: normalizarEnfermedades(paciente?.chronicDiseases ?? paciente?.enfermedadesCronicas).length
                ? normalizarEnfermedades(paciente?.chronicDiseases ?? paciente?.enfermedadesCronicas)
                : normalizarEnfermedades(cache?.enfermedadesCronicas)
        };
    }

    function aplicarPacienteEnVista(paciente) {
        const pacienteNormalizado = enriquecerPacienteConCache(normalizarPaciente(paciente));
        if (!pacienteNormalizado) {
            throw new Error("No se recibieron datos del perfil del paciente");
        }

        state.paciente = pacienteNormalizado;
        state.dtoPendienteReauth = null;
        state.enfermedades = Array.isArray(pacienteNormalizado.enfermedadesCronicas)
            ? [...pacienteNormalizado.enfermedadesCronicas]
            : [];
        guardarPerfilCache(pacienteNormalizado);
        renderPerfilPaciente(elements, pacienteNormalizado);
        setPerfilPacienteEditMode(elements, false);
        state.modoEdicion = false;
    }

    function telefonoCambiado(dto) {
        const telefonoActual = sanitizePhoneValue(state.paciente?.phoneNumber || "");
        return dto.phoneNumber !== telefonoActual;
    }

    function validarDTO(dto) {
        if (!dto.name) {
            notifyError("El nombre es obligatorio");
            return false;
        }

        if (dto.phoneNumber.length !== PHONE_DIGITS) {
            notifyError("El número de teléfono debe tener 10 dígitos");
            return false;
        }

        if (Number.isNaN(dto.age) || dto.age < 0 || dto.age > 150) {
            notifyError("La edad debe ser un número válido");
            return false;
        }

        if (dto.curp && dto.curp.length !== 18) {
            notifyError("La CURP debe tener 18 caracteres");
            return false;
        }

        return true;
    }

    async function cargarPerfil() {
        try {
            const payload = await obtenerPerfilPaciente();
            aplicarPacienteEnVista(payload);
        } catch (error) {
            console.error("Error cargando perfil del paciente:", error);
            throw error;
        }
    }

    function alternarEdicion() {
        state.modoEdicion = !state.modoEdicion;
        setPerfilPacienteEditMode(elements, state.modoEdicion);
        renderTags(state);
    }

    function cancelarEdicion() {
        resetPerfilPacienteForm(elements, state.paciente, state.enfermedades);
        state.modoEdicion = false;
        setPerfilPacienteEditMode(elements, false);
        renderTags(state);
    }

    async function actualizarPerfil(dto, options = {}) {
        const { logoutAfterSave = false } = options;

        try {
            state.guardando = true;
            setSavingState(elements, true, state.modoEdicion);
            const response = await actualizarPerfilPaciente(dto);
            console.log("Respuesta actualizar perfil paciente:", response);
            const message = response?.message || "Datos actualizados correctamente";

            const shouldLogout = !caregiverMode && (logoutAfterSave || response?.requiresReauth);

            if (shouldLogout) {
                notifySuccess(message);
                logout();
                return;
            }

            if (response?.paciente || response?.patient) {
                aplicarPacienteEnVista(response);
            } else {
                await cargarPerfil();
            }
            notifySuccess(message);
        } catch (error) {
            console.error("Error actualizando perfil del paciente:", error);
            notifyError(error.message || "No se pudo actualizar el perfil del paciente");
        } finally {
            state.guardando = false;
            setSavingState(elements, false, state.modoEdicion);
        }
    }

    async function guardarCambios() {
        if (!state.modoEdicion || state.guardando) return;

        const dto = getPerfilPacienteDTO(elements, state.enfermedades);
        if (!validarDTO(dto)) return;

        if (!caregiverMode && telefonoCambiado(dto)) {
            state.dtoPendienteReauth = dto;
            openReauthModal(elements);
            return;
        }

        await actualizarPerfil(dto);
    }

    async function confirmarReauth() {
        if (state.guardando) return;

        const dto = state.dtoPendienteReauth;
        if (!dto) {
            closeReauthModal(elements);
            return;
        }

        closeReauthModal(elements);
        state.dtoPendienteReauth = null;
        await actualizarPerfil(dto, { logoutAfterSave: true });
    }

    function cancelarReauth() {
        closeReauthModal(elements);
        state.dtoPendienteReauth = null;
        cancelarEdicion();
    }

    return {
        cargarPerfil,
        alternarEdicion,
        cancelarEdicion,
        guardarCambios,
        confirmarReauth,
        cancelarReauth
    };
}
