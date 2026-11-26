
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

/* =====================================================
   CONTIGO - BOTÓN SOS Y LÍNEAS DE AYUDA (1 TOQUE)
   Acceso inmediato a líneas oficiales y Red de Apoyo
===================================================== */

(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("contigo-sos-btn")) return;

        // 1. Estilos encapsulados del botón y modal SOS
        const estilos = document.createElement("style");
        estilos.textContent = `
            #contigo-sos-btn {
                position: fixed;
                right: 18px;
                bottom: 18px;
                z-index: 9990;
                display: inline-flex;
                align-items: center;
                gap: 7px;
                padding: 10px 16px;
                border: none;
                border-radius: 999px;
                background: linear-gradient(135deg, #e15666, #c93b4d);
                color: #ffffff;
                font-family: "Segoe UI", Arial, sans-serif;
                font-size: 13.5px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 6px 18px rgba(201, 59, 77, 0.34);
                transition: transform 0.18s ease, box-shadow 0.18s ease;
            }
            #contigo-sos-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 22px rgba(201, 59, 77, 0.44);
            }
            #contigo-sos-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: rgba(34, 22, 53, 0.55);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
            }
            #contigo-sos-overlay[hidden] {
                display: none !important;
            }
            .contigo-sos-modal {
                width: min(100%, 440px);
                max-height: 90vh;
                overflow-y: auto;
                background: #fffaff;
                border: 1px solid #f4c9d7;
                border-radius: 22px;
                padding: 22px 20px;
                box-shadow: 0 18px 42px rgba(34, 22, 53, 0.25);
                font-family: "Segoe UI", Arial, sans-serif;
                color: #3b236e;
            }
            .contigo-sos-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 10px;
            }
            .contigo-sos-top h2 {
                margin: 0;
                font-size: 18px;
                color: #b83244;
            }
            .contigo-sos-cerrar {
                border: none;
                background: #ffe8ec;
                color: #b83244;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                font-size: 18px;
                font-weight: 700;
                cursor: pointer;
            }
            .contigo-sos-aviso {
                margin: 0 0 14px;
                padding: 10px 12px;
                background: #fff1f3;
                border-left: 4px solid #e15666;
                border-radius: 10px;
                font-size: 13px;
                line-height: 1.45;
                color: #6b2b37;
            }
            .contigo-sos-subtitulo {
                margin: 14px 0 8px;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.4px;
                color: #6532b3;
            }
            .contigo-sos-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 11px 13px;
                margin-bottom: 8px;
                background: #f9f4ff;
                border: 1px solid #e4d5f5;
                border-radius: 13px;
            }
            .contigo-sos-item strong {
                display: block;
                font-size: 14px;
                color: #3b236e;
            }
            .contigo-sos-item small {
                display: block;
                font-size: 12px;
                color: #6f5f87;
            }
            .contigo-sos-llamar {
                flex-shrink: 0;
                text-decoration: none;
                background: #e15666;
                color: #ffffff;
                padding: 8px 13px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 700;
            }
            .contigo-sos-llamar.contacto {
                background: #7c4dbd;
            }
            .contigo-sos-vacio {
                font-size: 13px;
                color: #6f5f87;
                margin: 6px 0 12px;
            }
            .contigo-sos-link-red {
                display: inline-block;
                margin-top: 4px;
                font-size: 13px;
                font-weight: 700;
                color: #6532b3;
                text-decoration: none;
            }
        `;
        document.head.appendChild(estilos);

        // 2. Crear botón flotante
        const botonSos = document.createElement("button");
        botonSos.type = "button";
        botonSos.id = "contigo-sos-btn";
        botonSos.setAttribute("aria-label", "Abrir líneas de ayuda inmediata y contactos de confianza");
        botonSos.innerHTML = "🆘 Ayuda";
        document.body.appendChild(botonSos);

        // 3. Crear ventana modal SOS
        const overlay = document.createElement("div");
        overlay.id = "contigo-sos-overlay";
        overlay.hidden = true;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "contigo-sos-titulo");

        overlay.innerHTML = `
            <div class="contigo-sos-modal">
                <div class="contigo-sos-top">
                    <h2 id="contigo-sos-titulo">🆘 Apoyo inmediato (1 toque)</h2>
                    <button type="button" class="contigo-sos-cerrar" aria-label="Cerrar">×</button>
                </div>

                <p class="contigo-sos-aviso">
                    No estás solo(a). Si atraviesas una crisis o necesitas hablar con un profesional ahora mismo, comunícate gratis con estas líneas de atención en Colombia:
                </p>

                <div class="contigo-sos-subtitulo">Líneas oficiales de atención</div>

                <div class="contigo-sos-item">
                    <div>
                        <strong>Línea 106 — Orientación Psicológica</strong>
                        <small>Atención gratuita 24/7 en salud mental</small>
                    </div>
                    <a href="tel:106" class="contigo-sos-llamar">📞 Llamar 106</a>
                </div>

                <div class="contigo-sos-item">
                    <div>
                        <strong>Línea 192 (Opción 4) — MinSalud</strong>
                        <small>Atención nacional en salud mental</small>
                    </div>
                    <a href="tel:192" class="contigo-sos-llamar">📞 Llamar 192</a>
                </div>

                <div class="contigo-sos-item">
                    <div>
                        <strong>Línea 123 — Emergencias</strong>
                        <small>Urgencias médicas o riesgo inmediato</small>
                    </div>
                    <a href="tel:123" class="contigo-sos-llamar">📞 Llamar 123</a>
                </div>

                <div class="contigo-sos-subtitulo">Tu Red de Apoyo personal</div>
                <div id="contigo-sos-contactos">
                    <p class="contigo-sos-vacio">Consultando tus contactos de confianza...</p>
                </div>
                <a href="/red-apoyo" class="contigo-sos-link-red">Administrar mi Red de Apoyo →</a>
            </div>
        `;
        document.body.appendChild(overlay);

        const cajaContactos = overlay.querySelector("#contigo-sos-contactos");
        const btnCerrar = overlay.querySelector(".contigo-sos-cerrar");

        async function cargarContactosConfianza() {
            try {
                const resp = await fetch("/api/red-apoyo/contactos", {
                    credentials: "same-origin",
                    headers: { Accept: "application/json" }
                });
                if (!resp.ok) throw new Error();
                const datos = await resp.json();
                const lista = Array.isArray(datos.contactos) ? datos.contactos : [];

                cajaContactos.replaceChildren();

                if (lista.length === 0) {
                    const p = document.createElement("p");
                    p.className = "contigo-sos-vacio";
                    p.textContent = "Aún no tienes contactos registrados en tu Red de Apoyo.";
                    cajaContactos.appendChild(p);
                    return;
                }

                lista.forEach((c) => {
                    const telLimpio = String(c.telefono || "").replace(/[^\d+]/g, "");
                    const item = document.createElement("div");
                    item.className = "contigo-sos-item";

                    const info = document.createElement("div");
                    const nombre = document.createElement("strong");
                    nombre.textContent = c.nombre || "Contacto de confianza";
                    const rel = document.createElement("small");
                    rel.textContent = (c.relacion ? c.relacion + " • " : "") + (c.telefono || "");
                    info.append(nombre, rel);

                    item.appendChild(info);

                    if (telLimpio) {
                        const enlace = document.createElement("a");
                        enlace.href = "tel:" + telLimpio;
                        enlace.className = "contigo-sos-llamar contacto";
                        enlace.textContent = "📞 Llamar";
                        item.appendChild(enlace);
                    }

                    cajaContactos.appendChild(item);
                });
            } catch {
                cajaContactos.innerHTML =
                    '<p class="contigo-sos-vacio">Ingresa a tu Red de Apoyo para ver tus contactos guardados.</p>';
            }
        }

        function abrirSos() {
            overlay.hidden = false;
            cargarContactosConfianza();
        }

        function cerrarSos() {
            overlay.hidden = true;
        }

        botonSos.addEventListener("click", abrirSos);
        btnCerrar.addEventListener("click", cerrarSos);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) cerrarSos();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !overlay.hidden) cerrarSos();
        });
    });
})();