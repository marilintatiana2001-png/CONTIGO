
/* ==========================================
   CONTIGO - COMPAÑERO EMOCIONAL IAN
   CHAT CON INTELIGENCIA ARTIFICIAL
   HISTORIAL CONTROLADO Y SEGURO
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    // ======================================
    // ELEMENTOS DEL CHAT
    // ======================================

    const formulario =
        document.getElementById("formulario-ian");

    const campo =
        document.getElementById("texto-ian");

    const enviar =
        document.getElementById("enviar-ian");

    const contenedor =
        document.getElementById("mensajes-ian");

    const estado =
        document.getElementById("estado-ian");

    const nuevoChat =
        document.getElementById("nueva-conversacion");

    const sugerencias =
        document.getElementById("sugerencias-ian");

    if (
        !formulario ||
        !campo ||
        !enviar ||
        !contenedor ||
        !nuevoChat
    ) {
        console.error(
            "CONTIGO: faltan elementos de IAN."
        );
        return;
    }

    const csrf =
        document.body.dataset.csrf || "";

    // ======================================
    // CONFIGURACIÓN DEL HISTORIAL
    // ======================================

    // Debe coincidir con el límite de app.py.
    const MAX_HISTORIAL = 12;

    // app.py rechaza solicitudes mayores
    // de 16000 bytes. Dejamos un margen.
    const MAX_BYTES_SOLICITUD = 14000;

    const codificador = new TextEncoder();

    const saludo = (
        "¡Hola! Me alegra que estés aquí. 💜 " +
        "No tienes que encontrar las palabras " +
        "perfectas. ¿Quieres contarme cómo " +
        "te sientes hoy?"
    );

    // El historial solo existe mientras
    // esta página permanece abierta.
    let historial = [];

    let enviando = false;

    // ======================================
    // AGREGAR MENSAJE AL CHAT
    // ======================================

    function agregarMensaje(rol, contenido) {

        const fila =
            document.createElement("div");

        fila.className =
            "fila-mensaje " +
            (rol === "assistant"
                ? "fila-ian"
                : "fila-usuario");

        if (rol === "assistant") {

            const avatar =
                document.createElement("div");

            avatar.className =
                "avatar-mensaje";

            avatar.textContent = "🤖";

            fila.appendChild(avatar);
        }

        const burbuja =
            document.createElement("div");

        burbuja.className =
            "burbuja-mensaje " +
            (rol === "assistant"
                ? "burbuja-ian"
                : "burbuja-usuario");

        if (rol === "assistant") {

            const nombre =
                document.createElement("strong");

            nombre.textContent = "IAN";

            burbuja.appendChild(nombre);
        }

        const texto =
            document.createElement("p");

        // Evitar insertar código HTML
        // proveniente de respuestas externas.
        texto.textContent = contenido;

        burbuja.appendChild(texto);

        fila.appendChild(burbuja);

        contenedor.appendChild(fila);

        contenedor.scrollTop =
            contenedor.scrollHeight;

        return texto;
    }

    // ======================================
    // ESTADO DE ENVÍO
    // ======================================

    function cambiarEstado(ocupado) {

        enviando = ocupado;

        enviar.disabled = ocupado;
        campo.disabled = ocupado;

        formulario.setAttribute(
            "aria-busy",
            String(ocupado)
        );

        if (ocupado) {

            enviar.textContent = "…";

            if (estado) {
                estado.textContent =
                    "IAN está preparando una respuesta…";
            }

        } else {

            enviar.textContent = "➤";

            if (estado) {
                estado.textContent = "";
            }
        }
    }

    // ======================================
    // PREPARAR HISTORIAL PARA FLASK
    // ======================================

    function prepararSolicitud(texto) {

        // Seleccionar los últimos 12 mensajes.
        const mensajesAnteriores =
            historial.slice(-MAX_HISTORIAL);

        const solicitud = {
            mensaje: texto,
            historial: mensajesAnteriores
        };

        let cuerpo = JSON.stringify(solicitud);

        // Si la solicitud es demasiado grande,
        // retirar mensajes antiguos primero.
        // No se recorta el mensaje actual.
        while (
            mensajesAnteriores.length > 0 &&
            codificador.encode(cuerpo).length >
                MAX_BYTES_SOLICITUD
        ) {

            mensajesAnteriores.shift();

            cuerpo = JSON.stringify(solicitud);
        }

        return cuerpo;
    }

    // ======================================
    // ENVIAR MENSAJE
    // ======================================

    async function enviarMensaje(texto) {

        if (enviando) {
            return;
        }

        if (typeof texto !== "string") {
            return;
        }

        texto = texto.trim();

        if (
            !texto ||
            texto.length > 1500
        ) {
            return;
        }

        agregarMensaje("user", texto);

        campo.value = "";

        cambiarEstado(true);

        const respuestaVisual = agregarMensaje(
            "assistant",
            "Estoy preparando una respuesta… 💜"
        );

        try {

            // Preparar historial sin superar
            // el tamaño aceptado por Flask.
            const cuerpo =
                prepararSolicitud(texto);

            const respuestaHTTP = await fetch(
                "/api/ian/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "X-CSRF-Token":
                            csrf
                    },

                    credentials: "same-origin",

                    body: cuerpo
                }
            );

            if (respuestaHTTP.status === 401) {

                window.location.href = "/";

                return;
            }

            let datos;

            try {

                datos = await respuestaHTTP.json();

            } catch {

                throw new Error(
                    "El servidor no devolvió " +
                    "una respuesta válida."
                );
            }

            if (!respuestaHTTP.ok) {

                throw new Error(
                    datos.mensaje ||
                    "IAN no pudo responder."
                );
            }

            if (
                typeof datos.respuesta !== "string" ||
                !datos.respuesta.trim()
            ) {

                throw new Error(
                    "IAN no generó una respuesta válida."
                );
            }

            // Mostrar la respuesta real de IAN
            respuestaVisual.textContent =
                datos.respuesta;

            // Guardar ambos mensajes solo
            // cuando la respuesta fue exitosa.
            historial.push(
                {
                    role: "user",
                    content: texto
                },
                {
                    role: "assistant",
                    content: datos.respuesta
                }
            );

            // Mantener el mismo límite
            // que utiliza app.py.
            if (
                historial.length > MAX_HISTORIAL
            ) {

                historial =
                    historial.slice(-MAX_HISTORIAL);
            }

        } catch (error) {

            // Los errores no se agregan
            // al historial de la conversación.
            respuestaVisual.textContent =
                "No pude responder en este momento. " +
                "💜 " + error.message;

            console.error(
                "IAN: error de conexión",
                error.message
            );

        } finally {

            cambiarEstado(false);

            contenedor.scrollTop =
                contenedor.scrollHeight;

            campo.focus();
        }
    }

    // ======================================
    // FORMULARIO
    // ======================================

    formulario.addEventListener(
        "submit",
        evento => {

            evento.preventDefault();

            enviarMensaje(campo.value);
        }
    );

    // ======================================
    // ENTER PARA ENVIAR
    // SHIFT + ENTER PARA SALTO DE LÍNEA
    // ======================================

    campo.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Enter" &&
                !evento.shiftKey &&
                !evento.isComposing
            ) {

                evento.preventDefault();

                if (!enviando) {

                    formulario.requestSubmit();
                }
            }
        }
    );

    // ======================================
    // SUGERENCIAS DE CONVERSACIÓN
    // ======================================

    if (sugerencias) {

        sugerencias.querySelectorAll(
            "[data-sugerencia]"
        ).forEach(boton => {

            boton.addEventListener(
                "click",
                () => {

                    if (enviando) {
                        return;
                    }

                    campo.value =
                        boton.dataset.sugerencia || "";

                    campo.focus();
                }
            );
        });
    }

    // ======================================
    // NUEVA CONVERSACIÓN
    // ======================================

    nuevoChat.addEventListener(
        "click",
        () => {

            if (enviando) {
                return;
            }

            // Borrar historial temporal.
            historial = [];

            contenedor.replaceChildren();

            agregarMensaje(
                "assistant",
                saludo
            );

            campo.value = "";

            if (estado) {

                estado.textContent =
                    "Comenzaste una nueva conversación.";
            }

            campo.focus();
        }
    );

    console.log(
        "CONTIGO: IAN cargado correctamente."
    );

});
