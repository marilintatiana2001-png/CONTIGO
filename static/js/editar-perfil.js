
/* =====================================================
   CONTIGO - EDICIÓN DE PERFIL

   Pantalla independiente: /perfil/editar

   Funcionalidades:
   - Abrir pantalla desde Mi Perfil
   - Seleccionar fotografía de galería
   - Previsualizar foto antes de guardarla
   - Conservar o recuperar el zorrito
   - Editar nombre en MariaDB
   - Guardar foto en el servidor

   Sin confirmaciones emergentes de Chrome.
===================================================== */

(() => {
    "use strict";

    const $ = (id) =>
        document.getElementById(id);

    const FOTO_API = "/api/perfil/foto";

    let archivoPendiente = null;
    let urlTemporal = null;
    let trabajando = false;

    // ==========================================
    // OBTENER EL ZORRITO ORIGINAL
    // ==========================================

    function obtenerZorrito() {
        const imagenLogo =
            document.querySelector(
                ".perfil-logo img, .editar-logo img"
            );

        return imagenLogo
            ? imagenLogo.src
            : "/static/img/logo-contigo.jpeg";
    }

    // ==========================================
    // MOSTRAR LA FOTO DEL USUARIO
    // ==========================================

    function cargarFoto(imagen) {

        if (!imagen) {
            return;
        }

        const zorrito = obtenerZorrito();

        imagen.onerror = () => {

            // Si la foto no existe, usar
            // automáticamente el avatar oficial.

            if (imagen.src !== zorrito) {
                imagen.src = zorrito;
            }
        };

        imagen.src =
            FOTO_API + "?v=" + Date.now();
    }

    // ==========================================
    // ABRIR LA PANTALLA DESDE MI PERFIL
    // ==========================================

    function iniciarAccesoDesdePerfil() {

        const avatar =
            document.querySelector(
                ".perfil-avatar"
            );

        const datos =
            document.querySelector(
                ".perfil-datos"
            );

        if (!avatar || !datos) {
            return;
        }

        const imagen =
            avatar.querySelector("img");

        cargarFoto(imagen);

        // CÁMARA SOBRE EL AVATAR

        const camara =
            document.createElement("a");

        camara.href = "/perfil/editar";

        camara.className =
            "perfil-camara-enlace";

        camara.textContent = "📷";

        camara.title =
            "Personalizar mi foto de perfil";

        camara.setAttribute(
            "aria-label",
            "Editar mi foto de perfil"
        );

        avatar.appendChild(camara);

        // ÚNICO BOTÓN DE EDICIÓN

        const botonEditar =
            document.createElement("a");

        botonEditar.href = "/perfil/editar";

        botonEditar.className =
            "perfil-editar-enlace";

        botonEditar.textContent =
            "✏️ Editar perfil";

        datos.appendChild(botonEditar);
    }

    // ==========================================
    // PETICIONES A FLASK
    // ==========================================

    async function api(ruta, opciones = {}) {

        const respuesta = await fetch(
            ruta,
            {
                credentials: "same-origin",
                ...opciones
            }
        );

        let datos = {};

        try {
            datos = await respuesta.json();
        } catch {
            throw new Error(
                "El servidor no devolvió una respuesta válida."
            );
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo completar la operación."
            );
        }

        return datos;
    }

    async function obtenerCSRF() {

        const datos = await api("/api/csrf");

        if (!datos.csrf_token) {
            throw new Error(
                "No se pudo verificar tu sesión."
            );
        }

        return datos.csrf_token;
    }

    // ==========================================
    // INICIAR PANTALLA DE EDICIÓN
    // ==========================================

    function iniciarPantallaEdicion() {

        const imagen = $("editar-foto-vista");
        const etiqueta = $("editar-foto-etiqueta");

        const botonGaleria =
            $("editar-elegir-foto");

        const botonZorrito =
            $("editar-usar-zorrito");

        const inputFoto =
            $("editar-archivo-foto");

        const fotoPendiente =
            $("editar-foto-pendiente");

        const nombreArchivo =
            $("editar-nombre-archivo");

        const guardarFoto =
            $("editar-guardar-foto");

        const cancelarFoto =
            $("editar-cancelar-foto");

        const formulario =
            $("editar-formulario-nombre");

        const inputNombre =
            $("editar-input-nombre");

        const guardarNombre =
            $("editar-guardar-nombre");

        const mensaje =
            $("editar-mensaje");

        const zorrito =
            obtenerZorrito();

        // ======================================
        // MENSAJES DENTRO DE CONTIGO
        // ======================================

        function informar(
            texto,
            esError = false
        ) {

            mensaje.textContent = texto;

            mensaje.className =
                "editar-mensaje " +
                (esError ? "error" : "exito");

            mensaje.hidden = false;
        }

        // ======================================
        // LIBERAR VISTA PREVIA
        // ======================================

        function limpiarTemporal() {

            if (urlTemporal) {
                URL.revokeObjectURL(
                    urlTemporal
                );

                urlTemporal = null;
            }

            archivoPendiente = null;

            fotoPendiente.hidden = true;
            inputFoto.value = "";
        }

        function cancelarSeleccion() {

            limpiarTemporal();

            cargarFoto(imagen);

            etiqueta.textContent =
                "Tu imagen de perfil";
        }

        // ======================================
        // FOTO ACTUAL
        // ======================================

        cargarFoto(imagen);

        // ======================================
        // CONSULTAR NOMBRE ACTUAL
        // ======================================

        async function cargarNombre() {

            try {

                const datos = await api(
                    "/api/perfil/resumen"
                );

                if (
                    datos.perfil &&
                    datos.perfil.nombre
                ) {
                    inputNombre.value =
                        datos.perfil.nombre;
                }

            } catch (error) {

                console.warn(
                    "No se pudo actualizar el nombre desde el servidor:",
                    error.message
                );
            }
        }

        cargarNombre();

        // ======================================
        // ABRIR GALERÍA DEL DISPOSITIVO
        // ======================================

        botonGaleria.addEventListener(
            "click",
            () => {

                if (trabajando) {
                    return;
                }

                inputFoto.click();
            }
        );

        // ======================================
        // SELECCIONAR UNA FOTOGRAFÍA
        // ======================================

        inputFoto.addEventListener(
            "change",
            () => {

                const archivo =
                    inputFoto.files?.[0];

                if (!archivo) {
                    return;
                }

                const formatos = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (
                    !formatos.includes(
                        archivo.type
                    )
                ) {

                    informar(
                        "Selecciona una imagen JPG, PNG o WebP.",
                        true
                    );

                    inputFoto.value = "";
                    return;
                }

                if (
                    archivo.size >
                    2 * 1024 * 1024
                ) {

                    informar(
                        "La fotografía debe pesar máximo 2 MB.",
                        true
                    );

                    inputFoto.value = "";
                    return;
                }

                limpiarTemporal();

                archivoPendiente = archivo;

                urlTemporal =
                    URL.createObjectURL(
                        archivo
                    );

                // MOSTRAR LA FOTO ANTES DE GUARDAR

                imagen.src = urlTemporal;

                etiqueta.textContent =
                    "Vista previa de tu nueva foto";

                nombreArchivo.textContent =
                    "Foto seleccionada: " +
                    archivo.name;

                fotoPendiente.hidden = false;

                mensaje.hidden = true;
            }
        );

        // ======================================
        // CANCELAR LA FOTO SELECCIONADA
        // ======================================

        cancelarFoto.addEventListener(
            "click",
            cancelarSeleccion
        );

        // ======================================
        // GUARDAR FOTO EN EL SERVIDOR
        // ======================================

        guardarFoto.addEventListener(
            "click",
            async () => {

                if (
                    trabajando ||
                    !archivoPendiente
                ) {
                    return;
                }

                trabajando = true;

                guardarFoto.disabled = true;
                botonGaleria.disabled = true;
                botonZorrito.disabled = true;

                guardarFoto.textContent =
                    "Guardando fotografía...";

                try {

                    const csrf =
                        await obtenerCSRF();

                    const datos =
                        new FormData();

                    datos.append(
                        "foto",
                        archivoPendiente
                    );

                    await api(
                        FOTO_API,
                        {
                            method: "POST",

                            headers: {
                                "X-CSRF-Token":
                                    csrf
                            },

                            body: datos
                        }
                    );

                    limpiarTemporal();
                    cargarFoto(imagen);

                    etiqueta.textContent =
                        "Tu nueva foto de perfil";

                    informar(
                        "✅ Tu fotografía se guardó correctamente."
                    );

                } catch (error) {

                    informar(
                        error.message,
                        true
                    );

                } finally {

                    trabajando = false;

                    guardarFoto.disabled = false;
                    botonGaleria.disabled = false;
                    botonZorrito.disabled = false;

                    guardarFoto.textContent =
                        "💜 Guardar esta foto";
                }
            }
        );

        // ======================================
        // MANTENER O RECUPERAR EL ZORRITO
        // ======================================

        botonZorrito.addEventListener(
            "click",
            async () => {

                if (trabajando) {
                    return;
                }

                trabajando = true;

                botonZorrito.disabled = true;
                botonGaleria.disabled = true;
                guardarFoto.disabled = true;

                try {

                    const csrf =
                        await obtenerCSRF();

                    // DELETE es seguro aquí porque
                    // elimina únicamente la foto
                    // del usuario de la sesión.

                    await api(
                        FOTO_API,
                        {
                            method: "DELETE",

                            headers: {
                                "X-CSRF-Token":
                                    csrf
                            }
                        }
                    );

                    limpiarTemporal();

                    imagen.src = zorrito;

                    etiqueta.textContent =
                        "Zorrito de CONTIGO";

                    informar(
                        "💜 Elegiste mantener el zorrito de CONTIGO como tu avatar."
                    );

                } catch (error) {

                    informar(
                        error.message,
                        true
                    );

                } finally {

                    trabajando = false;

                    botonZorrito.disabled = false;
                    botonGaleria.disabled = false;
                    guardarFoto.disabled = false;
                }
            }
        );

        // ======================================
        // GUARDAR NOMBRE EN MARIADB
        // ======================================

        formulario.addEventListener(
            "submit",
            async (evento) => {

                evento.preventDefault();

                if (trabajando) {
                    return;
                }

                const nombre =
                    inputNombre.value
                        .trim()
                        .replace(/\s+/g, " ");

                if (
                    nombre.length < 2 ||
                    nombre.length > 100
                ) {

                    informar(
                        "El nombre debe tener entre 2 y 100 caracteres.",
                        true
                    );

                    return;
                }

                trabajando = true;

                guardarNombre.disabled = true;

                guardarNombre.textContent =
                    "Guardando nombre...";

                try {

                    const csrf =
                        await obtenerCSRF();

                    const datos = await api(
                        "/api/perfil/nombre",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "X-CSRF-Token":
                                    csrf
                            },

                            body: JSON.stringify({
                                nombre
                            })
                        }
                    );

                    inputNombre.value =
                        datos.nombre || nombre;

                    informar(
                        "✅ Tu nombre fue actualizado correctamente."
                    );

                } catch (error) {

                    informar(
                        error.message,
                        true
                    );

                } finally {

                    trabajando = false;
                    guardarNombre.disabled = false;

                    guardarNombre.textContent =
                        "💜 Guardar mi nombre";
                }
            }
        );

        // LIMPIAR OBJETOS TEMPORALES

        window.addEventListener(
            "pagehide",
            () => {

                if (urlTemporal) {
                    URL.revokeObjectURL(
                        urlTemporal
                    );
                }
            }
        );
    }

    // ==========================================
    // INICIAR SEGÚN LA PANTALLA
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            if ($("editar-perfil-pagina")) {

                iniciarPantallaEdicion();

            } else {

                iniciarAccesoDesdePerfil();
            }
        }
    );

})();
