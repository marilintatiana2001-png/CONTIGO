
/* ================================================
   CONTIGO - INICIO DE SESIÓN

   - Iniciar sesión con Flask
   - Mostrar mensajes dentro de CONTIGO
   - Evitar envíos duplicados
   - Conservar redirección al inicio
================================================ */

(() => {
    "use strict";

    const formulario =
        document.getElementById("form-login");

    const mensaje =
        document.getElementById("mensaje-login");

    if (!formulario) {
        return;
    }

    const boton = formulario.querySelector(
        'button[type="submit"]'
    );

    function mostrarError(texto) {
        if (mensaje) {
            mensaje.textContent = texto;
            mensaje.hidden = false;
        }
    }

    formulario.addEventListener(
        "submit",
        async (evento) => {

            evento.preventDefault();

            if (boton.disabled) {
                return;
            }

            const correo = document
                .getElementById("correo")
                .value.trim();

            const contrasena = document
                .getElementById("contrasena")
                .value;

            if (mensaje) {
                mensaje.hidden = true;
                mensaje.textContent = "";
            }

            boton.disabled = true;

            const textoOriginal =
                boton.textContent;

            boton.textContent =
                "Iniciando sesión...";

            try {
                const respuesta = await fetch(
                    "/api/login",
                    {
                        method: "POST",
                        credentials: "same-origin",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body: JSON.stringify({
                            correo,
                            contrasena
                        })
                    }
                );

                let resultado;

                try {
                    resultado =
                        await respuesta.json();
                } catch {
                    throw new Error(
                        "El servidor no respondió correctamente."
                    );
                }

                if (!respuesta.ok) {
                    throw new Error(
                        resultado.mensaje ||
                        "No pudimos iniciar sesión."
                    );
                }

                window.location.assign("/inicio");

            } catch (error) {
                mostrarError(
                    error.message ||
                    "No pudimos conectar con el servidor."
                );

            } finally {
                boton.disabled = false;

                boton.textContent =
                    textoOriginal;
            }
        }
    );

})();
