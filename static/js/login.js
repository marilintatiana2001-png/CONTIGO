
const formularioLogin = document.getElementById("form-login");

if (formularioLogin) {

    formularioLogin.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        const correo = document.getElementById("correo").value.trim();

        const contrasena = document.getElementById("contrasena").value;

        const boton = formularioLogin.querySelector(
            'button[type="submit"]'
        );

        boton.disabled = true;

        try {

            const respuesta = await fetch("/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({
                    correo: correo,
                    contrasena: contrasena
                })

            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {

                window.location.href = resultado.redirigir;

            } else {

                alert(resultado.mensaje);

            }

        } catch (error) {

            alert("No pudimos conectar con el servidor.");

        } finally {

            boton.disabled = false;

        }

    });

}
