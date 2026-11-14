
/* =====================================================
   CONTIGO - PREFERENCIAS DE USUARIO

   Guarda en el navegador:
   - Tamaño de texto
   - Contraste
   - Reducción de animaciones
   - Estilo preferido de IAN

   Las preferencias se guardan en localStorage.

   No modifica la base de datos MariaDB.
   No envía información a terceros.
===================================================== */

(() => {
    "use strict";

    // ==========================================
    // CLAVES DE ALMACENAMIENTO
    // ==========================================

    const CLAVE_UI =
        "contigo_preferencias_ui_v1";

    const CLAVE_IAN =
        "contigo_estilo_ian_v1";

    const VALORES_INICIALES = {
        tamano: "normal",
        contraste: false,
        movimiento: false
    };

    const tamanosValidos = new Set([
        "normal",
        "grande",
        "muy-grande"
    ]);

    const estilosValidos = new Set([
        "calido",
        "breve",
        "reflexivo"
    ]);

    let preferencias = {
        ...VALORES_INICIALES
    };

    // ==========================================
    // LEER ALMACENAMIENTO
    // ==========================================

    function leerLocal(clave) {

        try {
            return localStorage.getItem(clave);
        } catch (error) {
            console.warn(
                "No se pudo leer el almacenamiento local.",
                error
            );

            return null;
        }
    }

    // ==========================================
    // GUARDAR ALMACENAMIENTO
    // ==========================================

    function guardarLocal(clave, valor) {

        try {
            localStorage.setItem(
                clave,
                valor
            );

            return true;

        } catch (error) {

            console.warn(
                "No se pudo guardar la preferencia.",
                error
            );

            return false;
        }
    }

    // ==========================================
    // CARGAR PREFERENCIAS VISUALES
    // ==========================================

    function leerPreferencias() {

        try {

            const datos = JSON.parse(
                leerLocal(CLAVE_UI) || "null"
            ) || {};

            return {

                tamano:
                    tamanosValidos.has(datos.tamano)
                        ? datos.tamano
                        : "normal",

                contraste:
                    datos.contraste === true,

                movimiento:
                    datos.movimiento === true
            };

        } catch (error) {

            return {
                ...VALORES_INICIALES
            };
        }
    }

    // ==========================================
    // APLICAR PREFERENCIAS AL HTML
    // ==========================================

    function aplicarPreferencias(datos) {

        const raiz =
            document.documentElement;

        raiz.dataset.contigoTamano =
            datos.tamano;

        raiz.dataset.contigoContraste =
            datos.contraste
                ? "alto"
                : "normal";

        raiz.dataset.contigoMovimiento =
            datos.movimiento
                ? "reducido"
                : "normal";
    }

    // ==========================================
    // MOSTRAR MENSAJES
    // ==========================================

    function mostrarMensaje(
        id,
        texto,
        esError = false
    ) {

        const elemento =
            document.getElementById(id);

        if (!elemento) {
            return;
        }

        elemento.textContent = texto;

        elemento.className =
            "config-mensaje " +
            (esError ? "error" : "exito");

        elemento.hidden = false;
    }

    // ==========================================
    // APLICAR PREFERENCIAS AL ABRIR
    // ==========================================

    preferencias = leerPreferencias();

    aplicarPreferencias(preferencias);

    // ==========================================
    // INICIAR CONTROLES
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            const selectorTamano =
                document.getElementById(
                    "ui-tamano"
                );

            const checkContraste =
                document.getElementById(
                    "ui-contraste"
                );

            const checkMovimiento =
                document.getElementById(
                    "ui-movimiento"
                );

            const selectorIAN =
                document.getElementById(
                    "ui-ian"
                );

            const botonBorrar =
                document.getElementById(
                    "ui-borrar-local"
                );

            // ==================================
            // APARIENCIA Y ACCESIBILIDAD
            // ==================================

            if (
                selectorTamano &&
                checkContraste &&
                checkMovimiento
            ) {

                selectorTamano.value =
                    preferencias.tamano;

                checkContraste.checked =
                    preferencias.contraste;

                checkMovimiento.checked =
                    preferencias.movimiento;

                function actualizarVisualizacion() {

                    preferencias = {
                        tamano: selectorTamano.value,

                        contraste:
                            checkContraste.checked,

                        movimiento:
                            checkMovimiento.checked
                    };

                    // Aplicar inmediatamente

                    aplicarPreferencias(
                        preferencias
                    );

                    // Guardar en navegador

                    const guardado = guardarLocal(
                        CLAVE_UI,
                        JSON.stringify(preferencias)
                    );

                    mostrarMensaje(
                        "ui-mensaje",

                        guardado
                            ? "✅ Preferencias visuales guardadas correctamente."
                            : "No se pudieron guardar las preferencias en este navegador.",

                        !guardado
                    );
                }

                selectorTamano.addEventListener(
                    "change",
                    actualizarVisualizacion
                );

                checkContraste.addEventListener(
                    "change",
                    actualizarVisualizacion
                );

                checkMovimiento.addEventListener(
                    "change",
                    actualizarVisualizacion
                );
            }

            // ==================================
            // PREFERENCIAS DE IAN
            // ==================================

            if (selectorIAN) {

                const estiloGuardado =
                    leerLocal(CLAVE_IAN);

                selectorIAN.value =
                    estilosValidos.has(
                        estiloGuardado
                    )
                        ? estiloGuardado
                        : "calido";

                selectorIAN.addEventListener(
                    "change",
                    () => {

                        const estilo =
                            selectorIAN.value;

                        if (
                            !estilosValidos.has(estilo)
                        ) {
                            return;
                        }

                        const guardado =
                            guardarLocal(
                                CLAVE_IAN,
                                estilo
                            );

                        mostrarMensaje(
                            "ui-ian-mensaje",

                            guardado
                                ? "✅ Preferencia guardada. Próximamente la conectaremos con las respuestas de IAN."
                                : "No se pudo guardar esta preferencia.",

                            !guardado
                        );
                    }
                );
            }

            // ==================================
            // BORRAR PREFERENCIAS LOCALES
            // ==================================

            if (botonBorrar) {

                botonBorrar.addEventListener(
                    "click",
                    () => {

                        const confirmar =
                            window.confirm(
                                "¿Deseas borrar las preferencias de apariencia y estilo de IAN guardadas en este navegador?\n\n" +
                                "No se borrarán tu diario, tus emociones ni los datos de MariaDB."
                            );

                        if (!confirmar) {
                            return;
                        }

                        try {

                            // ELIMINAR SOLO ESTAS CLAVES

                            localStorage.removeItem(
                                CLAVE_UI
                            );

                            localStorage.removeItem(
                                CLAVE_IAN
                            );

                            // RESTABLECER VALORES

                            preferencias = {
                                ...VALORES_INICIALES
                            };

                            aplicarPreferencias(
                                preferencias
                            );

                            if (selectorTamano) {
                                selectorTamano.value =
                                    "normal";
                            }

                            if (checkContraste) {
                                checkContraste.checked =
                                    false;
                            }

                            if (checkMovimiento) {
                                checkMovimiento.checked =
                                    false;
                            }

                            if (selectorIAN) {
                                selectorIAN.value =
                                    "calido";
                            }

                            // LIMPIAR AVISOS ANTERIORES

                            const mensajeUI =
                                document.getElementById(
                                    "ui-mensaje"
                                );

                            const mensajeIAN =
                                document.getElementById(
                                    "ui-ian-mensaje"
                                );

                            if (mensajeUI) {
                                mensajeUI.hidden = true;
                            }

                            if (mensajeIAN) {
                                mensajeIAN.hidden = true;
                            }

                            mostrarMensaje(
                                "ui-borrar-mensaje",
                                "✅ Preferencias locales eliminadas. Tus datos de CONTIGO permanecen intactos."
                            );

                        } catch (error) {

                            mostrarMensaje(
                                "ui-borrar-mensaje",
                                "No fue posible borrar las preferencias de este navegador.",
                                true
                            );
                        }
                    }
                );
            }

        }
    );

})();
