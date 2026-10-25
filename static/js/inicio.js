document.addEventListener("DOMContentLoaded", function () {

    const listaEmociones =
        document.getElementById("lista-emociones");

    if (!listaEmociones) {
        return;
    }

    listaEmociones.addEventListener("click", function (evento) {

        const boton = evento.target.closest(
            "button[data-emocion]"
        );

        if (!boton) {
            return;
        }

        const emocion = boton.dataset.emocion;

        const parametros = new URLSearchParams({
            emocion: emocion
        });

        window.location.href =
            "/actividades?" + parametros.toString();

    });

});
