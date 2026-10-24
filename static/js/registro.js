
const formularioRegistro = document.getElementById("form-registro");
const mensajeRegistro = document.getElementById("mensaje-registro");

formularioRegistro.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const fechaNacimiento = document.getElementById("fecha_nacimiento").value;
    const contrasena = document.getElementById("contrasena").value;
    const confirmar = document.getElementById("confirmar_contrasena").value;

    const botonRegistro = formularioRegistro.querySelector(
        'button[type="submit"]'
    );

    // Comprobar que las contraseñas coincidan
    if (contrasena !== confirmar) {
        mensajeRegistro.textContent =
            "Las contraseñas no coinciden. Inténtalo nuevamente.";
        mensajeRegistro.style.color = "#B34260";
        return;
    }

    // Preparar los datos para Flask
    const datosUsuario = {
        nombre: nombre,
        correo: correo,
        fecha_nacimiento: fechaNacimiento,
        contrasena: contrasena,
        confirmar_contrasena: confirmar
    };

    mensajeRegistro.textContent = "Estamos creando tu cuenta...";
    mensajeRegistro.style.color = "#51406F";
    botonRegistro.disabled = true;

    try {
        // Enviar los datos al servidor Flask
        const respuesta = await fetch("/api/registro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datosUsuario)
        });

        const resultado = await respuesta.json();

        mensajeRegistro.textContent = resultado.mensaje;

        if (respuesta.ok) {
            mensajeRegistro.style.color = "#397D68";
            formularioRegistro.reset();
        } else {
            mensajeRegistro.style.color = "#B34260";
        }

    } catch (error) {
        mensajeRegistro.textContent =
            "No pudimos conectar con el servidor. Inténtalo nuevamente.";
        mensajeRegistro.style.color = "#B34260";

    } finally {
        botonRegistro.disabled = false;
    }
const formulario = document.getElementById("form-registro");
const mensaje = document.getElementById("mensaje-registro");

formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const boton = formulario.querySelector('button[type="submit"]');

    const datos = {
        nombre: document.getElementById("nombre").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        fecha_nacimiento: document.getElementById("fecha_nacimiento").value,
        contrasena: document.getElementById("contrasena").value,
        confirmar_contrasena: document.getElementById("confirmar_contrasena").value
    };

    if (datos.contrasena !== datos.confirmar_contrasena) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    boton.disabled = true;
    mensaje.textContent = "Estamos creando tu cuenta...";

    try {
        const respuesta = await fetch("/api/registro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        mensaje.textContent = resultado.mensaje;

        if (respuesta.ok) {
            formulario.reset();
        }

    } catch (error) {
        mensaje.textContent =
            "No pudimos conectar con el servidor. Intenta nuevamente.";
    } finally {
        boton.disabled = false;
    }
});

});
