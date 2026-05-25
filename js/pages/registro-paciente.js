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

const form = document.getElementById("registerPacienteForm");
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

    const paciente = {
        name: form.elements.name.value.trim(),
        phoneNumber: sanitizePhoneValue(form.elements.phoneNumber.value),
        age: Number(form.elements.edad.value),
        password: form.elements.password.value,
        chronicDiseases: []
    };

    if (paciente.phoneNumber.length !== PHONE_DIGITS) {
        notifyError("El numero de telefono debe tener 10 digitos");
        return;
    }

    if (!passwordsMatch(passwordInput, confirmPasswordInput)) {
        notifyError("Las contrasenas no coinciden");
        return;
    }

    try {
        const response = await guardedFetch(`${API_BASE_URL}/patients/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(paciente)
        });

        if (!response.ok) {
            throw new Error(await extraerMensajeError(response));
        }

        const data = await response.json();
        saveSession(data);

        window.location.replace(ROUTES.DASHBOARD_PACIENTE);
    } catch (error) {
        console.error(error);
        notifyError(error.message || "No se pudo crear la cuenta");
    }
});
