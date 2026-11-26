document.addEventListener("DOMContentLoaded", () => {
    const formRegistro = document.getElementById("form-registro");
    const mensajeRegistro = document.getElementById("mensaje-registro");
    const btnRegistrar = document.getElementById("btn-registrar");
    const tituloPaso = document.getElementById("titulo-paso-registro");

    const seccionTutor = document.getElementById("seccion-autorizacion-tutor");
    const formTutor = document.getElementById("form-autorizacion-tutor");
    const inputToken = document.getElementById("token_autorizacion");
    const mensajeAutorizacion = document.getElementById("mensaje-autorizacion");
    const btnFirmar = document.getElementById("btn-firmar-autorizacion");

    function mostrarMensaje(elemento, texto, tipo) {
        if (!elemento) return;
        elemento.textContent = texto;
        elemento.classList.remove("error", "exito");
        if (tipo) {
            elemento.classList.add(tipo);
        }
    }

    // ======================================================
    // PASO 1: ENVIAR DATOS DEL USUARIO A /api/registro
    // ======================================================

    if (formRegistro) {
        formRegistro.addEventListener("submit", async (evento) => {
            evento.preventDefault();
            mostrarMensaje(mensajeRegistro, "", "");

            const nombre = document.getElementById("nombre").value.trim();
            const correo = document.getElementById("correo").value.trim();
            const fechaNacimiento = document.getElementById("fecha_nacimiento").value;
            const paisResidencia = document.getElementById("pais_residencia").value.trim();
            const generoIan = document.getElementById("genero_ian").value;
            const tratamientoIan = document.getElementById("tratamiento_ian").value;
            const personalizacionIan = document.getElementById("personalizacion_ian").checked;
            const contrasena = document.getElementById("contrasena").value;
            const confirmarContrasena = document.getElementById("confirmar_contrasena").value;

            if (contrasena !== confirmarContrasena) {
                mostrarMensaje(
                    mensajeRegistro,
                    "Las contraseñas no coinciden.",
                    "error"
                );
                return;
            }

            btnRegistrar.disabled = true;
            btnRegistrar.textContent = "Procesando...";

            try {
                const respuesta = await fetch("/api/registro", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        correo: correo,
                        fecha_nacimiento: fechaNacimiento,
                        pais_residencia: paisResidencia,
                        genero_ian: generoIan,
                        tratamiento_ian: tratamientoIan,
                        personalizacion_ian: personalizacionIan,
                        contrasena: contrasena,
                        confirmar_contrasena: confirmarContrasena
                    })
                });

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    mostrarMensaje(
                        mensajeRegistro,
                        datos.mensaje || "No se pudo completar el registro.",
                        "error"
                    );
                    btnRegistrar.disabled = false;
                    btnRegistrar.textContent = "Crear cuenta";
                    return;
                }

                // Si es menor de edad, mostrar el formulario presencial del tutor
                if (datos.requiere_autorizacion && datos.token_autorizacion) {
                    formRegistro.hidden = true;
                    if (tituloPaso) {
                        tituloPaso.textContent = "Paso 2: Autorización del adulto";
                    }

                    inputToken.value = datos.token_autorizacion;
                    seccionTutor.hidden = false;
                    seccionTutor.scrollIntoView({ behavior: "smooth" });
                    return;
                }

                // Si es mayor de edad, cuenta activa de inmediato
                mostrarMensaje(
                    mensajeRegistro,
                    datos.mensaje || "¡Tu cuenta fue creada correctamente!",
                    "exito"
                );

                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);

            } catch (error) {
                mostrarMensaje(
                    mensajeRegistro,
                    "Error de conexión con el servidor. Inténtalo nuevamente.",
                    "error"
                );
                btnRegistrar.disabled = false;
                btnRegistrar.textContent = "Crear cuenta";
            }
        });
    }

    // ======================================================
    // PASO 2: FIRMA PRESENCIAL DEL TUTOR EN EL DISPOSITIVO
    // ======================================================

    if (formTutor) {
        formTutor.addEventListener("submit", async (evento) => {
            evento.preventDefault();
            mostrarMensaje(mensajeAutorizacion, "", "");

            const token = inputToken.value.trim();
            const nombreRepresentante = document
                .getElementById("nombre_representante")
                .value.trim();
            const parentesco = document
                .getElementById("parentesco")
                .value.trim();
            const firmaElectronica = document
                .getElementById("firma_electronica")
                .value.trim();
            const declaracion = document
                .getElementById("declaracion_representacion")
                .checked;
            const aceptacion = document
                .getElementById("aceptacion_explicita")
                .checked;

            if (
                nombreRepresentante.toLocaleLowerCase() !==
                firmaElectronica.toLocaleLowerCase()
            ) {
                mostrarMensaje(
                    mensajeAutorizacion,
                    "La firma electrónica debe coincidir exactamente con el nombre completo del representante.",
                    "error"
                );
                return;
            }

            if (!declaracion || !aceptacion) {
                mostrarMensaje(
                    mensajeAutorizacion,
                    "Debes marcar ambas casillas de declaración y autorización.",
                    "error"
                );
                return;
            }

            btnFirmar.disabled = true;
            btnFirmar.textContent = "Guardando autorización...";

            try {
                const respuesta = await fetch(
                    "/api/autorizacion-representante/aceptar",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            token: token,
                            nombre_representante: nombreRepresentante,
                            parentesco: parentesco,
                            firma_electronica: firmaElectronica,
                            declaracion_representacion: declaracion,
                            aceptacion_explicita: aceptacion
                        })
                    }
                );

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    mostrarMensaje(
                        mensajeAutorizacion,
                        datos.mensaje || "No se pudo guardar la autorización.",
                        "error"
                    );
                    btnFirmar.disabled = false;
                    btnFirmar.textContent = "Firmar y activar cuenta";
                    return;
                }

                mostrarMensaje(
                    mensajeAutorizacion,
                    datos.mensaje || "¡Cuenta activada! Redirigiendo al inicio de sesión...",
                    "exito"
                );

                setTimeout(() => {
                    window.location.href = "/";
                }, 1800);

            } catch (error) {
                mostrarMensaje(
                    mensajeAutorizacion,
                    "Error de conexión al enviar la autorización.",
                    "error"
                );
                btnFirmar.disabled = false;
                btnFirmar.textContent = "Firmar y activar cuenta";
            }
        });
    }
});