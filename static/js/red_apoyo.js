
"use strict";

// ============================================================
// CONTIGO - RED DE APOYO
// Contactos de confianza y recursos de ayuda
// Backend: Flask
// Base de datos: MariaDB
// ============================================================

// ============================================================
// ELEMENTOS DE LA PANTALLA
// ============================================================

const csrfToken = document.querySelector(
    'meta[name="csrf-token"]'
)?.content || "";

const listaContactos = document.getElementById(
    "lista-contactos"
);

const listaRecursos = document.getElementById(
    "lista-recursos"
);

const mensajeEstado = document.getElementById(
    "mensaje-estado"
);

const modal = document.getElementById(
    "modal-contacto"
);

const formulario = document.getElementById(
    "form-contacto"
);

const campoId = document.getElementById(
    "id-contacto"
);

const campoNombre = document.getElementById(
    "nombre-contacto"
);

const campoTelefono = document.getElementById(
    "telefono-contacto"
);

const campoRelacion = document.getElementById(
    "relacion-contacto"
);

const errorFormulario = document.getElementById(
    "error-formulario"
);

const tituloModal = document.getElementById(
    "titulo-modal"
);

const botonGuardar = document.getElementById(
    "btn-guardar-contacto"
);


// ============================================================
// 1. COMUNICACIÓN CON EL BACKEND FLASK
// ============================================================

async function solicitarAPI(ruta, opciones = {}) {

    const metodo = (
        opciones.method || "GET"
    ).toUpperCase();

    const headers = {
        ...(opciones.headers || {})
    };

    // Las operaciones que modifican datos
    // necesitan el token CSRF de CONTIGO.

    if (metodo !== "GET") {

        headers["X-CSRF-Token"] = csrfToken;
        headers["Content-Type"] = "application/json";

    }

    const respuesta = await fetch(ruta, {

        ...opciones,

        method: metodo,

        headers: headers,

        credentials: "same-origin"

    });

    const datos = await respuesta.json().catch(
        () => ({})
    );

    if (!respuesta.ok) {

        if (respuesta.status === 401) {

            throw new Error(
                "Tu sesión ha terminado. " +
                "Inicia sesión nuevamente en CONTIGO."
            );

        }

        if (respuesta.status === 403) {

            throw new Error(
                "No se pudo verificar la sesión. " +
                "Actualiza la página e intenta nuevamente."
            );

        }

        throw new Error(
            datos.mensaje ||
            `Error al conectar con Flask: ${respuesta.status}`
        );

    }

    return datos;

}


// ============================================================
// 2. MENSAJES DE CONFIRMACIÓN Y ERROR
// ============================================================

function mostrarMensaje(texto, esError = false) {

    mensajeEstado.textContent = texto;

    mensajeEstado.classList.toggle(
        "error",
        esError
    );

    mensajeEstado.hidden = false;

}


function mostrarErrorFormulario(texto) {

    errorFormulario.textContent = texto;

    errorFormulario.hidden = false;

}


// ============================================================
// 3. CREAR ELEMENTOS HTML DE FORMA SEGURA
// ============================================================

function crearTexto(etiqueta, contenido, clase = "") {

    const elemento = document.createElement(
        etiqueta
    );

    elemento.textContent = contenido ?? "";

    if (clase) {
        elemento.className = clase;
    }

    return elemento;

}


function crearBoton(texto, clase, accion) {

    const boton = document.createElement("button");

    boton.type = "button";

    boton.className = `boton ${clase}`;

    boton.textContent = texto;

    boton.addEventListener(
        "click",
        accion
    );

    return boton;

}


function crearEnlace(texto, clase, destino) {

    const enlace = document.createElement("a");

    enlace.className = `boton ${clase}`;

    enlace.textContent = texto;

    enlace.href = destino;

    return enlace;

}


function mostrarVacio(contenedor, icono, texto) {

    const caja = document.createElement("div");

    caja.className = "vacio";

    caja.appendChild(
        crearTexto(
            "span",
            icono,
            "vacio-icono"
        )
    );

    caja.appendChild(
        crearTexto(
            "p",
            texto
        )
    );

    contenedor.replaceChildren(caja);

}


