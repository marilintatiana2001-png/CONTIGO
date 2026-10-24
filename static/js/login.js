
const formulario = document.getElementById("form-login");

formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    const boton = formulario.querySelector('button[type="submit"]');

    boton.disabled = true;

    try {
        const respuesta = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo: correo,
                contrasena: contrasena
            })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            window.location.href = "/inicio";
        } else {
            alert(resultado.mensaje || "No se pudo iniciar sesión.");
        }

    } catch (error) {
        alert("No pudimos conectar con el servidor.");
    } finally {
        boton.disabled = false;
    }
});
