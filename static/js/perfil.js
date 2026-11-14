
/* =====================================================
   CONTIGO - MI PERFIL
   Flask + MariaDB + JavaScript

   Funciones:
   - Información del usuario
   - Progreso emocional
   - Gráfica semanal de emociones
   - Gráfica de actividades completadas
   - Notificaciones
   - Marcar notificaciones como leídas

   Las preferencias y los permisos
   se administran en Configuración.
===================================================== */

(() => {
    "use strict";

    const $ = (id) =>
        document.getElementById(id);

    const colores = [
        "#9971df",
        "#e887bb",
        "#88cddd",
        "#f4bf8d",
        "#b59de6",
        "#8fcab9",
        "#e8a7a6",
        "#b1c5ec",
        "#d7a3dc",
        "#b8d58b",
        "#f3d194",
        "#a8b8d9",
        "#dfa6c6",
        "#a7d9d2"
    ];

    let tokenCSRF = "";
    let notificaciones = [];
    let operacionEnCurso = false;
    let temporizadorMensaje;

    // ==========================================
    // FUNCIONES GENERALES
    // ==========================================

    function crearNodo(
        etiqueta,
        contenido = "",
        clase = ""
    ) {
        const elemento =
            document.createElement(etiqueta);

        elemento.textContent = contenido;

        if (clase) {
            elemento.className = clase;
        }

        return elemento;
    }

    function formatoNumero(valor) {
        return Math.max(
            0,
            Number(valor) || 0
        ).toLocaleString("es-CO");
    }

    function colocarNumero(id, valor) {
        const elemento = $(id);

        if (elemento) {
            elemento.textContent =
                formatoNumero(valor);
        }
    }

    // ==========================================
    // COMUNICACIÓN CON FLASK
    // ==========================================

    async function api(ruta, opciones = {}) {

        const respuesta = await fetch(ruta, {
            credentials: "same-origin",
            ...opciones,
            headers: {
                Accept: "application/json",
                ...(opciones.headers || {})
            }
        });

        const texto = await respuesta.text();

        let datos = {};

        try {
            datos = texto ? JSON.parse(texto) : {};
        } catch {
            throw new Error(
                "El servidor no devolvió datos válidos."
            );
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                `Error ${respuesta.status}`
            );
        }

        return datos;
    }

    async function obtenerCSRF() {

        if (tokenCSRF) {
            return tokenCSRF;
        }

        const datos = await api("/api/csrf");

        tokenCSRF = datos.csrf_token || "";

        if (!tokenCSRF) {
            throw new Error(
                "No se pudo verificar tu sesión."
            );
        }

        return tokenCSRF;
    }

    async function escribirAPI(
        ruta,
        metodo,
        cuerpo
    ) {
        const token = await obtenerCSRF();

        const opciones = {
            method: metodo,
            headers: {
                "X-CSRF-Token": token
            }
        };

        if (cuerpo !== undefined) {
            opciones.headers["Content-Type"] =
                "application/json";

            opciones.body = JSON.stringify(cuerpo);
        }

        return api(ruta, opciones);
    }

    // ==========================================
    // MENSAJES DE CONFIRMACIÓN
    // ==========================================

    function informar(texto, error = false) {

        const caja = $("mensaje-perfil");

        if (!caja) {
            return;
        }

        clearTimeout(temporizadorMensaje);

        caja.textContent = texto;

        caja.style.background = error
            ? "#ffedf2"
            : "#e9f8ef";

        caja.style.color = error
            ? "#99334d"
            : "#286747";

        caja.hidden = false;

        temporizadorMensaje = setTimeout(() => {
            caja.hidden = true;
        }, 6000);
    }

    // ==========================================
    // NAVEGACIÓN DEL PERFIL
    // ==========================================

    function cerrarCampana() {

        const panel =
            $("panel-notificaciones");

        panel.hidden = true;

        $("boton-campana").setAttribute(
            "aria-expanded",
            "false"
        );
    }

    function mostrarVista(nombre) {

        ["perfil", "progreso"].forEach((vista) => {

            const seccion =
                $("vista-" + vista);

            seccion.hidden =
                vista !== nombre;
        });

        cerrarCampana();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        if (nombre === "progreso") {
            cargarResumen();
        }
    }

    // ==========================================
    // FORMATO DE LOS DÍAS DE LA SEMANA
    // ==========================================

    function diaVisible(fechaISO) {

        const partes = String(fechaISO)
            .split("-")
            .map(Number);

        if (
            partes.length !== 3 ||
            !partes.every(Number.isFinite)
        ) {
            return "Día";
        }

        const fecha = new Date(
            partes[0],
            partes[1] - 1,
            partes[2]
        );

        const nombre =
            new Intl.DateTimeFormat(
                "es-CO",
                { weekday: "short" }
            )
                .format(fecha)
                .replace(".", "");

        return (
            nombre.charAt(0).toUpperCase() +
            nombre.slice(1) +
            " " +
            partes[2]
        );
    }

    // ==========================================
    // GRÁFICA SEMANAL DE EMOCIONES
    // ==========================================

    function dibujarSemana(semana) {

        const caja = $("grafica-semana");
        const leyenda = $("leyenda-semana");
        const nota = $("nota-semana");

        caja.replaceChildren();
        leyenda.replaceChildren();
        nota.textContent = "";

        if (!Array.isArray(semana)) {

            caja.appendChild(
                crearNodo(
                    "p",
                    "No se pudieron cargar los datos semanales.",
                    "contigo-grafica-vacio"
                )
            );

            return;
        }

        const conteos = new Map();

        let totalSemana = 0;
        let diasConRegistros = 0;

        // Calcular totales reales

        semana.forEach((dia) => {

            const emociones =
                Array.isArray(dia.emociones)
                    ? dia.emociones
                    : [];

            const totalDia = emociones.reduce(
                (suma, emocion) =>
                    suma +
                    Number(emocion.cantidad || 0),
                0
            );

            totalSemana += totalDia;

            if (totalDia > 0) {
                diasConRegistros++;
            }

            emociones.forEach((emocion) => {

                const nombre = String(
                    emocion.nombre || "Emoción"
                );

                conteos.set(
                    nombre,
                    (conteos.get(nombre) || 0) +
                    Number(emocion.cantidad || 0)
                );
            });
        });

        if (totalSemana === 0) {

            caja.appendChild(
                crearNodo(
                    "p",
                    "Todavía no hay emociones registradas en los últimos 7 días.",
                    "contigo-grafica-vacio"
                )
            );

            nota.textContent =
                "💜 Cuando registres tus emociones, " +
                "aquí aparecerá tu resumen semanal.";

            return;
        }

        // Asignar colores a cada emoción

        const nombres = [...conteos.keys()].sort(
            (a, b) => a.localeCompare(b, "es")
        );

        const mapaColores = new Map();

        nombres.forEach((nombre, indice) => {
            mapaColores.set(
                nombre,
                colores[indice % colores.length]
            );
        });

        // Crear columnas

        const grafica = crearNodo(
            "div",
            "",
            "contigo-semana-grafica"
        );

        grafica.setAttribute(
            "aria-label",
            "Emociones registradas en los últimos siete días"
        );

        semana.forEach((dia) => {

            const emociones =
                Array.isArray(dia.emociones)
                    ? dia.emociones
                    : [];

            const totalDia = emociones.reduce(
                (suma, emocion) =>
                    suma +
                    Number(emocion.cantidad || 0),
                0
            );

            const columna = crearNodo(
                "div",
                "",
                "contigo-semana-dia"
            );

            const total = crearNodo(
                "span",
                String(totalDia),
                "contigo-semana-total"
            );

            const barra = crearNodo(
                "div",
                "",
                "contigo-semana-barra"
            );

            const descripcion = emociones
                .map(
                    (e) =>
                        `${e.nombre}: ${e.cantidad}`
                )
                .join(", ");

            barra.setAttribute(
                "role",
                "img"
            );

            barra.setAttribute(
                "aria-label",
                diaVisible(dia.fecha) +
                ": " +
                (descripcion || "Sin registros")
            );

            emociones.forEach((emocion) => {

                const cantidad =
                    Number(emocion.cantidad || 0);

                const porcentaje =
                    totalDia > 0
                        ? cantidad / totalDia * 100
                        : 0;

                const segmento = crearNodo(
                    "div",
                    "",
                    "contigo-semana-segmento"
                );

                segmento.style.height =
                    porcentaje + "%";

                segmento.style.background =
                    mapaColores.get(
                        String(emocion.nombre)
                    ) || colores[0];

                segmento.title =
                    `${emocion.nombre}: ${cantidad}`;

                barra.appendChild(segmento);
            });

            const etiqueta = crearNodo(
                "span",
                diaVisible(dia.fecha),
                "contigo-semana-etiqueta"
            );

            columna.append(
                total,
                barra,
                etiqueta
            );

            grafica.appendChild(columna);
        });

        caja.appendChild(grafica);

        // Leyenda de colores

        nombres.forEach((nombre) => {

            const item = crearNodo(
                "span",
                "",
                "contigo-leyenda-item"
            );

            const color = crearNodo(
                "span",
                "",
                "contigo-leyenda-color"
            );

            color.style.background =
                mapaColores.get(nombre);

            item.append(
                color,
                crearNodo("span", nombre)
            );

            leyenda.appendChild(item);
        });

        // Nota de reflexión

        const frecuente = [...conteos.entries()]
            .sort((a, b) => b[1] - a[1])[0];

        nota.textContent =
            `💜 Registraste ${totalSemana} ` +
            `${totalSemana === 1 ? "emoción" : "emociones"} ` +
            `durante ${diasConRegistros} ` +
            `${diasConRegistros === 1 ? "día" : "días"} ` +
            `de la última semana. ` +
            `La emoción más registrada fue ${frecuente[0]}. ` +
            `Este resumen no es un diagnóstico.`;
    }

    // ==========================================
    // GRÁFICA DE ACTIVIDADES REALIZADAS
    // ==========================================

    function dibujarActividades(categorias) {

        const caja =
            $("graficas-actividades");

        const nota =
            $("nota-actividades");

        caja.replaceChildren();
        nota.textContent = "";

        if (!Array.isArray(categorias)) {

            caja.appendChild(
                crearNodo(
                    "p",
                    "No se pudieron consultar las actividades.",
                    "contigo-grafica-vacio"
                )
            );

            return;
        }

        const datos = categorias
            .map((categoria) => ({
                nombre: String(
                    categoria.categoria ||
                    "Sin categoría"
                ),
                cantidad: Math.max(
                    0,
                    Number(categoria.cantidad || 0)
                )
            }))
            .filter((categoria) =>
                categoria.cantidad > 0
            );

        const total = datos.reduce(
            (suma, categoria) =>
                suma + categoria.cantidad,
            0
        );

        if (total === 0) {

            caja.appendChild(
                crearNodo(
                    "p",
                    "Todavía no hay actividades completadas en los últimos 30 días.",
                    "contigo-grafica-vacio"
                )
            );

            nota.textContent =
                "🌷 Cada actividad que completes " +
                "podrá aparecer aquí.";

            return;
        }

        // GRÁFICA CIRCULAR

        let acumulado = 0;

        const sectores = datos.map(
            (categoria, indice) => {

                const inicio =
                    acumulado / total * 100;

                acumulado += categoria.cantidad;

                const fin =
                    acumulado / total * 100;

                return (
                    colores[indice % colores.length] +
                    " " +
                    inicio.toFixed(2) + "% " +
                    fin.toFixed(2) + "%"
                );
            }
        );

        const externo = crearNodo(
            "div",
            "",
            "contigo-dona-externo"
        );

        const dona = crearNodo(
            "div",
            "",
            "contigo-dona"
        );

        dona.style.background =
            `conic-gradient(${sectores.join(", ")})`;

        dona.setAttribute("role", "img");

        dona.setAttribute(
            "aria-label",
            `${total} actividades completadas por categoría`
        );

        const centro = crearNodo(
            "div",
            "",
            "contigo-dona-centro"
        );

        centro.append(
            crearNodo(
                "span",
                String(total),
                "contigo-dona-numero"
            ),
            crearNodo(
                "span",
                "actividades",
                "contigo-dona-texto"
            )
        );

        dona.appendChild(centro);
        externo.appendChild(dona);

        // BARRAS POR CATEGORÍA

        const lista = crearNodo(
            "div",
            "",
            "contigo-categorias-lista"
        );

        const mayor = Math.max(
            ...datos.map((item) => item.cantidad)
        );

        datos.forEach((categoria, indice) => {

            const fila = crearNodo(
                "div",
                "",
                "contigo-categoria-fila"
            );

            const cabecera = crearNodo(
                "div",
                "",
                "contigo-categoria-cabecera"
            );

            cabecera.append(
                crearNodo(
                    "strong",
                    categoria.nombre
                ),
                crearNodo(
                    "span",
                    String(categoria.cantidad)
                )
            );

            const pista = crearNodo(
                "div",
                "",
                "contigo-categoria-pista"
            );

            const barra = crearNodo(
                "div",
                "",
                "contigo-categoria-barra"
            );

            barra.style.width =
                categoria.cantidad / mayor *
                100 + "%";

            barra.style.background =
                colores[indice % colores.length];

            pista.appendChild(barra);
            fila.append(cabecera, pista);
            lista.appendChild(fila);
        });

        caja.append(externo, lista);

        const frecuente = [...datos]
            .sort(
                (a, b) =>
                    b.cantidad - a.cantidad
            )[0];

        nota.textContent =
            `✨ Completaste ${total} ` +
            `${total === 1 ? "actividad" : "actividades"} ` +
            `en los últimos 30 días. ` +
            `La categoría más frecuente fue ` +
            `${frecuente.nombre}. ` +
            `Cada actividad cuenta.`;
    }

    // ==========================================
    // MOSTRAR ERRORES DE LAS GRÁFICAS
    // ==========================================

    function estadoGraficas(mensaje) {

        [
            "grafica-semana",
            "graficas-actividades"
        ].forEach((id) => {

            const caja = $(id);

            caja.replaceChildren(
                crearNodo(
                    "p",
                    mensaje,
                    "contigo-grafica-vacio"
                )
            );
        });

        [
            "leyenda-semana",
            "nota-semana",
            "nota-actividades"
        ].forEach((id) => {
            $(id).textContent = "";
        });
    }

    // ==========================================
    // CARGAR RESUMEN DESDE MARIADB
    // ==========================================

    async function cargarResumen() {

        try {

            const datos = await api(
                "/api/perfil/resumen"
            );

            const perfil =
                datos.perfil || {};

            const resumen =
                datos.resumen || {};

            // DATOS PERSONALES

            if (perfil.nombre) {
                $("nombre-usuario").textContent =
                    perfil.nombre;
            }

            $("correo-usuario").textContent =
                perfil.correo || "";

            if (perfil.fecha_registro) {

                const fechaTexto =
                    String(perfil.fecha_registro)
                        .slice(0, 10);

                const fecha = new Date(
                    fechaTexto + "T00:00:00"
                );

                if (!Number.isNaN(fecha.getTime())) {

                    const dias = Math.max(
                        0,
                        Math.floor(
                            (Date.now() -
                                fecha.getTime()) /
                            86400000
                        )
                    );

                    $("dias-usuario").textContent =
                        `${dias} días en CONTIGO 💜`;
                }
            }

            // CONTADORES

            colocarNumero(
                "total-emociones",
                resumen.registros_emocionales
            );

            colocarNumero(
                "total-actividades",
                resumen.actividades_completadas
            );

            colocarNumero(
                "progreso-registros",
                resumen.registros_emocionales
            );

            colocarNumero(
                "progreso-actividades",
                resumen.actividades_completadas
            );

            colocarNumero(
                "progreso-dias",
                resumen.dias_con_registros
            );

            // GRÁFICAS

            if (datos.graficas) {

                dibujarSemana(
                    datos.graficas.semana
                );

                dibujarActividades(
                    datos.graficas.actividades
                );

            } else {

                estadoGraficas(
                    "Todavía no hay datos de gráficas disponibles."
                );
            }

        } catch (error) {

            $("correo-usuario").textContent =
                "No pudimos consultar tus datos.";

            estadoGraficas(
                "No se pudieron cargar las gráficas."
            );

            informar(
                "Error al cargar tu progreso: " +
                error.message,
                true
            );
        }
    }

    // ==========================================
    // CONSULTAR NOTIFICACIONES
    // ==========================================

    async function cargarNotificaciones(
        generar = false
    ) {
        const lista =
            $("lista-notificaciones");

        try {

            if (generar) {

                lista.textContent =
                    "Consultando tus notificaciones...";

                // La generación de recomendaciones
                // utiliza el backend existente.
                // No envía mensajes a contactos.

                try {
                    await escribirAPI(
                        "/api/notificaciones/generar",
                        "POST"
                    );

                } catch (error) {

                    console.warn(
                        "No se generaron recomendaciones:",
                        error.message
                    );
                }
            }

            const datos = await api(
                "/api/notificaciones"
            );

            notificaciones =
                Array.isArray(datos.notificaciones)
                    ? datos.notificaciones
                    : [];

            const pendientes = Math.max(
                0,
                Number(datos.total_pendientes) || 0
            );

            const contador =
                $("contador-notificaciones");

            contador.textContent =
                pendientes > 99
                    ? "99+"
                    : String(pendientes);

            contador.hidden =
                pendientes === 0;

            pintarNotificaciones(pendientes);

        } catch (error) {

            lista.textContent =
                "No pudimos cargar tus notificaciones: " +
                error.message;
        }
    }

    // ==========================================
    // DIBUJAR NOTIFICACIONES
    // ==========================================

    function pintarNotificaciones(pendientes) {

        const lista =
            $("lista-notificaciones");

        lista.replaceChildren();

        if (notificaciones.length === 0) {

            lista.appendChild(
                crearNodo(
                    "p",
                    "🌼 Todavía no tienes notificaciones guardadas."
                )
            );
        }

        notificaciones.forEach((item) => {

            const tarjeta = crearNodo(
                "article",
                "",
                "perfil-notificacion" +
                    (item.leida ? " leida" : "")
            );

            const titulo = crearNodo(
                "h3",
                String(
                    item.titulo || "Notificación"
                )
            );

            const mensaje = crearNodo(
                "p",
                String(item.mensaje || "")
            );

            tarjeta.append(titulo, mensaje);

            // FECHA

            if (item.fecha_creacion) {

                const fecha = new Date(
                    item.fecha_creacion
                );

                if (!Number.isNaN(fecha.getTime())) {

                    tarjeta.appendChild(
                        crearNodo(
                            "small",
                            fecha.toLocaleString("es-CO")
                        )
                    );
                }
            }

            // ACCIONES

            const acciones = crearNodo(
                "div",
                "",
                "perfil-notificacion-acciones"
            );

            if (item.leida) {

                acciones.appendChild(
                    crearNodo(
                        "span",
                        "✓ Leída"
                    )
                );

            } else {

                const boton = crearNodo(
                    "button",
                    "✓ Marcar como leída"
                );

                boton.type = "button";

                boton.addEventListener(
                    "click",
                    async () => {

                        if (operacionEnCurso) {
                            return;
                        }

                        operacionEnCurso = true;
                        boton.disabled = true;

                        try {

                            await escribirAPI(
                                "/api/notificaciones/" +
                                item.id_notificacion +
                                "/leer",
                                "PUT"
                            );

                            await cargarNotificaciones();

                        } catch (error) {

                            informar(
                                error.message,
                                true
                            );

                            boton.disabled = false;

                        } finally {
                            operacionEnCurso = false;
                        }
                    }
                );

                acciones.appendChild(boton);
            }

            // ENLACE VOLUNTARIO A RED DE APOYO

            if (item.enlace === "/red-apoyo") {

                const enlace = crearNodo(
                    "a",
                    "Contactar a alguien →"
                );

                enlace.href = "/red-apoyo";

                acciones.appendChild(enlace);
            }

            tarjeta.appendChild(acciones);
            lista.appendChild(tarjeta);
        });

        $("marcar-todas-leidas").disabled =
            pendientes === 0;
    }

    // ==========================================
    // MARCAR TODAS COMO LEÍDAS
    // ==========================================

    async function marcarTodas() {

        if (operacionEnCurso) {
            return;
        }

        operacionEnCurso = true;

        const boton =
            $("marcar-todas-leidas");

        boton.disabled = true;

        try {

            await escribirAPI(
                "/api/notificaciones/leer-todas",
                "PUT"
            );

            await cargarNotificaciones();

            informar(
                "Notificaciones marcadas como leídas."
            );

        } catch (error) {

            informar(
                error.message,
                true
            );

        } finally {
            operacionEnCurso = false;
        }
    }

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            // NAVEGACIÓN DE MI PERFIL

            document.querySelectorAll(
                "[data-vista]"
            ).forEach((boton) => {

                boton.addEventListener(
                    "click",
                    () => mostrarVista(
                        boton.dataset.vista
                    )
                );
            });

            // ABRIR Y CERRAR CAMPANITA

            $("boton-campana").addEventListener(
                "click",
                async () => {

                    const panel =
                        $("panel-notificaciones");

                    const abrir = panel.hidden;

                    panel.hidden = !abrir;

                    $("boton-campana").setAttribute(
                        "aria-expanded",
                        String(abrir)
                    );

                    if (abrir) {
                        await cargarNotificaciones(true);
                    }
                }
            );

            $("cerrar-notificaciones").addEventListener(
                "click",
                cerrarCampana
            );

            $("marcar-todas-leidas").addEventListener(
                "click",
                marcarTodas
            );

            // CERRAR CON ESCAPE

            document.addEventListener(
                "keydown",
                (evento) => {

                    if (evento.key === "Escape") {
                        cerrarCampana();
                    }
                }
            );

            // CERRAR AL HACER CLIC FUERA

            document.addEventListener(
                "pointerdown",
                (evento) => {

                    const panel =
                        $("panel-notificaciones");

                    const campana =
                        $("boton-campana");

                    if (
                        !panel.hidden &&
                        !panel.contains(evento.target) &&
                        !campana.contains(evento.target)
                    ) {
                        cerrarCampana();
                    }
                }
            );

            // CARGAR DATOS INICIALES

            mostrarVista("perfil");

            cargarResumen();

            cargarNotificaciones();
        }
    );

})();
