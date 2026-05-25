import { API_BASE_URL } from "../core/config.js";
import { authFetch } from "../core/http.js";
import { extraerMensajeError } from "../utils/http-error.util.js";

const BASE_URL = `${API_BASE_URL}/medicines`;

// Obtener medicinas de un paciente vinculado (cuidador)
export async function obtenerMedicinasPaciente(pacienteId) {
    const response = await authFetch(`${BASE_URL}/patient/${pacienteId}`);
    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al obtener las medicinas del paciente");
    }
    return response.json();
}

// Registrar nueva medicina
export async function registrarMedicina(dto) {
    const response = await authFetch(`${BASE_URL}/register`, {
        method: "POST",
        body: JSON.stringify(dto)
    });
    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al registrar medicina");
    }
    return response.json();
}

// Obtener medicinas del paciente actual
export async function obtenerMisMedicinas() {
    const response = await authFetch(`${BASE_URL}/my-medicines`);

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error real del servidor");
    }
    return response.json();
}

// Obtener medicina por ID
export async function obtenerMedicinaPorId(id) {
    const response = await authFetch(`${BASE_URL}/${id}`);

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al obtener la medicina");
    }

    return response.json();
}

//Actualizar medicina por ID
export async function actualizarMedicina(id, dto) {
    const response = await authFetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(dto)
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al actualizar la medicina");
    }

    return response.json();
}



// Eliminar medicina por ID
export async function eliminarMedicina(id) {
    const response = await authFetch(`${BASE_URL}/${id}`, {
        method: "DELETE"
    });
    if (!response.ok) {
        const msg = await extraerMensajeError(response);
        throw new Error(msg || "Error al eliminar la medicina");
    }
}
