
/* ==========================================
   CONTIGO - MOTOR DE LAS 42 ACTIVIDADES
   + REGISTRO DE ESTRELLAS
   + FRASES DE APOYO
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ======================================
    // ELEMENTOS PRINCIPALES
    // ======================================

    const inicio =
        document.getElementById("actividad-intro");

    const zona =
        document.getElementById("actividad-zona");

    const final =
        document.getElementById("actividad-final");

    const comenzar =
        document.getElementById("comenzar-actividad");

    const repetir =
        document.getElementById("repetir-actividad");

    if (!inicio || !zona || !final || !comenzar || !repetir) {
        return;
    }

    const id = Number(zona.dataset.id);

    let temporizador = null;
    let claveIntento = "";
    let enviandoProgreso = false;
    let intentoGuardado = false;


    // ======================================
    // CLAVE ÚNICA POR INTENTO
    // ======================================

    function nuevaClaveIntento() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {
            return window.crypto.randomUUID();
        }

        return (
            Date.now().toString() + "-" +
            Math.random().toString(36).slice(2) + "-" +
            Math.random().toString(36).slice(2)
        );
    }


    // ======================================
    // GRUPOS DE ACTIVIDADES
    // ======================================

    const grupos = {

        respiracion: [1, 6, 7, 22, 25, 28],

        presente: [2, 9, 29],

        colorear: [3, 27, 38],

        dibujar: [4, 15, 17, 20, 31, 33, 34, 35],

        plan: [5, 11, 18, 32, 36, 42],

        movimiento: [14, 16, 26, 41],

        personaje: [10, 23],

        frases: [12, 19, 24, 37],

        lugar: [8, 30],

        guia: [13, 21, 39, 40]
    };


    // ======================================
    // TEMPORIZADOR
    // ======================================

    function limpiarTiempo() {

        if (temporizador !== null) {
            clearInterval(temporizador);
            temporizador = null;
        }
    }


    // ======================================
    // CAMBIAR VISTA
    // ======================================

    function mostrar(seccion) {

        inicio.hidden = seccion !== "inicio";

        zona.hidden = seccion !== "actividad";

        final.hidden = seccion !== "final";
    }


    // ======================================
    // COMPLETAR Y GUARDAR LA ACTIVIDAD
    // ======================================

    async function terminar() {

        if (enviandoProgreso || intentoGuardado) {
            return;
        }

        enviandoProgreso = true;

        let estado = zona.querySelector(
            "#estado-guardado-estrella"
        );

        if (!estado) {

            estado = document.createElement("p");

            estado.id = "estado-guardado-estrella";

            estado.setAttribute("role", "status");

            zona.appendChild(estado);
        }

        estado.textContent =
            "Guardando tu estrella... ✨";

        try {

            const respuesta = await fetch(
                `/api/actividades/${id}/completar`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token":
                            document.body.dataset.csrf || ""
                    },

                    credentials: "same-origin",

                    body: JSON.stringify({
                        clave_evento: claveIntento
                    })
                }
            );

            if (respuesta.status === 401) {
                window.location.href = "/";
                return;
            }

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje || "No se pudo guardar."
                );
            }

            intentoGuardado = true;

            limpiarTiempo();

            mostrar("final");

            // FRASES Y PREGUNTAS DE REFLEXIÓN
            if (
                typeof window.mostrarCierreContigo ===
                "function"
            ) {

                window.mostrarCierreContigo();

            } else {

                document.getElementById(
                    "frase-final"
                ).textContent =
                    "Hoy dedicaste un momento a cuidarte. " +
                    "Tu proceso merece cariño y paciencia.";

                document.getElementById(
                    "pregunta-reflexion"
                ).textContent =
                    "¿Qué te gustaría recordar de esta experiencia?";
            }

            // MENSAJE DE LA ESTRELLA
            const aviso = document.getElementById(
                "aviso-estrella"
            );

            if (aviso) {

                if (datos.repetida) {

                    aviso.textContent =
                        "⭐ Este intento ya había sido registrado.";

                } else if (
                    (datos.nuevas_constelaciones || []).length > 0
                ) {

                    aviso.textContent =
                        "🌟 ¡Descubriste una nueva constelación! " +
                        "Tu cielo te espera.";

                } else {

                    aviso.textContent =
                        "⭐ ¡Ganaste una estrella " +
                        "para tu Cielo de Bienestar!";
                }
            }

            final.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            estado.textContent =
                "No pudimos guardar tu estrella: " +
                error.message +
                ". Comprueba XAMPP y vuelve a intentar.";

        } finally {

            enviandoProgreso = false;
        }
    }


    // ======================================
    // PALETA DE COLORES
    // ======================================

    const paleta = [
        "#f48eb9",
        "#a68bea",
        "#83c7ef",
        "#9bd8ad",
        "#ffd27d",
        "#7356ba"
    ];


    function botonesPaleta() {

        return `
            <div class="paleta-colores"
                 role="group"
                 aria-label="Selecciona un color">

                ${paleta.map((color, n) => `

                    <button
                        type="button"
                        class="color-muestra"
                        data-color="${color}"
                        style="--muestra:${color}"
                        aria-label="Color ${n + 1}">
                    </button>

                `).join("")}

            </div>
        `;
    }


    function configurarPaleta(onChange) {

        const botones = [
            ...zona.querySelectorAll(".color-muestra")
        ];

        let colorActivo = paleta[0];

        botones.forEach(boton => {

            boton.addEventListener("click", () => {

                colorActivo = boton.dataset.color;

                botones.forEach(elemento => {

                    elemento.classList.toggle(
                        "elegido",
                        elemento === boton
                    );
                });

                onChange(colorActivo);
            });
        });

        if (botones[0]) {
            botones[0].classList.add("elegido");
        }

        return () => colorActivo;
    }


    // ======================================
    // RESPIRACIÓN
    // ======================================

    function actividadRespiracion() {

        const simbolos = {
            1: "🎈",
            6: "🌸",
            7: "☁️",
            22: "☁️",
            25: "◇",
            28: "🎈"
        };

        zona.innerHTML = `
            <h2>🌬️ Un momento para respirar</h2>

            <p>
                Observa cómo cambia la figura.
                Si te resulta cómodo, acompaña
                el movimiento con tu respiración
                natural, sin forzarla.
            </p>

            <div id="figura-respiracion"
                 class="figura-respiracion">
                ${simbolos[id] || "💜"}
            </div>

            <p id="estado-respiracion" role="status">
                Puedes comenzar cuando quieras.
            </p>

            <button type="button"
                    id="activar-respiracion"
                    class="boton-experiencia">
                Iniciar animación
            </button>

            <button type="button"
                    id="terminar-respiracion"
                    class="boton-secundario">
                Terminar a mi ritmo
            </button>
        `;

        const figura = zona.querySelector(
            "#figura-respiracion"
        );

        const estado = zona.querySelector(
            "#estado-respiracion"
        );

        const boton = zona.querySelector(
            "#activar-respiracion"
        );

        boton.addEventListener("click", () => {

            if (temporizador !== null) {
                return;
            }

            boton.disabled = true;

            figura.classList.add("respirando");

            let segundos = 0;

            estado.textContent =
                "Observa el movimiento. " +
                "Puedes detenerte cuando quieras.";

            temporizador = setInterval(() => {

                segundos++;

                const ciclo = Math.min(
                    3,
                    Math.floor(segundos / 8) + 1
                );

                estado.textContent =
                    `Ciclo suave ${ciclo} de 3 · ` +
                    `${segundos} segundos`;

                if (segundos >= 24) {

                    limpiarTiempo();

                    figura.classList.remove(
                        "respirando"
                    );

                    estado.textContent =
                        "Completaste tres ciclos. " +
                        "Puedes finalizar cuando quieras.";

                    boton.textContent =
                        "Repetir animación";

                    boton.disabled = false;
                }

            }, 1000);
        });

        zona.querySelector(
            "#terminar-respiracion"
        ).addEventListener("click", terminar);
    }


    // ======================================
    // VUELVE AL PRESENTE
    // ======================================

    function actividadPresente() {

        const pasos = [
            "¿Qué es lo primero que puedes ver?",
            "Observa una segunda cosa a tu alrededor.",
            "Encuentra una tercera cosa, aunque sea pequeña.",
            "¿Qué otro color, forma u objeto puedes identificar?",
            "Observa una última cosa y descríbela."
        ];

        zona.innerHTML = `
            <h2>🌿 Vuelve al presente</h2>

            <p id="contador-pasos">Paso 1 de 5</p>

            <div class="barra-actividad">
                <div id="progreso-pasos"></div>
            </div>

            <h3 id="pregunta-pasos"></h3>

            <form id="form-pasos"
                  class="form-experiencia">

                <label for="texto-pasos">
                    Lo que estoy viendo
                </label>

                <input
                    id="texto-pasos"
                    maxlength="150"
                    required
                    placeholder="Escribe lo que observas...">

                <button type="submit"
                        class="boton-experiencia">
                    Continuar →
                </button>

            </form>
        `;

        let paso = 0;

        const pregunta = zona.querySelector(
            "#pregunta-pasos"
        );

        const contador = zona.querySelector(
            "#contador-pasos"
        );

        const progreso = zona.querySelector(
            "#progreso-pasos"
        );

        const formulario = zona.querySelector(
            "#form-pasos"
        );

        const input = zona.querySelector(
            "#texto-pasos"
        );

        function pintarPaso() {

            pregunta.textContent = pasos[paso];

            contador.textContent =
                `Paso ${paso + 1} de 5`;

            progreso.style.width =
                `${((paso + 1) / 5) * 100}%`;

            formulario.querySelector(
                'button[type="submit"]'
            ).textContent = paso === 4
                ? "Terminar actividad 💗"
                : "Continuar →";

            input.value = "";
            input.focus();
        }

        formulario.addEventListener(
            "submit",
            evento => {

                evento.preventDefault();

                if (!input.value.trim()) {
                    return;
                }

                paso++;

                if (paso === 5) {
                    terminar();
                } else {
                    pintarPaso();
                }
            }
        );

        pintarPaso();
    }


    // ======================================
    // COLOREAR MANDALA
    // ======================================

    function actividadColorear() {

        const petalos = Array.from(
            { length: 10 },
            (_, i) => `
                <ellipse
                    class="zona-pintable"
                    data-parte="${i}"
                    role="button"
                    tabindex="0"
                    aria-label="Colorear pétalo ${i + 1}"
                    cx="150"
                    cy="76"
                    rx="23"
                    ry="48"
                    transform="rotate(${i * 36} 150 150)"
                    fill="#fff9fd"
                    stroke="#9a7dd3"
                    stroke-width="3">
                </ellipse>
            `
        ).join("");

        zona.innerHTML = `
            <h2>🎨 Colorea a tu manera</h2>

            <p>
                Elige un color y toca las partes
                del dibujo. No hay combinaciones
                equivocadas.
            </p>

            ${botonesPaleta()}

            <svg class="mandala-interactiva"
                 viewBox="0 0 300 300"
                 role="group"
                 aria-label="Mandala para colorear">

                <circle
                    cx="150"
                    cy="150"
                    r="146"
                    fill="#f6edff">
                </circle>

                ${petalos}

                <circle
                    class="zona-pintable"
                    data-parte="centro"
                    role="button"
                    tabindex="0"
                    aria-label="Colorear centro"
                    cx="150"
                    cy="150"
                    r="47"
                    fill="#fff9fd"
                    stroke="#9a7dd3"
                    stroke-width="3">
                </circle>

                <circle
                    cx="150"
                    cy="150"
                    r="10"
                    fill="#f7d4a5"
                    pointer-events="none">
                </circle>

            </svg>

            <p id="estado-colorear" role="status">
                Colorea al menos tres partes para terminar.
            </p>

            <button
                type="button"
                id="finalizar-colores"
                class="boton-experiencia"
                disabled>
                Terminar actividad 💗
            </button>
        `;

        const color = configurarPaleta(() => {});

        const pintadas = new Set();

        const svg = zona.querySelector(
            ".mandala-interactiva"
        );

        const fin = zona.querySelector(
            "#finalizar-colores"
        );

        const estado = zona.querySelector(
            "#estado-colorear"
        );

        function pintar(elemento) {

            if (
                !elemento ||
                !elemento.classList.contains(
                    "zona-pintable"
                )
            ) {
                return;
            }

            elemento.setAttribute("fill", color());

            pintadas.add(elemento.dataset.parte);

            estado.textContent =
                `Partes coloreadas: ${pintadas.size}`;

            fin.disabled = pintadas.size < 3;
        }

        svg.addEventListener("click", evento => {
            pintar(evento.target);
        });

        svg.addEventListener("keydown", evento => {

            if (
                evento.key === "Enter" ||
                evento.key === " "
            ) {

                evento.preventDefault();

                pintar(evento.target);
            }
        });

        fin.addEventListener("click", terminar);
    }


    // ======================================
    // DIBUJAR Y PINTAR
    // ======================================

    function actividadDibujar() {

        const titulos = {
            4: "Colores de hoy",
            15: "Pintura libre",
            17: "Completa el dibujo",
            20: "Colores de hoy",
            31: "Decora una estrella",
            33: "Arcoíris emocional",
            34: "Dibuja tu clima",
            35: "Pintura libre"
        };

        zona.innerHTML = `
            <h2>🖌️ ${titulos[id] || "Arte libre"}</h2>

            <p>
                Usa tu dedo o el cursor para dibujar.
                Cambia de color cuando quieras.
            </p>

            ${botonesPaleta()}

            <canvas
                id="lienzo-actividad"
                class="lienzo-actividad"
                aria-label="Lienzo para dibujar">
            </canvas>

            <div class="acciones-experiencia">

                <button type="button"
                        id="limpiar-lienzo"
                        class="boton-secundario">
                    Borrar dibujo
                </button>

                <button type="button"
                        id="terminar-dibujo"
                        class="boton-experiencia"
                        disabled>
                    Terminar actividad 💗
                </button>

            </div>
        `;

        const canvas = zona.querySelector(
            "#lienzo-actividad"
        );

        const ctx = canvas.getContext("2d");

        const elegirColor = configurarPaleta(
            () => {}
        );

        const terminarBtn = zona.querySelector(
            "#terminar-dibujo"
        );

        let pintando = false;

        const ancho =
            canvas.getBoundingClientRect().width;

        const alto =
            canvas.getBoundingClientRect().height;

        const escala = window.devicePixelRatio || 1;

        canvas.width = Math.round(ancho * escala);
        canvas.height = Math.round(alto * escala);

        ctx.setTransform(
            escala, 0, 0, escala, 0, 0
        );

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        function fondo() {

            ctx.clearRect(0, 0, ancho, alto);

            ctx.fillStyle = "#fffdfd";
            ctx.fillRect(0, 0, ancho, alto);

            if (id === 31 || id === 17) {

                ctx.strokeStyle = "#ddc7f2";
                ctx.lineWidth = 3;
                ctx.beginPath();

                if (id === 31) {

                    const cx = ancho / 2;
                    const cy = alto / 2;

                    const radio =
                        Math.min(ancho, alto) * 0.32;

                    for (let i = 0; i < 10; i++) {

                        const angulo =
                            -Math.PI / 2 +
                            i * Math.PI / 5;

                        const r = i % 2
                            ? radio * 0.45
                            : radio;

                        const x =
                            cx + Math.cos(angulo) * r;

                        const y =
                            cy + Math.sin(angulo) * r;

                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }

                    ctx.closePath();

                } else {

                    ctx.arc(
                        ancho / 2,
                        alto / 2,
                        80,
                        Math.PI * 0.8,
                        Math.PI * 1.8
                    );
                }

                ctx.stroke();
            }
        }

        fondo();

        function posicion(evento) {

            const rect =
                canvas.getBoundingClientRect();

            return {
                x: evento.clientX - rect.left,
                y: evento.clientY - rect.top
            };
        }

        canvas.addEventListener(
            "pointerdown",
            evento => {

                pintando = true;

                canvas.setPointerCapture(
                    evento.pointerId
                );

                const p = posicion(evento);

                ctx.strokeStyle = elegirColor();
                ctx.lineWidth = 5;

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + 0.1, p.y + 0.1);
                ctx.stroke();

                terminarBtn.disabled = false;
            }
        );

        canvas.addEventListener(
            "pointermove",
            evento => {

                if (!pintando) {
                    return;
                }

                const p = posicion(evento);

                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
        );

        [
            "pointerup",
            "pointercancel",
            "lostpointercapture"
        ].forEach(tipo => {

            canvas.addEventListener(tipo, () => {
                pintando = false;
            });
        });

        zona.querySelector(
            "#limpiar-lienzo"
        ).addEventListener("click", () => {

            fondo();

            terminarBtn.disabled = true;
        });

        terminarBtn.addEventListener(
            "click",
            terminar
        );
    }


    // ======================================
    // PLANES Y PEQUEÑOS PASOS
    // ======================================

    function actividadPlan() {

        const consignas = {
            5: "¿Qué acción pequeña te gustaría intentar hoy?",
            11: "¿Cómo te gustaría acercarte a alguien de confianza?",
            18: "¿Qué paso alcanzable te gustaría intentar?",
            32: "¿Qué actividad sencilla podrías explorar hoy?",
            36: "¿Qué actividad cotidiana te gustaría conocer mejor?",
            42: "¿Qué tarea podrías dividir en un primer paso?"
        };

        zona.innerHTML = `
            <h2>🌱 Un pequeño paso</h2>

            <p>
                No hay metas demasiado pequeñas.
                Elige algo que se sienta posible.
            </p>

            <form id="form-plan"
                  class="form-experiencia">

                <label for="respuesta-plan">
                    ${consignas[id]}
                </label>

                <input
                    id="respuesta-plan"
                    maxlength="250"
                    required
                    placeholder="Mi pequeño paso será...">

                <label for="detalle-plan">
                    ¿Qué podría ayudarte? (opcional)
                </label>

                <textarea
                    id="detalle-plan"
                    maxlength="500"
                    rows="3">
                </textarea>

                <button type="submit"
                        class="boton-experiencia">
                    Terminar actividad 💗
                </button>

            </form>
        `;

        zona.querySelector(
            "#form-plan"
        ).addEventListener("submit", evento => {

            evento.preventDefault();

            if (
                zona.querySelector(
                    "#respuesta-plan"
                ).value.trim()
            ) {
                terminar();
            }
        });
    }


    // ======================================
    // MOVIMIENTO
    // ======================================

    function actividadMovimiento() {

        const guias = {

            14: [
                "Si te resulta cómodo, ponte de pie o permanece sentado.",
                "Mueve lentamente las manos y los brazos.",
                "Detente, observa cómo te sientes y descansa."
            ],

            16: [
                "Descansa las manos en una superficie cómoda.",
                "Ciérralas suavemente, sin apretar.",
                "Ábrelas despacio y permite que descansen."
            ],

            26: [
                "Coloca los hombros en una posición cómoda.",
                "Muévelos suavemente hacia arriba.",
                "Suéltalos y descansa un momento."
            ],

            41: [
                "Elige una postura cómoda.",
                "Extiende los brazos suavemente.",
                "Regresa despacio y relaja los brazos."
            ]
        };

        actividadPorPasos(
            "🌿 Movimiento consciente",
            guias[id],
            "Realiza cada movimiento solo si te resulta cómodo."
        );
    }


    // ======================================
    // CREAR PERSONAJES
    // ======================================

    function actividadPersonaje() {

        zona.innerHTML = `
            <h2>🎭 Crea tu personaje</h2>

            <p>
                Combina expresiones y accesorios
                para crear un personaje especial.
            </p>

            <div id="personaje-vista"
                 class="personaje-vista">
                😊 🎀
            </div>

            <div class="form-experiencia">

                <label for="cara-personaje">
                    Expresión
                </label>

                <select id="cara-personaje">
                    <option value="😊">Sonriente</option>
                    <option value="😌">Tranquilo</option>
                    <option value="🥰">Cariñoso</option>
                    <option value="😎">Divertido</option>
                </select>

                <label for="accesorio-personaje">
                    Accesorio
                </label>

                <select id="accesorio-personaje">
                    <option value="🎀">Lazo</option>
                    <option value="🌸">Flor</option>
                    <option value="⭐">Estrella</option>
                    <option value="👑">Corona</option>
                </select>

                <button type="button"
                        id="fin-personaje"
                        class="boton-experiencia">
                    Terminar actividad 💗
                </button>

            </div>
        `;

        const cara = zona.querySelector(
            "#cara-personaje"
        );

        const accesorio = zona.querySelector(
            "#accesorio-personaje"
        );

        const vista = zona.querySelector(
            "#personaje-vista"
        );

        function actualizar() {

            vista.textContent =
                `${cara.value} ${accesorio.value}`;
        }

        cara.addEventListener(
            "change", actualizar
        );

        accesorio.addEventListener(
            "change", actualizar
        );

        zona.querySelector(
            "#fin-personaje"
        ).addEventListener("click", terminar);
    }


    // ======================================
    // FRASES AMABLES
    // ======================================

    function actividadFrases() {

        const opciones = [
            "Puedo avanzar a mi propio ritmo.",
            "Merezco tratarme con amabilidad.",
            "Mis emociones merecen ser escuchadas.",
            "No necesito hacerlo perfectamente.",
            "Puedo pedir ayuda cuando la necesite."
        ];

        zona.innerHTML = `
            <h2>💌 Elige una frase amable</h2>

            <p>
                Escoge una frase que te gustaría
                regalarte hoy.
            </p>

            <div class="lista-frases">

                ${opciones.map((texto, i) => `
                    <button
                        type="button"
                        class="opcion-frase"
                        data-frase="${i}">
                        ${texto}
                    </button>
                `).join("")}

            </div>

            ${botonesPaleta()}

            <p id="tarjeta-frase"
               class="tarjeta-frase">
                Aquí aparecerá tu frase 💗
            </p>

            <button
                type="button"
                id="fin-frase"
                class="boton-experiencia"
                disabled>
                Terminar actividad 💗
            </button>
        `;

        const mostrarFrase = zona.querySelector(
            "#tarjeta-frase"
        );

        const fin = zona.querySelector(
            "#fin-frase"
        );

        const getColor = configurarPaleta(color => {

            mostrarFrase.style.borderColor = color;
        });

        zona.querySelectorAll(
            ".opcion-frase"
        ).forEach(boton => {

            boton.addEventListener("click", () => {

                zona.querySelectorAll(
                    ".opcion-frase"
                ).forEach(elemento => {

                    elemento.classList.toggle(
                        "elegida",
                        elemento === boton
                    );
                });

                mostrarFrase.textContent =
                    opciones[Number(boton.dataset.frase)];

                mostrarFrase.style.borderColor =
                    getColor();

                fin.disabled = false;
            });
        });

        fin.addEventListener("click", terminar);
    }


    // ======================================
    // MI LUGAR SEGURO
    // ======================================

    function actividadLugar() {

        const lugares = [
            "🌳 Bosque tranquilo",
            "🏖️ Playa serena",
            "☁️ Cielo de colores",
            "🏡 Rincón acogedor"
        ];

        zona.innerHTML = `
            <h2>🏡 Mi lugar seguro imaginario</h2>

            <p>
                Elige un escenario que te resulte
                agradable o te inspire tranquilidad.
            </p>

            <div class="opciones-escena">

                ${lugares.map((lugar, i) => `
                    <button
                        type="button"
                        class="opcion-frase"
                        data-lugar="${i}">
                        ${lugar}
                    </button>
                `).join("")}

            </div>

            <div id="lugar-elegido"
                 class="escena-elegida">
                ✨
            </div>

            <button
                type="button"
                id="fin-lugar"
                class="boton-experiencia"
                disabled>
                Terminar actividad 💗
            </button>
        `;

        const vista = zona.querySelector(
            "#lugar-elegido"
        );

        const fin = zona.querySelector(
            "#fin-lugar"
        );

        zona.querySelectorAll(
            "[data-lugar]"
        ).forEach(boton => {

            boton.addEventListener("click", () => {

                zona.querySelectorAll(
                    "[data-lugar]"
                ).forEach(elemento => {

                    elemento.classList.toggle(
                        "elegida",
                        elemento === boton
                    );
                });

                vista.textContent =
                    lugares[Number(boton.dataset.lugar)];

                fin.disabled = false;
            });
        });

        fin.addEventListener("click", terminar);
    }


    // ======================================
    // ACTIVIDADES POR PASOS
    // ======================================

    function actividadPorPasos(
        titulo,
        pasos,
        explicacion
    ) {

        const esNube = id === 40;

        zona.innerHTML = `
            <h2>${titulo}</h2>

            <p>${explicacion}</p>

            <div class="paso-guiado">

                <div class="paso-icono
                    ${esNube ? "nube-viajera" : ""}">
                    ${esNube ? "☁️" : "💜"}
                </div>

                <p id="numero-guia"></p>

                <h3 id="texto-guia"></h3>

                <button
                    type="button"
                    id="siguiente-guia"
                    class="boton-experiencia">
                    Siguiente paso →
                </button>

            </div>
        `;

        let paso = 0;

        const numero = zona.querySelector(
            "#numero-guia"
        );

        const texto = zona.querySelector(
            "#texto-guia"
        );

        const boton = zona.querySelector(
            "#siguiente-guia"
        );

        function mostrarPaso() {

            numero.textContent =
                `Paso ${paso + 1} de ${pasos.length}`;

            texto.textContent = pasos[paso];

            boton.textContent =
                paso === pasos.length - 1
                    ? "Terminar actividad 💗"
                    : "Siguiente paso →";
        }

        boton.addEventListener("click", () => {

            paso++;

            if (paso >= pasos.length) {
                terminar();
            } else {
                mostrarPaso();
            }
        });

        mostrarPaso();
    }


    // ======================================
    // REFLEXIÓN Y PAUSAS
    // ======================================

    function actividadGuiada() {

        const guias = {

            13: [
                "Reconoce qué te incomodó.",
                "Antes de responder, regálate una pausa.",
                "Piensa qué te gustaría expresar con respeto."
            ],

            21: [
                "Piensa en algo que aprendiste.",
                "Considera si hay algo que puedas reparar.",
                "Reconoce qué harías diferente."
            ],

            39: [
                "Recuerda un pequeño logro.",
                "Reconoce el esfuerzo que dedicaste.",
                "Piensa en una cualidad que valoras de ti."
            ],

            40: [
                "Observa una nube imaginaria.",
                "Mira el espacio que te rodea.",
                "Descansa la mirada unos segundos."
            ]
        };

        actividadPorPasos(
            "✨ Un momento para reflexionar",
            guias[id],
            "Lee cada propuesta a tu propio ritmo."
        );
    }


    // ======================================
    // INICIAR ACTIVIDAD
    // ======================================

    function iniciarActividad() {

        limpiarTiempo();

        claveIntento = nuevaClaveIntento();

        intentoGuardado = false;

        zona.innerHTML = "";

        mostrar("actividad");

        const grupo = Object.keys(grupos).find(
            nombre => grupos[nombre].includes(id)
        );

        const motores = {
            respiracion: actividadRespiracion,
            presente: actividadPresente,
            colorear: actividadColorear,
            dibujar: actividadDibujar,
            plan: actividadPlan,
            movimiento: actividadMovimiento,
            personaje: actividadPersonaje,
            frases: actividadFrases,
            lugar: actividadLugar,
            guia: actividadGuiada
        };

        if (grupo && motores[grupo]) {

            motores[grupo]();

        } else {

            zona.textContent =
                "Esta actividad todavía no tiene " +
                "una experiencia configurada.";
        }
    }


    // ======================================
    // EVENTOS PRINCIPALES
    // ======================================

    comenzar.addEventListener(
        "click",
        iniciarActividad
    );

    repetir.addEventListener("click", () => {

        limpiarTiempo();

        zona.innerHTML = "";

        mostrar("inicio");

        comenzar.focus();
    });

    window.addEventListener(
        "pagehide",
        limpiarTiempo
    );

});
