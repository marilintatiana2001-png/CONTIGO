
/* =====================================================
   CONTIGO - NOTIFICACIONES GLOBALES
   Conexión con Flask y MariaDB

   Funcionalidades:
   - Consultar notificaciones del usuario
   - Mostrar contador de notificaciones pendientes
   - Abrir y cerrar la campanita
   - Marcar notificaciones como leídas
   - Marcar todas como leídas

   No envía mensajes automáticos a contactos.
===================================================== */

(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {

        // ==========================================
        // 1. BUSCAR LA CAMPANITA
        // ==========================================

        const campana = document.querySelector(
            "[data-contigo-notificaciones]"
        );

        if (!campana) {
            return;
        }

        let csrfToken = "";
        let guardando = false;

        // ==========================================
        // 2. CREAR PANEL DE NOTIFICACIONES
        // ==========================================

        const panel = document.createElement("aside");

        panel.id = "contigo-notificaciones-panel";
        panel.className = "contigo-notif-panel";
        panel.hidden = true;

        panel.setAttribute("role", "dialog");
        panel.setAttribute(
            "aria-label",
            "Mis notificaciones"
        );

        panel.setAttribute("tabindex", "-1");

        panel.innerHTML = `
            <div class="contigo-notif-cabecera">
                <div>
                    <h2>🔔 Mis notificaciones</h2>
                    <p>Un espacio para cuidar de ti 💜</p>
                </div>

                <button
                    type="button"
                    class="contigo-notif-cerrar"
                    aria-label="Cerrar notificaciones"
                >
                    ×
                </button>
            </div>

            <div class="contigo-notif-contenido">

                <div
                    class="contigo-notif-lista"
                    aria-live="polite"
                ></div>

                <button
                    type="button"
                    class="contigo-notif-leer-todas"
                >
                    ✓ Marcar todas como leídas
                </button>

            </div>
        `;

        document.body.appendChild(panel);

        const lista = panel.querySelector(
            ".contigo-notif-lista"
        );

        const botonTodas = panel.querySelector(
            ".contigo-notif-leer-todas"
        );

        // ==========================================
        // 3. CONTADOR DE NOTIFICACIONES
        // ==========================================

        const contador = document.createElement("span");

        contador.className = "contigo-notif-contador";
        contador.hidden = true;

        contador.setAttribute("aria-hidden", "true");

        campana.appendChild(contador);

        campana.setAttribute(
            "aria-haspopup",
            "dialog"
        );

        campana.setAttribute(
            "aria-controls",
            panel.id
        );

        campana.setAttribute(
            "aria-expanded",
            "false"
        );

        // ==========================================
        // 4. CONEXIÓN CON FLASK
        // ==========================================

        async function api(ruta, opciones = {}) {

            const respuesta = await fetch(ruta, {
                credentials: "same-origin",
                ...opciones
            });

            let datos = {};

            try {
                datos = await respuesta.json();
            } catch (error) {
                throw new Error(
                    "El servidor no devolvió datos válidos."
                );
            }

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje ||
                    "No se pudo completar la solicitud."
                );
            }

            return datos;
        }

        // ==========================================
        // 5. OBTENER TOKEN DE SEGURIDAD
        // ==========================================

        async function obtenerCSRF() {

            if (csrfToken) {
                return csrfToken;
            }

            const datos = await api("/api/csrf");

            csrfToken = datos.csrf_token || "";

            if (!csrfToken) {
                throw new Error(
                    "No se pudo verificar tu sesión."
                );
            }

            return csrfToken;
        }

        // ==========================================
        // 6. CONSULTAR NOTIFICACIONES DE MARIADB
        // ==========================================

        async function cargarNotificaciones() {

            lista.textContent =
                "Consultando tus notificaciones...";

            botonTodas.disabled = true;

            try {

                const datos = await api(
                    "/api/notificaciones"
                );

                const notificaciones =
                    Array.isArray(datos.notificaciones)
                        ? datos.notificaciones
                        : [];

                const pendientes = Math.max(
                    0,
                    Number(datos.total_pendientes) || 0
                );

                // ACTUALIZAR CONTADOR

                contador.textContent =
                    pendientes > 99
                        ? "99+"
                        : String(pendientes);

                contador.hidden = pendientes === 0;

                campana.setAttribute(
                    "aria-label",
                    pendientes
                        ? `${pendientes} notificaciones sin leer`
                        : "Mis notificaciones"
                );

                botonTodas.disabled =
                    pendientes === 0;

                lista.replaceChildren();

                // SIN NOTIFICACIONES

                if (notificaciones.length === 0) {

                    const vacio =
                        document.createElement("p");

                    vacio.className =
                        "contigo-notif-vacio";

                    vacio.textContent =
                        "🌷 Todavía no tienes " +
                        "notificaciones guardadas.";

                    lista.appendChild(vacio);

                    return;
                }

                // CREAR TARJETAS

                notificaciones.forEach((notificacion) => {

                    const tarjeta =
                        document.createElement("article");

                    tarjeta.className =
                        "contigo-notif-tarjeta" +
                        (notificacion.leida ? " leida" : "");

                    const titulo =
                        document.createElement("h3");

                    titulo.textContent =
                        notificacion.titulo ||
                        "Notificación";

                    const mensaje =
                        document.createElement("p");

                    mensaje.textContent =
                        notificacion.mensaje || "";

                    tarjeta.append(titulo, mensaje);

                    // FECHA

                    if (notificacion.fecha_creacion) {

                        const fecha =
                            document.createElement("small");

                        const fechaObjeto = new Date(
                            notificacion.fecha_creacion
                        );

                        if (!isNaN(fechaObjeto.getTime())) {

                            fecha.textContent =
                                fechaObjeto.toLocaleString(
                                    "es-CO"
                                );

                            tarjeta.appendChild(fecha);
                        }
                    }

                    // ACCIONES

                    const acciones =
                        document.createElement("div");

                    acciones.className =
                        "contigo-notif-acciones";

                    if (notificacion.leida) {

                        const leida =
                            document.createElement("span");

                        leida.textContent = "✓ Leída";

                        acciones.appendChild(leida);

                    } else {

                        const botonLeer =
                            document.createElement("button");

                        botonLeer.type = "button";

                        botonLeer.textContent =
                            "✓ Marcar como leída";

                        botonLeer.addEventListener(
                            "click",
                            () => marcarComoLeida(
                                "/api/notificaciones/" +
                                notificacion.id_notificacion +
                                "/leer"
                            )
                        );

                        acciones.appendChild(botonLeer);
                    }

                    // ENLACE A RED DE APOYO

                    if (
                        notificacion.enlace === "/red-apoyo"
                    ) {

                        const enlace =
                            document.createElement("a");

                        enlace.href = "/red-apoyo";

                        enlace.textContent =
                            "Ir a mi Red de Apoyo →";

                        acciones.appendChild(enlace);
                    }

                    tarjeta.appendChild(acciones);
                    lista.appendChild(tarjeta);
                });

            } catch (error) {

                lista.textContent =
                    "No pudimos cargar tus notificaciones: " +
                    error.message;
            }
        }

        // ==========================================
        // 7. MARCAR COMO LEÍDA
        // ==========================================

        async function marcarComoLeida(ruta) {

            if (guardando) {
                return;
            }

            guardando = true;
            botonTodas.disabled = true;

            try {

                const token = await obtenerCSRF();

                await api(ruta, {
                    method: "PUT",

                    headers: {
                        "X-CSRF-Token": token
                    }
                });

                await cargarNotificaciones();

            } catch (error) {

                lista.textContent =
                    "No se pudo actualizar la notificación: " +
                    error.message;

            } finally {

                guardando = false;
            }
        }

        // ==========================================
        // 8. POSICIONAR PANEL RESPONSIVE
        // ==========================================

        function posicionarPanel() {

            const posicion =
                campana.getBoundingClientRect();

            const ancho = Math.min(
                390,
                window.innerWidth - 24
            );

            const izquierda = Math.max(
                12,
                Math.min(
                    posicion.right - ancho,
                    window.innerWidth - ancho - 12
                )
            );

            const arriba = Math.max(
                12,
                Math.min(
                    posicion.bottom + 10,
                    window.innerHeight - 100
                )
            );

            panel.style.left = izquierda + "px";
            panel.style.top = arriba + "px";

            panel.style.maxHeight =
                Math.max(
                    100,
                    window.innerHeight - arriba - 12
                ) + "px";
        }

        // ==========================================
        // 9. ABRIR Y CERRAR PANEL
        // ==========================================

        function cerrarPanel() {

            if (panel.hidden) {
                return;
            }

            panel.hidden = true;

            campana.setAttribute(
                "aria-expanded",
                "false"
            );

            campana.focus();
        }

        campana.addEventListener(
            "click",
            (evento) => {

                evento.preventDefault();

                if (!panel.hidden) {

                    cerrarPanel();
                    return;
                }

                posicionarPanel();

                panel.hidden = false;

                campana.setAttribute(
                    "aria-expanded",
                    "true"
                );

                panel.focus();

                cargarNotificaciones();
            }
        );

        // BOTÓN CERRAR

        panel.querySelector(
            ".contigo-notif-cerrar"
        ).addEventListener(
            "click",
            cerrarPanel
        );

        // MARCAR TODAS COMO LEÍDAS

        botonTodas.addEventListener(
            "click",
            () => {

                marcarComoLeida(
                    "/api/notificaciones/leer-todas"
                );

            }
        );

        // CERRAR CON ESCAPE

        document.addEventListener(
            "keydown",
            (evento) => {

                if (evento.key === "Escape") {
                    cerrarPanel();
                }

            }
        );

        // CERRAR AL HACER CLIC FUERA

        document.addEventListener(
            "pointerdown",
            (evento) => {

                if (
                    !panel.hidden &&
                    !panel.contains(evento.target) &&
                    !campana.contains(evento.target)
                ) {
                    cerrarPanel();
                }

            }
        );

        // AJUSTAR POSICIÓN CON EL ZOOM O TAMAÑO

        window.addEventListener(
            "resize",
            () => {

                if (!panel.hidden) {
                    posicionarPanel();
                }

            }
        );

        window.addEventListener(
            "scroll",
            () => {

                if (!panel.hidden) {
                    posicionarPanel();
                }

            },
            true
        );

        // CONSULTAR NOTIFICACIONES AL INICIAR

        cargarNotificaciones();

    });

})();
