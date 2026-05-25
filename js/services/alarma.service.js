import { API_BASE_URL } from "../core/config.js";
import { authFetch } from "../core/http.js";
import { extraerMensajeError } from "../utils/http-error.util.js";

const BASE_URL = `${API_BASE_URL}/alarms`;

/**
 * Crear configuración de alarma
 * @param {Object} dto AlarmaConfigRequestDto
 */
export async function crearAlarmaConfig(dto) {
    const response = await authFetch(`${BASE_URL}/create`, {
        method: "POST",
        body: JSON.stringify(dto)
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al crear la alarma");
    }

    return response.json();
}

/**
 * Obtener configuraciones de alarma del paciente actual
 */
export async function obtenerMisAlarmasConfig(pacienteId = null) {
    const numericId = pacienteId != null ? Number(pacienteId) : null;
    const hasValidId = numericId !== null && Number.isFinite(numericId) && numericId > 0;
    const url = hasValidId
        ? `${BASE_URL}/my-configurations?patientId=${numericId}`
        : `${BASE_URL}/my-configurations`;
    
    const response = await authFetch(url);
    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al obtener alarmas");
    }
    return response.json();
}

/**
 * Obtener configuraciones de alarma por medicina
 * @param {number|string} medicinaId
 */
export async function obtenerAlarmasPorMedicina(medicinaId, pacienteId = null) {
    const url = pacienteId
        ? `${BASE_URL}/medicine/${medicinaId}?patientId=${pacienteId}`
        : `${BASE_URL}/medicine/${medicinaId}`;

    const response = await authFetch(url);
    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al obtener alarmas por medicina");
    }
    return response.json();
}

/**
 * Obtener alarmas del dia del paciente actual
 */
export async function obtenerAlarmasDelDia(pacienteId = null) {
    const url = pacienteId
        ? `${BASE_URL}/today?patientId=${pacienteId}`
        : `${BASE_URL}/today`;

    const response = await authFetch(url);
    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al obtener alarmas del dia");
    }
    return response.json();
}

/**
 * Actualizar una configuracion de alarma por id
 * @param {number|string} id
 * @param {Object} dto AlarmaConfigRequestDto
 */
export async function actualizarAlarmaConfig(id, dto) {
    const response = await authFetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(dto)
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al actualizar la alarma");
    }

    return response.json();
}

/**
 * Actualizar estado de una alarma por id
 * @param {number|string} id
 * @param {string} estado EstadoAlarma del backend
 */
export async function actualizarEstadoAlarma(id, estado) {
    const response = await authFetch(
        `${BASE_URL}/${id}/status?status=${encodeURIComponent(estado)}`,
        { method: "PATCH" }
    );

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al actualizar estado de la alarma");
    }
}

/**
 * Eliminar configuracion de alarma por id
 * @param {number|string} id
 */
export async function eliminarAlarmaConfig(id) {
    const response = await authFetch(`${BASE_URL}/${id}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al eliminar la alarma");
    }
}

/**
 * Obtener el historial de tomas de alarma
 * @param {number|string} pacienteId (opcional)
 * @param {string} fechaInicio YYYY-MM-DD (opcional)
 * @param {string} fechaFin YYYY-MM-DD (opcional)
 */
export async function obtenerHistorial(pacienteId = null, fechaInicio = null, fechaFin = null) {
    let url = `${BASE_URL}/history`;
    const params = new URLSearchParams();
    
    if (pacienteId) params.append("patientId", pacienteId);
    if (fechaInicio) params.append("startDate", fechaInicio);
    if (fechaFin) params.append("endDate", fechaFin);
    
    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    const response = await authFetch(url);
    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al obtener historial");
    }
    return response.json();
}
