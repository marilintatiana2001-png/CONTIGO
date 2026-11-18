
/* ==================================================
   CONTIGO - SEGURIDAD DE MI DIARIO

   Funciones:
   - Crear PIN
   - Desbloquear diario
   - Enviar código por correo
   - Verificar código
   - Cambiar PIN olvidado
================================================== */

(() => {
    "use strict";

    const $ = (id) =>
        document.getElementById(id);

    const pantalla =
        document.body.dataset.pantalla;

    let csrf = "";

    /* ======================================
       MENSAJES
    ====================================== */

    function mostrar(
        texto,
        error = false
    ) {

        const caja = $("candado-mensaje");

        caja.hidden = false;

        caja.className =
            "candado-mensaje" +
            (error ? " error" : "");

        caja.textContent = texto;
    }

    /* ======================================
       COMUNICACIÓN CON FLASK
    ====================================== */

    async function enviar(
        ruta,
        datos
    ) {

        if (!csrf) {

            const respuesta = await fetch(
                "/api/csrf",
                {
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

            if (!respuesta.ok) {
                throw new Error(
                    "Inicia sesión nuevamente."
                );
            }

            const info =
                await respuesta.json();

            csrf = info.csrf_token;

            if (!csrf) {
                throw new Error(
                    "No pudimos verificar tu sesión."
                );
            }
        }

        const respuesta = await fetch(
            ruta,
            {
                method: "POST",

                credentials: "same-origin",

                headers: {
                    "Content-Type":
                        "application/json",

                    "X-CSRF-Token": csrf
                },

                body: JSON.stringify(datos)
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
                "No pudimos completar la solicitud."
            );
        }

        return resultado;
    }

    /* ======================================
       PROCESAR FORMULARIOS
    ====================================== */

    function procesar(
        formulario,
        ruta,
        obtenerDatos,
        alTerminar
    ) {

        if (!formulario) {
            return;
        }

        formulario.addEventListener(
            "submit",
            async (evento) => {

                evento.preventDefault();

                const boton =
                    formulario.querySelector(
                        'button[type="submit"]'
                    );

                boton.disabled = true;

                const texto =
                    boton.textContent;

                boton.textContent =
                    "Procesando...";

                try {

                    const resultado =
                        await enviar(
                            ruta,
                            obtenerDatos()
                        );

                    mostrar(
                        resultado.mensaje ||
                        "Operación completada."
                    );

                    if (alTerminar) {
                        alTerminar(resultado);
                    }

                } catch (error) {

                    mostrar(
                        error.message,
                        true
                    );

                } finally {

                    boton.disabled = false;

                    boton.textContent = texto;
                }
            }
        );
    }

    /* ======================================
       PANTALLA DE ACCESO
    ====================================== */

    if (pantalla === "acceso") {

        /* CREAR PIN */

        procesar(
            $("form-crear-pin"),

            "/api/diario-pin/crear",

            () => ({
                pin: $("pin-nuevo").value,

                confirmar:
                    $("pin-confirmar").value,

                pista:
                    $("pin-pista").value
            }),

            (resultado) => {

                window.location.assign(
                    resultado.redirigir ||
                    "/diario"
                );
            }
        );

        /* DESBLOQUEAR */

        procesar(
            $("form-abrir-pin"),

            "/api/diario-pin/desbloquear",

            () => ({
                pin: $("pin-acceso").value
            }),

            (resultado) => {

                window.location.assign(
                    resultado.redirigir ||
                    "/diario"
                );
            }
        );
    }

    /* ======================================
       PANTALLA DE RECUPERACIÓN
    ====================================== */

    if (pantalla === "recuperar") {

        const pasos = [
            $("form-correo-pin"),
            $("form-codigo-pin"),
            $("form-cambiar-pin")
        ];

        function paso(numero) {

            pasos.forEach(
                (formulario, indice) => {

                    formulario.hidden =
                        indice !== numero - 1;
                }
            );

            for (
                let i = 1;
                i <= 3;
                i++
            ) {

                $("paso-indicador-" + i)
                    .classList.toggle(
                        "actual",
                        i === numero
                    );
            }

            $("candado-mensaje").hidden =
                true;

            pasos[numero - 1]
                .querySelector("input")
                ?.focus();
        }

        /* PASO 1: ENVIAR CORREO */

        procesar(
            pasos[0],

            "/api/diario-pin/recuperar/enviar",

            () => ({
                correo:
                    $("correo-recuperacion")
                        .value.trim()
            }),

            (resultado) => {

                paso(2);

                mostrar(
                    resultado.mensaje
                );
            }
        );

        /* PASO 2: VERIFICAR CÓDIGO */

        procesar(
            pasos[1],

            "/api/diario-pin/recuperar/verificar",

            () => ({
                codigo:
                    $("codigo-recuperacion")
                        .value.trim()
            }),

            (resultado) => {

                paso(3);

                mostrar(
                    resultado.mensaje
                );
            }
        );

        /* PASO 3: CAMBIAR PIN */

        procesar(
            pasos[2],

            "/api/diario-pin/recuperar/cambiar",

            () => ({
                pin:
                    $("pin-recuperado").value,

                confirmar:
                    $("pin-recuperado-confirmar")
                        .value,

                contrasena:
                    $("contrasena-cuenta")
                        .value,

                pista:
                    $("pista-recuperada").value
            }),

            (resultado) => {

                window.location.assign(
                    resultado.redirigir ||
                    "/diario"
                );
            }
        );

        /* VOLVER AL CORREO */

        $("volver-correo")
            .addEventListener(
                "click",
                () => paso(1)
            );
    }

})();