// ============================================================
// 4. VALIDAR NÚMEROS TELEFÓNICOS DE CONTACTOS
// ============================================================

function obtenerNumeroLlamada(telefono) {

    if (
        !telefono ||
        typeof telefono !== "string"
    ) {
        return null;
    }

    const original = telefono.trim();

    const digitos = original.replace(
        /\D/g,
        ""
    );

    if (
        digitos.length < 7 ||
        digitos.length > 15
    ) {
        return null;
    }

    return original.startsWith("+")
        ? `+${digitos}`
        : digitos;

}


// ============================================================
// 5. NÚMEROS OFICIALES DE RECURSOS DE AYUDA
// ============================================================

function obtenerNumeroRecurso(telefono) {

    if (
        !telefono ||
        typeof telefono !== "string"
    ) {
        return null;
    }

    const numero = telefono.trim();

    // Líneas de ayuda cortas que incluimos
    // en CONTIGO para Colombia:
    //
    // 106: apoyo emocional en Bogotá
    // 141: protección de menores, ICBF
    // 155: orientación ante violencia de género
    //
    // La línea 123 aparece en la sección
    // independiente de ayuda inmediata.

    if (
        ["106", "141", "155"].includes(numero)
    ) {
        return numero;
    }

    // Para otros números de recursos se
    // utiliza la validación telefónica normal.

    return obtenerNumeroLlamada(numero);

}


// ============================================================
// 6. VALIDAR NÚMEROS DE WHATSAPP
// ============================================================

function obtenerNumeroWhatsApp(telefono) {

    if (
        !telefono ||
        typeof telefono !== "string"
    ) {
        return null;
    }

    const original = telefono.trim();

    // WhatsApp requiere un número
    // con indicativo internacional.

    if (!original.startsWith("+")) {
        return null;
    }

    const digitos = original.replace(
        /\D/g,
        ""
    );

    if (
        digitos.length < 8 ||
        digitos.length > 15
    ) {
        return null;
    }

    return digitos;

}


// ============================================================
// 7. GET - CONSULTAR CONTACTOS DE CONFIANZA
// ============================================================

async function cargarContactos() {

    try {

        const datos = await solicitarAPI(
            "/api/red-apoyo/contactos"
        );

        const contactos = Array.isArray(
            datos.contactos
        )
            ? datos.contactos
            : [];

        mostrarContactos(contactos);

    } catch (error) {

        mostrarVacio(
            listaContactos,
            "⚠️",
            error.message
        );

    }

}


// ============================================================
// 8. MOSTRAR LOS CONTACTOS EN TARJETAS
// ============================================================

function mostrarContactos(contactos) {

    listaContactos.replaceChildren();

    if (contactos.length === 0) {

        mostrarVacio(
            listaContactos,
            "🫂",
            "Todavía no tienes contactos. " +
            "Agrega a una persona de confianza."
        );

        return;

    }

    contactos.forEach((contacto) => {

        const tarjeta = document.createElement(
            "article"
        );

        tarjeta.className = "tarjeta-contacto";

        // ------------------------------------
        // Información del contacto
        // ------------------------------------

        const cabecera = document.createElement(
            "div"
        );

        cabecera.className = "contacto-cabecera";

        const avatar = crearTexto(
            "div",
            "💜",
            "avatar-contacto"
        );

        const datos = document.createElement(
            "div"
        );

        datos.className = "contacto-datos";

        datos.appendChild(
            crearTexto(
                "h3",
                contacto.nombre
            )
        );

        datos.appendChild(
            crearTexto(
                "p",
                contacto.relacion ||
                "Contacto de confianza"
            )
        );

        if (contacto.telefono) {

            datos.appendChild(
                crearTexto(
                    "p",
                    `📞 ${contacto.telefono}`
                )
            );

        }

        cabecera.append(
            avatar,
            datos
        );

        tarjeta.appendChild(cabecera);

        // ------------------------------------
        // Botones del contacto
        // ------------------------------------

        const acciones = document.createElement(
            "div"
        );

        acciones.className = "acciones-contacto";

        // Llamada telefónica

        const numeroLlamada = obtenerNumeroLlamada(
            contacto.telefono
        );

        if (numeroLlamada) {

            acciones.appendChild(
                crearEnlace(
                    "📞 Llamar",
                    "boton-blanco",
                    `tel:${numeroLlamada}`
                )
            );

        }

        // Abrir WhatsApp

        const numeroWhatsapp = obtenerNumeroWhatsApp(
            contacto.telefono
        );

        if (numeroWhatsapp) {

            const enlaceWhatsapp = crearEnlace(
                "💬 WhatsApp",
                "boton-verde",
                `https://wa.me/${numeroWhatsapp}`
            );

            enlaceWhatsapp.target = "_blank";

            enlaceWhatsapp.rel =
                "noopener noreferrer";

            acciones.appendChild(
                enlaceWhatsapp
            );

        }

        // Editar contacto

        acciones.appendChild(
            crearBoton(
                "✏️ Editar",
                "boton-secundario",
                () => abrirEditarContacto(contacto)
            )
        );

        // Eliminar contacto

        acciones.appendChild(
            crearBoton(
                "🗑️ Eliminar",
                "boton-peligro",
                () => eliminarContacto(contacto)
            )
        );

        tarjeta.appendChild(acciones);

        listaContactos.appendChild(tarjeta);

    });

}


