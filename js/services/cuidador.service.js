import { API_BASE_URL } from "../core/config.js";
import { authFetch } from "../core/http.js";
import { extraerMensajeError } from "../utils/http-error.util.js";

const BASE_URL = `${API_BASE_URL}/caregivers`;

/**
 * Obtener datos del cuidador autenticado
 * GET /caregivers/my-data
 */
export async function obtenerMisDatosCuidador() {
    const response = await authFetch(`${BASE_URL}/my-data`);

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "No se pudieron obtener los datos del cuidador");
    }

    return response.json();
}
/**
 * Obtener pacientes asociados al cuidador
 * GET /caregivers/patients
 */
export async function obtenerPacientesDelCuidador() {
    const response = await authFetch(`${BASE_URL}/patients`);

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al obtener pacientes");
    }

    return response.json();
}
/**
 * Registrar paciente desde cuidador
 * POST /caregivers/register-patient
 */
export async function registrarPacienteDesdeCuidador(dto) {
    const response = await authFetch(`${BASE_URL}/register-patient`, {
        method: "POST",
        body: JSON.stringify(dto)
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al registrar paciente");
    }

    return response.json();
}

/**
 * Obtener perfil de un paciente por ID
 * GET /caregivers/patients/{id}
 */
export async function obtenerPacientePorId(id) {
    const response = await authFetch(`${BASE_URL}/patients/${id}`);

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al obtener paciente");
    }

    return response.json();
}

/**
 * Actualizar datos del cuidador autenticado
 * PUT /caregivers/update
 */
export async function actualizarMisDatosCuidador(dto) {
    const response = await authFetch(`${BASE_URL}/update`, {
        method: "PUT",
        body: JSON.stringify(dto)
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al actualizar datos del cuidador");
    }

    return response.json();
}

/**
 * Actualizar paciente desde cuidador
 * PUT /caregivers/patients/{id}
 */
export async function actualizarPacienteDesdeCuidador(id, dto) {
    const response = await authFetch(`${BASE_URL}/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(dto)
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al actualizar paciente");
    }

    return response.json();
}

/**
 * Desvincular paciente del cuidador autenticado
 * DELETE /caregivers/{id}/unlink
 */
export async function desvincularPacienteDelCuidador(id) {
    const response = await authFetch(`${BASE_URL}/${id}/unlink`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al desvincular paciente");
    }
}
