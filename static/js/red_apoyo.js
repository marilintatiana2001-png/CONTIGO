
/* ==================================================
   CONTIGO - RED DE APOYO
   Compatible con diseño aprobado v3

   - Consultar contactos
   - Agregar contactos
   - Editar contactos
   - Eliminar contactos
   - Llamar a contactos
   - Consultar recursos de ayuda
   - Abrir teléfono y sitios web

   Flask + MariaDB
================================================== */

(() => {
    "use strict";

    const $ = (id) => document.getElementById(id);

    let contactos = [];
    let idEditando = null;
    let idEliminando = null;
    let tokenCSRF = null;
    let ocupado = false;

    /* ======================================
       CREAR ELEMENTOS DE FORMA SEGURA
    ====================================== */

    function elemento(
        etiqueta,
        clase = "",
        texto = ""
    ) {
        const nodo = document.createElement(etiqueta);

        if (clase) {
            nodo.className = clase;
        }

        nodo.textContent = texto;
        return nodo;
    }

    function boton(
        texto,
        accion,
        id,
        clase
    ) {
        const nuevo = elemento(
            "button",
            `red-accion ${clase}`,
            texto
        );

        nuevo.type = "button";
        nuevo.dataset.accion = accion;
        nuevo.dataset.id = String(id);

        return nuevo;
    }

    function enlace(
        texto,
        url,
        clase
    ) {
        const nuevo = elemento(
            "a",
            `red-accion ${clase}`,
            texto
        );

        nuevo.href = url;
        return nuevo;
    }

    /* ======================================
       API DE FLASK
    ====================================== */

    async function api(
        ruta,
        opciones = {}
    ) {
        const respuesta = await fetch(ruta, {
            credentials: "same-origin",
            ...opciones,
            headers: {
                Accept: "application/json",
                ...(opciones.headers || {})
            }
        });

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
                `Error del servidor (${respuesta.status}).`
            );
        }

        return datos;
    }

    async function obtenerCSRF() {
        if (tokenCSRF) {
            return tokenCSRF;
        }

        const datos = await api("/api/csrf");
        tokenCSRF = datos.csrf_token;

        if (!tokenCSRF) {
            throw new Error(
                "No se pudo verificar la sesión."
            );
        }

        return tokenCSRF;
    }

    async function escribir(
        ruta,
        metodo,
        cuerpo
    ) {
        const csrf = await obtenerCSRF();

        const opciones = {
            method: metodo,
            headers: {
                "X-CSRF-Token": csrf
            }
        };

        if (cuerpo !== undefined) {
            opciones.headers["Content-Type"] =
                "application/json";

            opciones.body =
                JSON.stringify(cuerpo);
        }

        return api(ruta, opciones);
    }

    /* ======================================
       MENSAJES
    ====================================== */

    function informar(
        texto,
        error = false
    ) {
        const aviso = $("red-mensaje");

        aviso.textContent = texto;
        aviso.className =
            `red-mensaje ${error ? "error" : "exito"}`;

        aviso.hidden = false;
    }

    function ocultarAviso() {
        $("red-mensaje").hidden = true;
    }

    /* ======================================
       TELÉFONOS Y URL
    ====================================== */

    function telefonoSeguro(valor) {
        const limpio = String(valor || "")
            .trim()
            .replace(/[\s().-]/g, "");

        const digitos = limpio.replace(/\D/g, "");

        if (
            !/^\+?\d+$/.test(limpio) ||
            digitos.length < 7 ||
            digitos.length > 15
        ) {
            return null;
        }

        return `tel:${limpio}`;
    }

    function urlSegura(valor) {
        try {
            const direccion = new URL(
                String(valor || "")
            );

            if (
                direccion.protocol !== "https:" &&
                direccion.protocol !== "http:"
            ) {
                return null;
            }

            return direccion.href;
        } catch {
            return null;
        }
    }

    /* ======================================
       MOSTRAR CONTACTOS
    ====================================== */

    function mostrarContactos() {
        const lista = $("lista-contactos");

        lista.replaceChildren();
        lista.setAttribute("aria-busy", "false");

        if (contactos.length === 0) {
            const vacio = elemento(
                "p",
                "red-vacio",
                "💜 Aún no tienes contactos. Agrega a una persona de confianza."
            );

            lista.appendChild(vacio);
            return;
        }

        for (const contacto of contactos) {
            const tarjeta = elemento(
                "article",
                "red-contacto"
            );

            const cabecera = elemento(
                "div",
                "red-contacto-cabecera"
            );

            const avatar = elemento(
                "span",
                "red-avatar",
                "💜"
            );

            const informacion = elemento(
                "div",
                "red-contacto-info"
            );

            informacion.append(
                elemento(
                    "h3",
                    "",
                    contacto.nombre || "Contacto"
                ),
                elemento(
                    "span",
                    "red-etiqueta",
                    contacto.relacion ||
                        "Persona de confianza"
                )
            );

            cabecera.append(avatar, informacion);
            tarjeta.appendChild(cabecera);

            if (contacto.telefono) {
                tarjeta.appendChild(
                    elemento(
                        "p",
                        "red-contacto-telefono",
                        "📞 " + contacto.telefono
                    )
                );
            }

            const acciones = elemento(
                "div",
                "red-contacto-acciones"
            );

            const numero = telefonoSeguro(
                contacto.telefono
            );

            if (numero) {
                acciones.appendChild(
                    enlace(
                        "📞 Llamar",
                        numero,
                        "red-accion-primaria"
                    )
                );
            }

            acciones.append(
                boton(
                    "✏️ Editar",
                    "editar",
                    contacto.id_contacto,
                    "red-accion-editar"
                ),
                boton(
                    "🗑️ Eliminar",
                    "eliminar",
                    contacto.id_contacto,
                    "red-accion-eliminar"
                )
            );

            tarjeta.appendChild(acciones);
            lista.appendChild(tarjeta);
        }
    }

    async function cargarContactos() {
        const lista = $("lista-contactos");
        lista.setAttribute("aria-busy", "true");

        try {
            const datos = await api(
                "/api/red-apoyo/contactos"
            );

            contactos = Array.isArray(datos.contactos)
                ? datos.contactos
                : [];

            mostrarContactos();
        } catch (error) {
            lista.setAttribute("aria-busy", "false");

            lista.replaceChildren(
                elemento(
                    "p",
                    "red-vacio",
                    "No pudimos cargar tus contactos."
                )
            );

            informar(error.message, true);
        }
    }

    /* ======================================
       MOSTRAR RECURSOS DE AYUDA
    ====================================== */

    function iconoRecurso(recurso) {
        const tipo = String(
            recurso.tipo || ""
        ).toLowerCase();

        const nombre = String(
            recurso.nombre || ""
        ).toLowerCase();

        if (
            tipo.includes("emergencia") ||
            nombre.includes("línea") ||
            nombre.includes("linea")
        ) {
            return "📞";
        }

        if (
            tipo.includes("salud") ||
            tipo.includes("bienestar")
        ) {
            return "💜";
        }

        return "🌷";
    }

    async function cargarRecursos() {
        const lista = $("lista-recursos");
        lista.setAttribute("aria-busy", "true");

        try {
            const datos = await api(
                "/api/red-apoyo/recursos"
            );

            const recursos = Array.isArray(datos.recursos)
                ? datos.recursos
                : [];

            lista.replaceChildren();

            if (recursos.length === 0) {
                lista.appendChild(
                    elemento(
                        "p",
                        "red-vacio",
                        "Todavía no hay recursos de ayuda disponibles."
                    )
                );
            }

            for (const recurso of recursos) {
                const tarjeta = elemento(
                    "article",
                    "red-recurso"
                );

                // Encabezado con icono reutilizando
                // el estilo de las tarjetas.

                const cabecera = elemento(
                    "div",
                    "red-contacto-cabecera"
                );

                const icono = elemento(
                    "span",
                    "red-avatar",
                    iconoRecurso(recurso)
                );

                const contenido = elemento(
                    "div",
                    "red-contacto-info"
                );

                const titulo = elemento(
                    "h3",
                    "",
                    recurso.nombre || "Recurso de ayuda"
                );

                const categoria = elemento(
                    "span",
                    "red-recurso-tipo",
                    recurso.tipo || "Orientación"
                );

                const descripcion = elemento(
                    "p",
                    "red-recurso-descripcion",
                    recurso.descripcion || ""
                );

                contenido.append(
                    titulo,
                    categoria,
                    descripcion
                );

                cabecera.append(icono, contenido);
                tarjeta.appendChild(cabecera);

                const acciones = elemento(
                    "div",
                    "red-recurso-acciones"
                );

                const numero = telefonoSeguro(
                    recurso.telefono
                );

                if (numero) {
                    acciones.appendChild(
                        enlace(
                            "📞 Llamar",
                            numero,
                            "red-accion-primaria"
                        )
                    );
                }

                const web = urlSegura(
                    recurso.url
                );

                if (web) {
                    const sitio = enlace(
                        "🌐 Sitio web",
                        web,
                        "red-accion-editar"
                    );

                    sitio.target = "_blank";
                    sitio.rel = "noopener noreferrer";

                    acciones.appendChild(sitio);
                }

                if (acciones.children.length) {
                    tarjeta.appendChild(acciones);
                }

                lista.appendChild(tarjeta);
            }

            lista.setAttribute("aria-busy", "false");
        } catch (error) {
            lista.setAttribute("aria-busy", "false");

            lista.replaceChildren(
                elemento(
                    "p",
                    "red-vacio",
                    "No pudimos cargar los recursos de ayuda."
                )
            );

            informar(error.message, true);
        }
    }

    /* ======================================
       FORMULARIO DE CONTACTOS
    ====================================== */

    function abrirFormulario(contacto = null) {
        if (ocupado) return;

        idEditando = contacto
            ? Number(contacto.id_contacto)
            : null;

        $("formulario-contacto").reset();

        $("contacto-nombre").value =
            contacto?.nombre || "";

        $("contacto-relacion").value =
            contacto?.relacion || "";

        $("contacto-telefono").value =
            contacto?.telefono || "";

        $("titulo-formulario-contacto").textContent =
            contacto
                ? "✏️ Editar contacto"
                : "💜 Agregar contacto";

        $("btn-guardar-contacto").textContent =
            contacto
                ? "Guardar cambios"
                : "💜 Guardar contacto";

        $("caja-eliminar-contacto").hidden = true;
        $("caja-formulario-contacto").hidden = false;

        ocultarAviso();

        $("caja-formulario-contacto").scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        $("contacto-nombre").focus({
            preventScroll: true
        });
    }

    function cerrarFormulario() {
        $("caja-formulario-contacto").hidden = true;
        $("formulario-contacto").reset();
        idEditando = null;
    }

    async function guardarContacto(evento) {
        evento.preventDefault();

        if (ocupado) return;

        const datos = {
            nombre: $("contacto-nombre").value.trim(),
            relacion: $("contacto-relacion").value.trim(),
            telefono: $("contacto-telefono").value.trim()
        };

        if (
            !datos.nombre ||
            datos.nombre.length > 100
        ) {
            informar(
                "Escribe un nombre de máximo 100 caracteres.",
                true
            );
            return;
        }

        if (datos.relacion.length > 50) {
            informar(
                "La relación no debe superar 50 caracteres.",
                true
            );
            return;
        }

        if (
            datos.telefono &&
            !telefonoSeguro(datos.telefono)
        ) {
            informar(
                "Ingresa un teléfono válido.",
                true
            );
            return;
        }

        ocupado = true;

        const guardar = $("btn-guardar-contacto");
        guardar.disabled = true;
        guardar.textContent = "Guardando...";

        try {
            const editando = idEditando !== null;

            const ruta = editando
                ? "/api/red-apoyo/contactos/" + idEditando
                : "/api/red-apoyo/contactos";

            const resultado = await escribir(
                ruta,
                editando ? "PUT" : "POST",
                datos
            );

            cerrarFormulario();
            await cargarContactos();

            informar(
                "✅ " +
                (resultado.mensaje ||
                    "Contacto guardado correctamente.")
            );

        } catch (error) {
            informar(error.message, true);

        } finally {
            ocupado = false;
            guardar.disabled = false;

            guardar.textContent =
                idEditando !== null
                    ? "Guardar cambios"
                    : "💜 Guardar contacto";
        }
    }

    /* ======================================
       ELIMINAR CONTACTOS
    ====================================== */

    function solicitarEliminar(contacto) {
        if (ocupado) return;

        idEliminando = Number(
            contacto.id_contacto
        );

        cerrarFormulario();

        $("texto-eliminar-contacto").textContent =
            "¿Quieres eliminar a " +
            contacto.nombre +
            " de tu Red de Apoyo?";

        $("caja-eliminar-contacto").hidden = false;
        ocultarAviso();

        $("caja-eliminar-contacto").scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    function cancelarEliminar() {
        idEliminando = null;
        $("caja-eliminar-contacto").hidden = true;
    }

    async function eliminarContacto() {
        if (ocupado || idEliminando === null) {
            return;
        }

        ocupado = true;

        const boton = $("btn-confirmar-eliminar");
        boton.disabled = true;
        boton.textContent = "Eliminando...";

        try {
            const resultado = await escribir(
                "/api/red-apoyo/contactos/" + idEliminando,
                "DELETE"
            );

            cancelarEliminar();
            await cargarContactos();

            informar(
                "✅ " +
                (resultado.mensaje ||
                    "Contacto eliminado correctamente.")
            );

        } catch (error) {
            informar(error.message, true);

        } finally {
            ocupado = false;
            boton.disabled = false;
            boton.textContent = "Eliminar contacto";
        }
    }

    /* ======================================
       ACTIVAR LOS BOTONES
    ====================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            $("btn-agregar-contacto").addEventListener(
                "click",
                () => abrirFormulario()
            );

            $("btn-cerrar-formulario").addEventListener(
                "click",
                cerrarFormulario
            );

            $("btn-cancelar-contacto").addEventListener(
                "click",
                cerrarFormulario
            );

            $("formulario-contacto").addEventListener(
                "submit",
                guardarContacto
            );

            $("btn-confirmar-eliminar").addEventListener(
                "click",
                eliminarContacto
            );

            $("btn-cancelar-eliminar").addEventListener(
                "click",
                cancelarEliminar
            );

            $("lista-contactos").addEventListener(
                "click",
                (evento) => {

                    const seleccionado =
                        evento.target.closest(
                            "[data-accion][data-id]"
                        );

                    if (!seleccionado || ocupado) {
                        return;
                    }

                    const id = Number(
                        seleccionado.dataset.id
                    );

                    const contacto = contactos.find(
                        (item) =>
                            Number(item.id_contacto) === id
                    );

                    if (!contacto) return;

                    if (
                        seleccionado.dataset.accion ===
                        "editar"
                    ) {
                        abrirFormulario(contacto);
                    }

                    if (
                        seleccionado.dataset.accion ===
                        "eliminar"
                    ) {
                        solicitarEliminar(contacto);
                    }
                }
            );

            cargarContactos();
            cargarRecursos();
        }
    );

})();
