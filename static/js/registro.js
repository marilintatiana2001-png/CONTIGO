
/* ==========================================
   CONTIGO - REGISTRO DE USUARIOS
   INTEGRACIÓN CON PREFERENCIAS DE IAN
========================================== */

const formularioRegistro = document.getElementById(
    "form-registro"
);

const mensajeRegistro = document.getElementById(
    "mensaje-registro"
);

formularioRegistro.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();

        // ======================================
        // DATOS PERSONALES DEL REGISTRO
        // ======================================

        const nombre = document.getElementById(
            "nombre"
        ).value.trim();

        const correo = document.getElementById(
            "correo"
        ).value.trim();

        const fechaNacimiento = document.getElementById(
            "fecha_nacimiento"
        ).value;

        const contrasena = document.getElementById(
            "contrasena"
        ).value;

        const confirmar = document.getElementById(
            "confirmar_contrasena"
        ).value;

        // ======================================
        // PREFERENCIAS PARA IAN
        // ======================================

        const paisResidencia = document.getElementById(
            "pais_residencia"
        ).value.trim();

        const generoIan = document.getElementById(
            "genero_ian"
        ).value;

        const tratamientoIan = document.getElementById(
            "tratamiento_ian"
        ).value;

        const personalizacionIan = document.getElementById(
            "personalizacion_ian"
        ).checked;

        // ======================================
        // BOTÓN DE REGISTRO
        // ======================================

        const botonRegistro = formularioRegistro.querySelector(
            'button[type="submit"]'
        );

        // ======================================
        // VALIDAR CONTRASEÑAS
        // ======================================

        if (contrasena !== confirmar) {

            mensajeRegistro.textContent =
                "Las contraseñas no coinciden. Inténtalo nuevamente.";

            mensajeRegistro.style.color = "#B34260";

            return;
        }

        // ======================================
        // PREPARAR LOS DATOS PARA FLASK
        // ======================================

        const datosUsuario = {

            // Datos de la cuenta
            nombre: nombre,
            correo: correo,
            fecha_nacimiento: fechaNacimiento,
            contrasena: contrasena,
            confirmar_contrasena: confirmar,

            // Preferencias de IAN
            pais_residencia: paisResidencia,
            genero_ian: generoIan,
            tratamiento_ian: tratamientoIan,
            personalizacion_ian: personalizacionIan

        };

        // ======================================
        // MOSTRAR ESTADO DEL REGISTRO
        // ======================================

        mensajeRegistro.textContent =
            "Estamos creando tu cuenta...";

        mensajeRegistro.style.color = "#51406F";

        botonRegistro.disabled = true;

        // ======================================
        // ENVIAR DATOS A FLASK
        // ======================================

        try {

            const respuesta = await fetch(
                "/api/registro",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "same-origin",

                    body: JSON.stringify(datosUsuario)
                }
            );

            const resultado = await respuesta.json();

            mensajeRegistro.textContent =
                resultado.mensaje ||
                "No pudimos completar el registro.";

            // ==================================
            // REGISTRO EXITOSO
            // ==================================

            if (respuesta.ok) {

                mensajeRegistro.style.color = "#397D68";

                formularioRegistro.reset();

            } else {

                mensajeRegistro.style.color = "#B34260";

            }

        } catch (error) {

            console.error(
                "Error al registrar usuario:",
                error
            );

            mensajeRegistro.textContent =
                "No pudimos conectar con el servidor. Inténtalo nuevamente.";

            mensajeRegistro.style.color = "#B34260";

        } finally {

            botonRegistro.disabled = false;

        }

    }
);
