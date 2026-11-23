
/* ================================================
   CONTIGO - RECUPERACIÓN DE CONTRASEÑA

   1. Enviar código al correo
   2. Verificar código
   3. Guardar contraseña nueva

   No requiere sesión iniciada.
================================================ */

(() => {
    "use strict";

    const $ = (id) =>
        document.getElementById(id);

    const formularios = [
        $("form-recuperar-correo"),
        $("form-recuperar-codigo"),
        $("form-recuperar-cambiar")
    ];

    if (formularios.some((form) => !form)) {
        return;
    }

    let tokenCSRF = "";

    /* ======================================
       MENSAJES DE LA APLICACIÓN
    ====================================== */

    function mostrarMensaje(texto, error = false) {
        const caja = $("mensaje-recuperacion");

        caja.hidden = false;

        caja.textContent = texto;

        caja.className =
            "recuperacion-mensaje" +
            (error ? " error" : "");
    }

    function ocultarMensaje() {
        $("mensaje-recuperacion").hidden = true;
    }

    /* ======================================
       CAMBIAR DE PASO
    ====================================== */

    function mostrarPaso(numero) {

        formularios.forEach((formulario, indice) => {
            formulario.hidden =
                indice !== numero - 1;
        });

        for (let i = 1; i <= 3; i++) {

            $("indicador-" + i).classList.toggle(
                "actual",
                i === numero
            );
        }

        ocultarMensaje();

        const campo = formularios[numero - 1]
            .querySelector("input");

        if (campo) {
            campo.focus();
        }
    }

    /* ======================================
       OBTENER TOKEN CSRF SIN INICIAR SESIÓN
    ====================================== */

    async function obtenerCSRF() {

        if (tokenCSRF) {
            return tokenCSRF;
        }

        const respuesta = await fetch(
            "/api/recuperar-contrasena/csrf",
            {
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                "No pudimos verificar tu solicitud."
            );
        }

        const datos = await respuesta.json();

        tokenCSRF = datos.csrf_token || "";

        if (!tokenCSRF) {
            throw new Error(
                "Actualiza la página e inténtalo nuevamente."
            );
        }

        return tokenCSRF;
    }

    /* ======================================
       ENVIAR DATOS A FLASK
    ====================================== */

    async function solicitar(ruta, datos) {

        const csrf = await obtenerCSRF();

        const respuesta = await fetch(ruta, {
            method: "POST",

            credentials: "same-origin",

            cache: "no-store",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-CSRF-Token": csrf
            },

            body: JSON.stringify(datos)
        });

        let resultado;

        try {
            resultado = await respuesta.json();
        } catch {
            throw new Error(
                "No pudimos procesar la respuesta del servidor."
            );
        }

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje ||
                "No pudimos completar tu solicitud."
            );
        }

        return resultado;
    }

    /* ======================================
       CONTROLAR UN FORMULARIO
    ====================================== */

    function prepararFormulario(
        formulario,
        ruta,
        datos,
        alCompletar
    ) {

        formulario.addEventListener(
            "submit",
            async (evento) => {

                evento.preventDefault();

                const boton = formulario.querySelector(
                    'button[type="submit"]'
                );

                if (boton.disabled) {
                    return;
                }

                const textoOriginal =
                    boton.textContent;

                boton.disabled = true;

                boton.textContent =
                    "Procesando...";

                ocultarMensaje();

                try {
                    const resultado = await solicitar(
                        ruta,
                        datos()
                    );

                    alCompletar(resultado);

                } catch (error) {
                    mostrarMensaje(
                        error.message ||
                        "Ocurrió un error inesperado.",
                        true
                    );

                } finally {
                    boton.disabled = false;

                    boton.textContent =
                        textoOriginal;
                }
            }
        );
    }

    /* ======================================
       PASO 1: ENVIAR CÓDIGO
    ====================================== */

    prepararFormulario(
        formularios[0],

        "/api/recuperar-contrasena/enviar",

        () => ({
            correo: $("recuperar-correo")
                .value.trim()
        }),

        (resultado) => {

            mostrarPaso(2);

            mostrarMensaje(
                resultado.mensaje ||
                "Revisa tu correo electrónico."
            );
        }
    );

    /* ======================================
       PASO 2: VERIFICAR CÓDIGO
    ====================================== */

    prepararFormulario(
        formularios[1],

        "/api/recuperar-contrasena/verificar",

        () => ({
            codigo: $("recuperar-codigo")
                .value.trim()
        }),

        (resultado) => {

            mostrarPaso(3);

            mostrarMensaje(
                resultado.mensaje ||
                "Código verificado correctamente."
            );
        }
    );

    /* ======================================
       PASO 3: CAMBIAR CONTRASEÑA
    ====================================== */

    prepararFormulario(
        formularios[2],

        "/api/recuperar-contrasena/cambiar",

        () => ({
            contrasena:
                $("recuperar-clave").value,

            confirmar:
                $("recuperar-confirmar").value
        }),

        (resultado) => {

            mostrarMensaje(
                resultado.mensaje ||
                "Contraseña actualizada."
            );

            // Regresar al inicio de sesión
            // para usar la nueva contraseña.

            window.location.assign(
                resultado.redirigir || "/"
            );
        }
    );

    /* ======================================
       VOLVER AL PASO DEL CORREO
    ====================================== */

    $("btn-volver-correo").addEventListener(
        "click",
        () => mostrarPaso(1)
    );

})();
