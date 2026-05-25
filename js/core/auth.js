import { STORAGE_KEYS } from "./config.js";

let sessionExpiryTimeoutId = null;

export function saveSession({ accessToken, refreshToken }) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

    const payload = tryParseJwt(accessToken);
    if (!payload) {
        clearSessionStorage();
        return;
    }

    localStorage.setItem(STORAGE_KEYS.ROLE, payload.role || payload.rol);
    localStorage.setItem(STORAGE_KEYS.NAME, payload.name);
    startSessionExpiryWatcher();
}

export function getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function isAuthenticated() {
    const token = getAccessToken();
    return !!token && !isTokenExpired(token);
}

export function isTokenExpired(token = getAccessToken()) {
    const payload = token ? tryParseJwt(token) : null;
    if (!payload?.exp) return true;

    return Date.now() >= payload.exp * 1000;
}

export function startSessionExpiryWatcher() {
    stopSessionExpiryWatcher();

    const token = getAccessToken();
    const payload = token ? tryParseJwt(token) : null;

    if (!payload?.exp) return;

    const msUntilExpiry = payload.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
        logout();
        return;
    }

    sessionExpiryTimeoutId = setTimeout(() => {
        logout();
    }, msUntilExpiry + 200);
}

export function stopSessionExpiryWatcher() {
    if (sessionExpiryTimeoutId) {
        clearTimeout(sessionExpiryTimeoutId);
        sessionExpiryTimeoutId = null;
    }
}

function clearSessionStorage() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.NAME);
}

export function logout() {
    stopSessionExpiryWatcher();
    clearSessionStorage();
    window.location.replace("/index.html");
}

function tryParseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );

        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

