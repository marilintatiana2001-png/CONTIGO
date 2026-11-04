
/* ==========================================
   CONTIGO - COMPAÑERO EMOCIONAL IAN
   CHAT CON INTELIGENCIA ARTIFICIAL
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

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
            "CONTIGO: faltan elementos de la pantalla IAN."
        );
        return;
    }

    const csrf =
        document.body.dataset.csrf || "";

    const saludo = (
        "¡Hola! Me alegra que estés aquí. 💜 " +
        "No tienes que encontrar las palabras " +
        "perfectas. ¿Quieres contarme cómo " +
        "te sientes hoy?"
    );

    // Conversación temporal: no se guarda
    // en MariaDB ni en localStorage.
    let historial = [];

    let enviando = false;


    // ======================================
    // AGREGAR BURBUJA AL CHAT
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

        // textContent evita insertar HTML
        // enviado por otros usuarios o por la IA.
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

            estado.textContent =
                "IAN está preparando una respuesta…";

        } else {

            enviar.textContent = "➤";

            estado.textContent = "";
        }
    }


    // ======================================
    // ENVIAR MENSAJE A FLASK
    // ======================================

    async function enviarMensaje(texto) {

        if (enviando) {
            return;
        }

        texto = texto.trim();

        if (!texto || texto.length > 1500) {
            return;
        }

        agregarMensaje("user", texto);

        campo.value = "";

        cambiarEstado(true);

        // Burbuja temporal de escritura
        const respuestaVisual = agregarMensaje(
            "assistant",
            "Estoy aquí, dame un momento… 💜"
        );

        try {

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

                    body: JSON.stringify({

                        mensaje: texto,

                        historial:
                            historial.slice(-10)
                    })
                }
            );

            if (respuestaHTTP.status === 401) {

                window.location.href = "/";

                return;
            }

            const datos =
                await respuestaHTTP.json();

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

            respuestaVisual.textContent =
                datos.respuesta;

            // Guardar contexto de esta pantalla
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

            // Conservar solo el contexto reciente
            if (historial.length > 12) {

                historial =
                    historial.slice(-12);
            }

        } catch (error) {

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

                    campo.value =
                        boton.dataset.sugerencia;

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

            historial = [];

            contenedor.replaceChildren();

            agregarMensaje("assistant", saludo);

            campo.value = "";

            estado.textContent =
                "Comenzaste una nueva conversación.";

            campo.focus();
        }
    );


    console.log(
        "CONTIGO: pantalla de IAN cargada."
    );

});
