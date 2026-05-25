import { API_BASE_URL, ROUTES } from "../core/config.js";
import { saveSession } from "../core/auth.js";
import { guardedFetch } from "../core/http.js";
import { notifyError } from "../core/notify.js";
import {
    PHONE_DIGITS,
    sanitizePhoneValue,
    setupPhoneInputValidation,
    applySpanishValidationMessages,
    setupPasswordConfirmationValidation,
    passwordsMatch,
    setupPasswordToggle
} from "../utils/form-validation.js";
import { extraerMensajeError } from "../utils/http-error.util.js";

const form = document.getElementById("registerCuidadorForm");
const phoneInput = document.getElementById("phoneNumber");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPasswordBtn");

setupPhoneInputValidation(phoneInput);
setupPasswordConfirmationValidation(passwordInput, confirmPasswordInput);
applySpanishValidationMessages(form);
setupPasswordToggle(togglePasswordBtn, passwordInput);
setupPasswordToggle(toggleConfirmPasswordBtn, confirmPasswordInput);

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cuidador = {
        name: form.name.value,
        phoneNumber: sanitizePhoneValue(form.phoneNumber.value),
        occupation: form.ocupacion.value,
        password: form.password.value
    };

    if (cuidador.phoneNumber.length !== PHONE_DIGITS) {
        notifyError("El numero de telefono debe tener 10 digitos");
        return;
    }

    if (!passwordsMatch(passwordInput, confirmPasswordInput)) {
        notifyError("Las contrasenas no coinciden");
        return;
    }

    try {
        const response = await guardedFetch(`${API_BASE_URL}/caregivers/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cuidador)
        });

        if (!response.ok) {
            throw new Error(await extraerMensajeError(response));
        }

        const data = await response.json();
        saveSession({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        });

        window.location.replace(ROUTES.DASHBOARD_CUIDADOR);
    } catch (error) {
        notifyError(error.message || "No se pudo crear la cuenta");
        console.error(error);
    }
});
