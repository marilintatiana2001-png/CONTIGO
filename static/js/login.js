/* ================================================
   CONTIGO - INICIO DE SESIÓN

- Iniciar sesión con Flask
- Acceso rápido con Cuenta Demo (Jurados SENA)
- Mostrar mensajes dentro de CONTIGO
- Evitar envíos duplicados
- Conservar redirección al inicio
================================================ */

(() => {
    "use strict";

    const formulario = document.getElementById("form-login");
    const mensaje = document.getElementById("mensaje-login");
    const botonDemo = document.getElementById("btn-acceso-demo");

    if (!formulario) {
        return;
    }

    const boton = formulario.querySelector('button[type="submit"]');

    function mostrarError(texto) {
        if (mensaje) {
            mensaje.textContent = texto;
            mensaje.hidden = false;
        }
    }

    async function iniciarSesion(correo, contrasena, botonActivo, textoCargando) {
        if (mensaje) {
            mensaje.hidden = true;
            mensaje.textContent = "";
        }

        const textoOriginal = botonActivo ? botonActivo.textContent : "";
        if (botonActivo) {
            botonActivo.disabled = true;
            botonActivo.textContent = textoCargando;
        }

        try {
            const respuesta = await fetch("/api/login", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ correo, contrasena })
            });

            let resultado;
            try {
                resultado = await respuesta.json();
            } catch {
                throw new Error("El servidor no respondió correctamente.");
            }

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje || "No pudimos iniciar sesión.");
            }

            window.location.assign("/inicio");
        } catch (error) {
            mostrarError(error.message || "No pudimos conectar con el servidor.");
        } finally {
            if (botonActivo) {
                botonActivo.disabled = false;
                botonActivo.textContent = textoOriginal;
            }
        }
    }

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        if (boton.disabled) return;

        const correo = document.getElementById("correo").value.trim();
        const contrasena = document.getElementById("contrasena").value;

        await iniciarSesion(correo, contrasena, boton, "Iniciando sesión...");
    });

    if (botonDemo) {
        botonDemo.addEventListener("click", async () => {
            if (botonDemo.disabled) return;
            await iniciarSesion(
                "jurado.sena@contigo.app",
                "ContigoDemo2026*",
                botonDemo,
                "Entrando a modo Demo..."
            );
        });
    }
})();