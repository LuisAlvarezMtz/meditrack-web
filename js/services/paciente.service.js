import { API_BASE_URL } from "../core/config.js";
import { authFetch } from "../core/http.js";
import { extraerMensajeError } from "../utils/http-error.util.js";

const BASE_URL = `${API_BASE_URL}/patients`;


//Obtener datos del paciente 
export async function obtenerMisDatosPaciente() {
    const response = await authFetch(`${BASE_URL}/profile`);

    if (response.status === 401 || response.status === 403) {
        return null;
    }

    if (!response.ok) {
        const msg = await extraerMensajeError(
            response,
            "Error al obtener datos del paciente"
        );
        throw new Error(msg || "Error al obtener datos del paciente");
    }

    return response.json();
}

//Vincular cuidador al paciente usando codigo unico
export async function vincularCuidadorPaciente(codigo) {
    const response = await authFetch(
        `${BASE_URL}/caregiver?code=${encodeURIComponent(codigo)}`,
        {
            method: "POST"
        }
    );

    if (!response.ok) {
        const msg = await extraerMensajeError(
            response,
            "No se pudo vincular el cuidador"
        );
        throw new Error(msg || "No se pudo vincular el cuidador");
    }

    return response.json();
}

//Buscar datos de cuidador por codigo
export async function buscarCuidadorPorCodigo(codigo) {
    const response = await authFetch(
        `${BASE_URL}/caregiver?code=${encodeURIComponent(codigo)}`,
        { method: "GET" }
    );

    if (!response.ok) {
        const msg = await extraerMensajeError(
            response,
            "No se pudo validar el codigo del cuidador"
        );
        throw new Error(msg || "No se pudo validar el codigo del cuidador");
    }

    return response.json();
}

//Desvincular cuidador del paciente
export async function desvincularCuidadorPaciente() {
    const response = await authFetch(`${BASE_URL}/caregiver`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(
            response,
            "No se pudo desvincular el cuidador"
        );
        throw new Error(msg || "No se pudo desvincular el cuidador");
    }

    return response.json();
}

//Actualizar perfil propio del paciente
export async function actualizarMiPerfil(dto) {
    const response = await authFetch(`${BASE_URL}/profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dto)
    });

    if (!response.ok) {
        const msg = await extraerMensajeError(
            response,
            "No se pudo actualizar el perfil"
        );
        throw new Error(msg || "No se pudo actualizar el perfil");
    }

    return response.json();
}
