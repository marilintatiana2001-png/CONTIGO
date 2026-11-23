
/* ==========================================
   CONTIGO - CONFIRMAR ELIMINACIÓN
   Ventana personalizada dentro de Mi Diario
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById(
        "modal-eliminar-diario"
    );

    const nombreEscrito = document.getElementById(
        "nombre-escrito-eliminar"
    );

    const botonCancelar = document.getElementById(
        "cancelar-eliminar-diario"
    );

    const botonConfirmar = document.getElementById(
        "confirmar-eliminar-diario"
    );

    const mensajeError = document.getElementById(
        "error-eliminar-diario"
    );

    if (
        !modal ||
        !nombreEscrito ||
        !botonCancelar ||
        !botonConfirmar ||
        !mensajeError
    ) {
        return;
    }

    let tarjetaSeleccionada = null;
    let botonOriginal = null;
    let eliminando = false;

    // =====================================
    // ABRIR VENTANA DE CONFIRMACIÓN
    // =====================================

    document.addEventListener("click", (evento) => {

        const boton = evento.target.closest(
            ".boton-eliminar"
        );

        if (!boton) {
            return;
        }

        // Evita que el código anterior abra
        // la ventana de confirmación de Chrome.

        evento.preventDefault();
        evento.stopPropagation();
        evento.stopImmediatePropagation();

        if (eliminando) {
            return;
        }

        const tarjeta = boton.closest(
            ".tarjeta-escrito"
        );

        if (!tarjeta || !tarjeta.dataset.id) {
            return;
        }

        tarjetaSeleccionada = tarjeta;
        botonOriginal = boton;

        const titulo = tarjeta.querySelector(
            ".titulo-escrito"
        );

        nombreEscrito.textContent = (
            titulo?.textContent.trim() ||
            "este escrito"
        );

        mensajeError.hidden = true;
        mensajeError.textContent = "";

        modal.showModal();
        botonCancelar.focus();

    }, true);


    // =====================================
    // CANCELAR ELIMINACIÓN
    // =====================================

    botonCancelar.addEventListener("click", () => {

        if (!eliminando) {
            modal.close();
        }

    });


    // =====================================
    // CONFIRMAR ELIMINACIÓN
    // =====================================

    botonConfirmar.addEventListener(
        "click",
        async () => {

            if (
                eliminando ||
                !tarjetaSeleccionada
            ) {
                return;
            }

            eliminando = true;

            botonConfirmar.disabled = true;
            botonCancelar.disabled = true;

            botonConfirmar.textContent = "Eliminando...";

            mensajeError.hidden = true;

            const id = tarjetaSeleccionada.dataset.id;

            try {

                const respuesta = await fetch(
                    `/api/diario/${encodeURIComponent(id)}`,
                    {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "X-CSRF-Token":
                                modal.dataset.csrf || ""
                        }
                    }
                );

                const datos = await respuesta
                    .json()
                    .catch(() => ({}));

                if (!respuesta.ok) {

                    throw new Error(
                        datos.mensaje ||
                        "No se pudo eliminar el escrito."
                    );

                }

                // Solo actualizar después de que
                // Flask confirme la eliminación.

                modal.close();

                window.location.reload();

            } catch (error) {

                mensajeError.textContent = (
                    error.message ||
                    "Ocurrió un error. Intenta nuevamente."
                );

                mensajeError.hidden = false;

            } finally {

                eliminando = false;

                botonConfirmar.disabled = false;
                botonCancelar.disabled = false;

                botonConfirmar.textContent = "Sí, eliminar";

            }

        }
    );


    // =====================================
    // CERRAR CON ESCAPE
    // =====================================

    modal.addEventListener("cancel", (evento) => {

        if (eliminando) {
            evento.preventDefault();
        }

    });


    // =====================================
    // RESTAURAR EL FOCO AL CERRAR
    // =====================================

    modal.addEventListener("close", () => {

        if (botonOriginal && botonOriginal.isConnected) {
            botonOriginal.focus();
        }

    });

});
