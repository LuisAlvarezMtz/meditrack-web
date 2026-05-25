//export const API_BASE_URL = "https://meditrackwebappback.onrender.com";

export const API_BASE_URL = "http://localhost:8080";

export const AUTH_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/auth/login`
};

export const STORAGE_KEYS = {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
    ROLE: "rol",
    NAME: "name"
};

export const ROLES = Object.freeze({
    PACIENTE: "PATIENT",
    CUIDADOR: "CAREGIVER"
});

export const ROUTES = Object.freeze({
    LOGIN: "/index.html",
    DASHBOARD_PACIENTE: "/pages/dashboard-paciente.html",
    DASHBOARD_CUIDADOR: "/pages/dashboard-cuidador.html",
    ALARMAS: "/pages/alarmas.html",
    MEDICAMENTOS: "/pages/medicamentos.html",
    CUIDADOR_PACIENTE: "/pages/cuidador-vinculacion.html",
    PERFIL_CUIDADOR: "/pages/perfil-cuidador.html",
    PERFIL_PACIENTE: "/pages/perfil-paciente.html"
});