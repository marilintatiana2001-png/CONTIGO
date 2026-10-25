
/* ==========================================
   CONTIGO - MI DIARIO EMOCIONAL
   Funciones:
   - Consultar escrito completo
   - Editar escrito
   - Guardar cambios
   - Eliminar escrito
========================================== */


// ==========================================
// 1. ELEMENTOS DEL DIARIO
// ==========================================

const panelEdicion = document.getElementById("panel-edicion");

const formEdicion = document.getElementById("form-edicion");

const cancelarEdicion = document.getElementById("cancelar-edicion");

const mensajeEdicion = document.getElementById("mensaje-edicion");

const editarId = document.getElementById("editar-id");

const editarTitulo = document.getElementById("editar-titulo");

const editarContenido = document.getElementById("editar-contenido");


// ==========================================
// 2. FUNCIÓN PARA CERRAR LA EDICIÓN
// ==========================================

function cerrarPanelEdicion() {

    if (!panelEdicion) return;

    panelEdicion.hidden = true;

    if (formEdicion) {
        formEdicion.reset();
    }

    if (mensajeEdicion) {
        mensajeEdicion.textContent = "";
    }
}


// ==========================================
// 3. EDITAR UN ESCRITO
// ==========================================

document.querySelectorAll(".boton-editar").forEach(boton => {

    boton.addEventListener("click", async function () {

        const tarjeta = boton.closest(".tarjeta-escrito");

        if (!tarjeta || !panelEdicion) return;

        const id = tarjeta.dataset.id;

        boton.disabled = true;

        try {

            // Consultar el escrito completo en MariaDB
            const respuesta = await fetch(`/api/diario/${id}`);

            if (respuesta.status === 401) {
                window.location.href = "/";
                return;
            }

            const escrito = await respuesta.json();

            if (!respuesta.ok) {
                alert(escrito.mensaje || "No pudimos cargar el escrito.");
                return;
            }

            // Cargar los datos originales
            editarId.value = escrito.id_entrada;

            editarTitulo.value = escrito.titulo || "";

            editarContenido.value = escrito.contenido || "";

            mensajeEdicion.textContent = "";

            // Mostrar ventana de edición
            panelEdicion.hidden = false;

            editarTitulo.focus();

        } catch (error) {

            console.error("Error al consultar escrito:", error);

            alert(
                "No pudimos conectar con el servidor para cargar el escrito."
            );

        } finally {

            boton.disabled = false;

        }

    });

});


// ==========================================
// 4. CANCELAR EDICIÓN
// ==========================================

if (cancelarEdicion) {

    cancelarEdicion.addEventListener("click", function () {

        cerrarPanelEdicion();

    });

}


// ==========================================
// 5. GUARDAR CAMBIOS DEL ESCRITO
// ==========================================

if (formEdicion) {

    formEdicion.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const id = editarId.value;

        const titulo = editarTitulo.value.trim();

        const contenido = editarContenido.value.trim();

        const botonGuardar = formEdicion.querySelector(
            'button[type="submit"]'
        );

        // Validar campos
        if (!titulo || !contenido) {

            mensajeEdicion.textContent =
                "Debes completar el título y el contenido.";

            return;
        }

        if (titulo.length > 150) {

            mensajeEdicion.textContent =
                "El título no puede superar 150 caracteres.";

            return;
        }

        botonGuardar.disabled = true;

        mensajeEdicion.textContent =
            "Guardando los cambios de tu escrito...";

        try {

            const respuesta = await fetch(`/api/diario/${id}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    titulo: titulo,
                    contenido: contenido
                })

            });

            if (respuesta.status === 401) {
                window.location.href = "/";
                return;
            }

            const resultado = await respuesta.json();

            if (respuesta.ok) {

                mensajeEdicion.textContent =
                    "¡Tu escrito se actualizó correctamente!";

                // Recargar para mostrar los cambios
                window.location.reload();

            } else {

                mensajeEdicion.textContent =
                    resultado.mensaje ||
                    "No pudimos actualizar el escrito.";

            }

        } catch (error) {

            console.error("Error al editar escrito:", error);

            mensajeEdicion.textContent =
                "No pudimos conectar con el servidor.";

        } finally {

            botonGuardar.disabled = false;

        }

    });

}


// ==========================================
// 6. ELIMINAR UN ESCRITO
// ==========================================

document.querySelectorAll(".boton-eliminar").forEach(boton => {

    boton.addEventListener("click", async function () {

        const tarjeta = boton.closest(".tarjeta-escrito");

        if (!tarjeta) return;

        const id = tarjeta.dataset.id;

        const titulo = tarjeta.querySelector(
            ".titulo-escrito"
        )?.textContent.trim() || "este escrito";

        // Confirmar antes de eliminar
        const confirmado = confirm(
            `¿Estás seguro de que deseas eliminar "${titulo}"?\n\n` +
            "Esta acción no se puede deshacer."
        );

        if (!confirmado) return;

        boton.disabled = true;

        try {

            const respuesta = await fetch(`/api/diario/${id}`, {

                method: "DELETE"

            });

            if (respuesta.status === 401) {
                window.location.href = "/";
                return;
            }

            const resultado = await respuesta.json();

            if (respuesta.ok) {

                // Actualizar el listado
                window.location.reload();

            } else {

                alert(
                    resultado.mensaje ||
                    "No pudimos eliminar el escrito."
                );

            }

        } catch (error) {

            console.error("Error al eliminar escrito:", error);

            alert(
                "No pudimos conectar con el servidor."
            );

        } finally {

            boton.disabled = false;

        }

    });

});


// ==========================================
// 7. CERRAR EDICIÓN AL HACER CLIC AFUERA
// ==========================================

if (panelEdicion) {

    panelEdicion.addEventListener("click", function (evento) {

        if (evento.target === panelEdicion) {

            cerrarPanelEdicion();

        }

    });

}


// ==========================================
// 8. CERRAR EDICIÓN CON TECLA ESCAPE
// ==========================================

document.addEventListener("keydown", function (evento) {

    if (
        evento.key === "Escape" &&
        panelEdicion &&
        !panelEdicion.hidden
    ) {

        cerrarPanelEdicion();

    }

});
