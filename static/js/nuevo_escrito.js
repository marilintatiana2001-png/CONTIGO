
/* ==========================================
   CONTIGO - NUEVO ESCRITO
   Guardar escritos en MariaDB mediante Flask
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    // Obtener elementos del formulario
    const formulario = document.getElementById("form-escrito");

    const mensaje = document.getElementById("mensaje-escrito");

    if (!formulario || !mensaje) {
        console.error("No se encontró el formulario de nuevo escrito.");
        return;
    }

    // Escuchar cuando el usuario presiona Guardar
    formulario.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const titulo = document.getElementById("titulo").value.trim();

        const contenido = document.getElementById("contenido").value.trim();

        const botonGuardar = formulario.querySelector(
            'button[type="submit"]'
        );

        // Validar información
        if (!titulo || !contenido) {
            mensaje.textContent =
                "Por favor, escribe un título y un contenido.";
            mensaje.style.color = "#B34260";
            return;
        }

        if (titulo.length > 150) {
            mensaje.textContent =
                "El título no puede superar los 150 caracteres.";
            mensaje.style.color = "#B34260";
            return;
        }

        // Desactivar botón mientras se guarda
        botonGuardar.disabled = true;

        mensaje.textContent = "Guardando tu escrito...";
        mensaje.style.color = "#7958B7";

        try {

            // Enviar información al servidor Flask
            const respuesta = await fetch("/api/diario", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({
                    titulo: titulo,
                    contenido: contenido
                })

            });

            // Si terminó la sesión
            if (respuesta.status === 401) {
                mensaje.textContent =
                    "Tu sesión ha terminado. Inicia sesión nuevamente.";

                mensaje.style.color = "#B34260";
                return;
            }

            const tipoRespuesta =
                respuesta.headers.get("content-type") || "";

            if (!tipoRespuesta.includes("application/json")) {
                throw new Error(
                    "El servidor no devolvió una respuesta JSON."
                );
            }

            const resultado = await respuesta.json();

            // Guardado exitoso
            if (respuesta.ok) {

                mensaje.textContent =
                    "¡Tu escrito se guardó correctamente! 💗";

                mensaje.style.color = "#509982";

                // Regresar al diario para ver el escrito
                window.location.href = "/diario";

            } else {

                mensaje.textContent =
                    resultado.mensaje ||
                    "No pudimos guardar tu escrito.";

                mensaje.style.color = "#B34260";
            }

        } catch (error) {

            console.error("Error al guardar escrito:", error);

            mensaje.textContent =
                "No pudimos guardar tu escrito. Revisa el servidor Flask.";

            mensaje.style.color = "#B34260";

        } finally {

            botonGuardar.disabled = false;

        }

    });

});