// ============================================================
// 9. ABRIR FORMULARIO PARA AGREGAR CONTACTO
// ============================================================

function abrirNuevoContacto() {

    formulario.reset();

    campoId.value = "";

    tituloModal.textContent =
        "Agregar contacto";

    botonGuardar.textContent =
        "Guardar contacto";

    errorFormulario.hidden = true;

    modal.showModal();

    campoNombre.focus();

}


// ============================================================
// 10. ABRIR FORMULARIO PARA EDITAR CONTACTO
// ============================================================

function abrirEditarContacto(contacto) {

    formulario.reset();

    campoId.value = contacto.id_contacto;

    campoNombre.value =
        contacto.nombre || "";

    campoTelefono.value =
        contacto.telefono || "";

    campoRelacion.value =
        contacto.relacion || "";

    tituloModal.textContent =
        "Editar contacto";

    botonGuardar.textContent =
        "Guardar cambios";

    errorFormulario.hidden = true;

    modal.showModal();

    campoNombre.focus();

}


// ============================================================
// 11. POST / PUT - GUARDAR CONTACTO
// ============================================================

async function guardarContacto(evento) {

    evento.preventDefault();

    errorFormulario.hidden = true;

    const idContacto = campoId.value;

    const datos = {

        nombre: campoNombre.value.trim(),

        telefono: campoTelefono.value.trim(),

        relacion: campoRelacion.value.trim()

    };

    if (!datos.nombre) {

        mostrarErrorFormulario(
            "Escribe el nombre del contacto."
        );

        return;

    }

    const editando = Boolean(idContacto);

    const ruta = editando
        ? `/api/red-apoyo/contactos/${idContacto}`
        : "/api/red-apoyo/contactos";

    const metodo = editando
        ? "PUT"
        : "POST";

    botonGuardar.disabled = true;

    botonGuardar.textContent =
        "Guardando...";

    try {

        const respuesta = await solicitarAPI(
            ruta,
            {
                method: metodo,
                body: JSON.stringify(datos)
            }
        );

        modal.close();

        await cargarContactos();

        mostrarMensaje(
            respuesta.mensaje
        );

    } catch (error) {

        mostrarErrorFormulario(
            error.message
        );

    } finally {

        botonGuardar.disabled = false;

        botonGuardar.textContent = editando
            ? "Guardar cambios"
            : "Guardar contacto";

    }

}


// ============================================================
// 12. DELETE - ELIMINAR CONTACTO
// ============================================================

