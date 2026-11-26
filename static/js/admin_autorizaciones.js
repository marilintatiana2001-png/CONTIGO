
document.addEventListener("DOMContentLoaded", () => {
    const lista = document.getElementById("lista-autorizaciones");
    const total = document.getElementById("total-pendientes");
    const mensaje = document.getElementById("mensaje");
    const botonRecargar = document.getElementById("btn-recargar");

    const csrfToken = document
        .querySelector('meta[name="csrf-admin"]')
        .getAttribute("content");

    function escapar(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);
    }

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = tipo;
    }

    function ocultarMensaje() {
        mensaje.textContent = "";
        mensaje.className = "";
    }

    function mostrarFecha(valor) {
        if (!valor) return "No registrada";

        const fecha = new Date(valor);

        return Number.isNaN(fecha.getTime())
            ? valor
            : fecha.toLocaleString("es-CO");
    }

    async function cargarAutorizaciones() {
        ocultarMensaje();
        lista.innerHTML = '<div class="vacio">Cargando solicitudes...</div>';
        botonRecargar.disabled = true;

        try {
            const respuesta = await fetch("/api/admin/autorizaciones", {
                method: "GET",
                credentials: "same-origin"
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    resultado.mensaje || "No fue posible cargar las solicitudes."
                );
            }

            const autorizaciones = resultado.autorizaciones || [];
            total.textContent = autorizaciones.length;

            if (autorizaciones.length === 0) {
                lista.innerHTML = `
                    <div class="vacio">
                        No hay solicitudes pendientes de revisión.
                    </div>
                `;
                return;
            }

            lista.innerHTML = autorizaciones.map(item => `
                <article class="solicitud" data-id="${escapar(item.id_autorizacion)}">

                    <span class="estado">
                        ${escapar(item.estado)}
                    </span>

                    <h2>Solicitud #${escapar(item.id_autorizacion)}</h2>

                    <div class="datos">
                        <div class="dato">
                            <small>Usuario</small>
                            <strong>${escapar(item.nombre_usuario)}</strong>
                        </div>

                        <div class="dato">
                            <small>Correo del usuario</small>
                            <strong>${escapar(item.correo_usuario)}</strong>
                        </div>

                        <div class="dato">
                            <small>Fecha de nacimiento</small>
                            <strong>${escapar(item.fecha_nacimiento || "No registrada")}</strong>
                        </div>

                        <div class="dato">
                            <small>Representante legal declarado</small>
                            <strong>${escapar(item.nombre_representante)}</strong>
                        </div>

                        <div class="dato">
                            <small>Correo del representante</small>
                            <strong>${escapar(item.correo_representante)}</strong>
                        </div>

                        <div class="dato">
                            <small>Parentesco declarado</small>
                            <strong>${escapar(item.parentesco)}</strong>
                        </div>

                        <div class="dato">
                            <small>Firma escrita</small>
                            <strong>${escapar(item.firma_electronica)}</strong>
                        </div>

                        <div class="dato">
                            <small>Fecha de aceptación</small>
                            <strong>${escapar(mostrarFecha(item.fecha_aceptacion))}</strong>
                        </div>

                        <div class="dato">
                            <small>Aceptación explícita</small>
                            <strong>${item.aceptacion_explicita ? "Sí" : "No"}</strong>
                        </div>

                        <div class="dato">
                            <small>Declaración de representación</small>
                            <strong>${item.declaracion_representacion ? "Sí" : "No"}</strong>
                        </div>
                    </div>

                    <div class="formulario-verificacion">
                        <h3>Verificación de representación legal</h3>

                        <p class="aviso">
                            Registra el procedimiento realizado y la evidencia
                            obtenida. La firma escrita y la declaración por sí
                            solas no acreditan la representación legal.
                        </p>

                        <label for="metodo-${item.id_autorizacion}">
                            Método de verificación
                        </label>

                        <select id="metodo-${item.id_autorizacion}">
                            <option value="">Selecciona un método</option>
                            <option value="verificacion_documental">
                                Verificación documental
                            </option>
                            <option value="verificacion_presencial">
                                Verificación presencial
                            </option>
                            <option value="verificacion_entidad">
                                Verificación con entidad competente
                            </option>
                            <option value="otro_metodo">
                                Otro método documentado
                            </option>
                        </select>

                        <label for="evidencia-${item.id_autorizacion}">
                            Evidencia de verificación
                        </label>

                        <textarea
                            id="evidencia-${item.id_autorizacion}"
                            placeholder="Describe qué documento o evidencia se revisó, cómo se comprobó y el resultado..."
                        ></textarea>

                        <label for="observaciones-${item.id_autorizacion}">
                            Observaciones adicionales
                        </label>

                        <textarea
                            id="observaciones-${item.id_autorizacion}"
                            placeholder="Observaciones (opcional)"
                        ></textarea>

                        <div class="acciones">
                            <button
                                type="button"
                                class="aprobar"
                                data-decision="aprobada"
                                data-id="${item.id_autorizacion}"
                            >
                                Aprobar y activar cuenta
                            </button>

                            <button
                                type="button"
                                class="rechazar"
                                data-decision="rechazada"
                                data-id="${item.id_autorizacion}"
                            >
                                Rechazar autorización
                            </button>
                        </div>
                    </div>
                </article>
            `).join("");

        } catch (error) {
            lista.innerHTML = `
                <div class="vacio">
                    No fue posible cargar las solicitudes.
                </div>
            `;

            mostrarMensaje(error.message, "error");

        } finally {
            botonRecargar.disabled = false;
        }
    }

    async function procesarAutorizacion(id, decision, boton) {
        const metodo = document
            .getElementById(`metodo-${id}`).value;

        const evidencia = document
            .getElementById(`evidencia-${id}`).value.trim();

        const observaciones = document
            .getElementById(`observaciones-${id}`).value.trim();

        if (!metodo) {
            mostrarMensaje(
                "Selecciona el método de verificación.",
                "error"
            );
            return;
        }

        if (evidencia.length < 15) {
            mostrarMensaje(
                "Describe la evidencia con al menos 15 caracteres.",
                "error"
            );
            return;
        }

        const confirmacion = decision === "aprobada"
            ? "¿Confirmas que verificaste la representación legal y deseas activar esta cuenta?"
            : "¿Confirmas el rechazo de esta autorización?";

        if (!window.confirm(confirmacion)) return;

        boton.disabled = true;
        ocultarMensaje();

        try {
            const respuesta = await fetch(
                `/api/admin/autorizaciones/${id}/verificar`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken
                    },
                    body: JSON.stringify({
                        decision,
                        metodo_verificacion: metodo,
                        evidencia_verificacion: evidencia,
                        observaciones_verificacion: observaciones
                    })
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    resultado.mensaje || "No fue posible procesar la solicitud."
                );
            }

            mostrarMensaje(resultado.mensaje, "exito");
            await cargarAutorizaciones();

        } catch (error) {
            mostrarMensaje(error.message, "error");
            boton.disabled = false;
        }
    }

    lista.addEventListener("click", event => {
        const boton = event.target.closest("button[data-decision]");

        if (!boton) return;

        procesarAutorizacion(
            boton.dataset.id,
            boton.dataset.decision,
            boton
        );
    });

    botonRecargar.addEventListener("click", cargarAutorizaciones);

    cargarAutorizaciones();
});
