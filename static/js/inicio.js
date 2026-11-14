document.addEventListener("DOMContentLoaded", function () {
  const listaEmociones = document.getElementById("lista-emociones");

  if (!listaEmociones) {
    return;
  }

  const modalEmocion = document.getElementById("modal-emocion");
  const modalIntensidad = document.getElementById("modal-intensidad");
  const emocionSeleccionadaTexto = document.getElementById("emocion-seleccionada-texto");
  const toast = document.getElementById("toast-emocion");

  const cerrarModalEmocion = document.getElementById("cerrar-modal-emocion");
  const cancelarModalEmocion = document.getElementById("cancelar-modal-emocion");
  const continuarModalEmocion = document.getElementById("continuar-modal-emocion");

  const cerrarModalIntensidad = document.getElementById("cerrar-modal-intensidad");
  const volverModalIntensidad = document.getElementById("volver-modal-intensidad");
  const guardarEmocionBtn = document.getElementById("guardar-emocion");

  const opcionesIntensidad = document.querySelectorAll(".intensidad-opcion");

  let emocionSeleccionada = "";
  let intensidadSeleccionada = null;

  function abrirModal(elemento) {
    elemento.classList.remove("oculto");
  }

  function cerrarModal(elemento) {
    elemento.classList.add("oculto");
  }

  function mostrarToast(mensaje, tiempo = 2200) {
    toast.textContent = mensaje;
    toast.classList.remove("oculto");

    setTimeout(() => {
      toast.classList.add("oculto");
    }, tiempo);
  }

  function limpiarIntensidad() {
    intensidadSeleccionada = null;

    opcionesIntensidad.forEach((opcion) => {
      opcion.classList.remove("activa");
    });
  }

  listaEmociones.addEventListener("click", function (evento) {
    const boton = evento.target.closest("button[data-emocion]");

    if (!boton) {
      return;
    }

    emocionSeleccionada = boton.dataset.emocion || "";
    emocionSeleccionadaTexto.textContent = emocionSeleccionada;

    limpiarIntensidad();
    abrirModal(modalEmocion);
  });

  cerrarModalEmocion.addEventListener("click", function () {
    cerrarModal(modalEmocion);
  });

  cancelarModalEmocion.addEventListener("click", function () {
    cerrarModal(modalEmocion);
  });

  continuarModalEmocion.addEventListener("click", function () {
    cerrarModal(modalEmocion);
    abrirModal(modalIntensidad);
  });

  cerrarModalIntensidad.addEventListener("click", function () {
    cerrarModal(modalIntensidad);
  });

  volverModalIntensidad.addEventListener("click", function () {
    cerrarModal(modalIntensidad);
    abrirModal(modalEmocion);
  });

  opcionesIntensidad.forEach((opcion) => {
    opcion.addEventListener("click", function () {
      opcionesIntensidad.forEach((item) => {
        item.classList.remove("activa");
      });

      this.classList.add("activa");
      intensidadSeleccionada = parseInt(this.dataset.intensidad, 10);
    });
  });

  guardarEmocionBtn.addEventListener("click", async function () {
    if (!emocionSeleccionada) {
      mostrarToast("Primero selecciona una emoción.");
      return;
    }

    if (!intensidadSeleccionada) {
      mostrarToast("Selecciona la intensidad de la emoción.");
      return;
    }

    guardarEmocionBtn.disabled = true;
    guardarEmocionBtn.textContent = "Guardando...";

    try {
      const respuesta = await fetch("/api/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emocion: emocionSeleccionada,
          intensidad: intensidadSeleccionada
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo guardar la emoción.");
      }

      cerrarModal(modalIntensidad);
      mostrarToast("Tu emoción se guardó correctamente 💜");

      setTimeout(() => {
        const parametros = new URLSearchParams({
          emocion: emocionSeleccionada
        });

        window.location.href = "/actividades?" + parametros.toString();
      }, 1200);

    } catch (error) {
      mostrarToast(error.message || "Ocurrió un error al guardar.");
    } finally {
      guardarEmocionBtn.disabled = false;
      guardarEmocionBtn.textContent = "Guardar emoción";
    }
  });
});