async function eliminarContacto(contacto) {

    const confirmado = window.confirm(
        `¿Deseas eliminar a ${contacto.nombre} ` +
        "de tu red de apoyo?"
    );

    if (!confirmado) {
        return;
    }

    try {

        const respuesta = await solicitarAPI(
            `/api/red-apoyo/contactos/${contacto.id_contacto}`,
            {
                method: "DELETE"
            }
        );

        await cargarContactos();

        mostrarMensaje(
            respuesta.mensaje
        );

    } catch (error) {

        mostrarMensaje(
            error.message,
            true
        );

    }

}


// ============================================================
// 13. GET - CONSULTAR RECURSOS DE AYUDA
// ============================================================

async function cargarRecursos() {

    try {

        const datos = await solicitarAPI(
            "/api/red-apoyo/recursos"
        );

        const recursos = Array.isArray(
            datos.recursos
        )
            ? datos.recursos
            : [];

        mostrarRecursos(recursos);

    } catch (error) {

        mostrarVacio(
            listaRecursos,
            "⚠️",
            error.message
        );

    }

}


// ============================================================
// 14. MOSTRAR RECURSOS DE AYUDA
// ============================================================

function mostrarRecursos(recursos) {

    listaRecursos.replaceChildren();

    if (recursos.length === 0) {

        mostrarVacio(
            listaRecursos,
            "🌷",
            "Aún no hay recursos registrados. " +
            "Pronto encontrarás opciones de apoyo aquí."
        );

        return;

    }

    recursos.forEach((recurso) => {

        const tarjeta = document.createElement(
            "article"
        );

        tarjeta.className = "tarjeta-recurso";

        // ------------------------------------
        // Nombre y descripción
        // ------------------------------------

        tarjeta.appendChild(
            crearTexto(
                "h3",
                recurso.nombre
            )
        );

        if (recurso.tipo) {

            tarjeta.appendChild(
                crearTexto(
                    "p",
                    `Tipo: ${recurso.tipo}`
                )
            );

        }

        if (recurso.descripcion) {

            tarjeta.appendChild(
                crearTexto(
                    "p",
                    recurso.descripcion
                )
            );

        }

        // ------------------------------------
        // Botones del recurso
        // ------------------------------------

        const acciones = document.createElement(
            "div"
        );

        acciones.className = "acciones-recurso";

        // Habilita 106, 141 y 155.

        const telefono = obtenerNumeroRecurso(
            recurso.telefono
        );

        if (telefono) {

            acciones.appendChild(
                crearEnlace(
                    "📞 Llamar",
                    "boton-blanco",
                    `tel:${telefono}`
                )
            );

        }

        // Enlace a la página del recurso

        if (recurso.url) {

            try {

                const direccion = new URL(
                    recurso.url
                );

                if (
                    direccion.protocol === "https:"
                ) {

                    const enlace = crearEnlace(
                        "🌐 Sitio web",
                        "boton-secundario",
                        direccion.href
                    );

                    enlace.target = "_blank";

                    enlace.rel =
                        "noopener noreferrer";

                    acciones.appendChild(
                        enlace
                    );

                }

            } catch (error) {

                // Si la URL no es válida,
                // no mostramos ese botón.

            }

        }

        tarjeta.appendChild(acciones);

        listaRecursos.appendChild(tarjeta);

    });

}


// ============================================================
// 15. EVENTOS DE LOS BOTONES
// ============================================================

// Abrir formulario nuevo

document.getElementById(
    "btn-nuevo-contacto"
).addEventListener(
    "click",
    abrirNuevoContacto
);

// Cerrar formulario

document.getElementById(
    "btn-cerrar-modal"
).addEventListener(
    "click",
    () => modal.close()
);

// Cancelar formulario

document.getElementById(
    "btn-cancelar"
).addEventListener(
    "click",
    () => modal.close()
);

// Guardar o editar contacto

formulario.addEventListener(
    "submit",
    guardarContacto
);

// Limpiar formulario al cerrarlo

modal.addEventListener(
    "close",
    () => {

        formulario.reset();

        errorFormulario.hidden = true;

    }
);


// ============================================================
// 16. INICIAR RED DE APOYO
// ============================================================

async function iniciarRedDeApoyo() {

    await Promise.all([
        cargarContactos(),
        cargarRecursos()
    ]);

}

iniciarRedDeApoyo();
