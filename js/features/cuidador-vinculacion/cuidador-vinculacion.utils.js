const CODIGO_CUIDADOR_LENGTH = 6;
const CODIGO_CUIDADOR_REGEX = /^[A-Z0-9]{6}$/;
const CUIDADOR_CODIGO_STORAGE_KEY = "cuidadorCodigoVinculacion";

export function sanitizeCodigoCuidador(value) {
    return String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, CODIGO_CUIDADOR_LENGTH);
}

export function esCodigoCuidadorValido(value) {
    return CODIGO_CUIDADOR_REGEX.test(String(value || ""));
}

export function obtenerCodigoCuidadorGuardado() {
    return sanitizeCodigoCuidador(localStorage.getItem(CUIDADOR_CODIGO_STORAGE_KEY) || "");
}

export function guardarCodigoCuidador(codigo) {
    const limpio = sanitizeCodigoCuidador(codigo);
    if (!limpio) return;
    localStorage.setItem(CUIDADOR_CODIGO_STORAGE_KEY, limpio);
}

export function limpiarCodigoCuidadorGuardado() {
    localStorage.removeItem(CUIDADOR_CODIGO_STORAGE_KEY);
}

export function normalizarInfoCuidador(paciente) {
    const cuidador = paciente?.cuidador || null;

    const nombre = (
        cuidador?.name
        || cuidador?.nombre
        || paciente?.cuidadorName
        || paciente?.nombreCuidador
        || ""
    ).trim();

    const telefono = (
        cuidador?.phoneNumber
        || cuidador?.telefono
        || paciente?.cuidadorPhone
        || paciente?.telefonoCuidador
        || ""
    ).trim();

    const codigo = sanitizeCodigoCuidador(
        cuidador?.linkCode
        || cuidador?.codigoVinculacion
        || cuidador?.codigo
        || paciente?.cuidadorCodigo
        || paciente?.caregiverCode
        || paciente?.codigoCuidador
        || paciente?.cuidadorCodigoVinculacion
        || ""
    );

    return {
        hasCaregiver: Boolean(nombre || codigo),
        codigo,
        nombre,
        telefono
    };
}

export function obtenerNombreCuidadorBusqueda(data) {
    if (!data || typeof data !== "object") return "";

    return (
        data?.name
        || data?.nombre
        || data?.cuidadorName
        || data?.cuidador?.name
        || data?.cuidador?.nombre
        || ""
    ).trim();
}

export function obtenerTelefonoCuidadorBusqueda(data) {
    if (!data || typeof data !== "object") return "";

    return (
        data?.phoneNumber
        || data?.telefono
        || data?.cuidadorPhone
        || data?.cuidador?.phoneNumber
        || data?.cuidador?.telefono
        || ""
    ).trim();
}

export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}
