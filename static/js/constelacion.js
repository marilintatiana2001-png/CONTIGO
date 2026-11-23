
/* =====================================================
   CONTIGO - MI CIELO DE BIENESTAR
   Archivo: static/js/constelacion.js

   14 constelaciones interactivas
   8 estrellas por constelación
   Animación final con relleno y destellos
   Conexión con Flask y MariaDB
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ================================================
    // 1. ELEMENTOS DEL HTML
    // ================================================

    const datos = document.getElementById("datos-cielo");
    const mapa = document.getElementById("mapa-estrellas");
    const galeria = document.getElementById("galeria-figuras");
    const elegir = document.getElementById("elegir-figura");
    const mensaje = document.getElementById("mensaje-cielo");

    if (!datos || !mapa || !galeria || !elegir) {
        console.error("CONTIGO: faltan elementos del HTML.");
        return;
    }

    let cielo;

    try {
        cielo = JSON.parse(datos.textContent);
        if (!cielo || typeof cielo !== "object") {
            throw new Error("Datos inválidos");
        }
    } catch (error) {
        console.error("Error al leer el cielo:", error);
        return;
    }

    cielo.descubiertas = Array.isArray(cielo.descubiertas)
        ? cielo.descubiertas
        : [];

    const csrf = document.body.dataset.csrf || "";
    const NS = "http://www.w3.org/2000/svg";
    const META = 8;

    // ================================================
    // 2. COLORES FINALES DE LAS CONSTELACIONES
    // ================================================

    const colores = {
        corazon: "#f43f67",
        mariposa: "#a495f2",
        flor: "#f6a2c6",
        luna: "#ffe0a0",
        leo: "#f4bf79",
        aries: "#e9a5c5",
        tauro: "#b0dec6",
        cancer: "#96d8ec",
        escorpio: "#bc9ce6",
        piscis: "#8fdde4",
        capricornio: "#c4b1ee",
        sagitario: "#f4c6a4",
        conejo: "#f4b9d9",
        dragon: "#91dec0"
    };

    // ================================================
    // 3. LAS 14 CONSTELACIONES
    // ================================================

    const figuras = [

        // 01. CORAZÓN
        {
            id: "corazon",
            emoji: "💗",
            nombre: "Corazón de cariño",
            significado: "Amor propio y aceptación.",

            trazo:
                "M160 220 " +
                "C132 194 62 145 62 98 " +
                "C62 57 110 45 160 92 " +
                "C210 45 258 57 258 98 " +
                "C258 145 188 194 160 220 Z",

            detalles:
                "M119 83 Q102 75 90 91"
        },

        // 02. MARIPOSA
        {
            id: "mariposa",
            emoji: "🦋",
            nombre: "Mariposa de cambio",
            significado: "Transformación y crecimiento.",

            trazo:
                "M160 122 " +
                "C133 64 78 30 60 69 " +
                "C38 107 73 149 147 155 " +
                "C68 149 55 199 88 218 " +
                "C116 235 148 189 160 164 " +
                "C172 189 204 235 232 218 " +
                "C265 199 252 149 173 155 " +
                "C247 149 282 107 260 69 " +
                "C242 30 187 64 160 122 Z",

            detalles:
                "M160 113 L160 187 " +
                "M157 119 Q126 67 114 43 " +
                "M163 119 Q194 67 206 43"
        },

        // 03. FLOR
        {
            id: "flor",
            emoji: "🌸",
            nombre: "Flor de esperanza",
            significado: "Renacer con ternura.",

            trazo:
                "M160 100 " +
                "C117 28 160 12 186 63 " +
                "C247 15 278 70 217 112 " +
                "C294 118 277 182 205 175 " +
                "C204 246 140 256 133 182 " +
                "C66 221 30 159 105 126 " +
                "C40 78 102 35 160 100 Z",

            detalles:
                "M160 111 " +
                "C185 98 206 115 202 141 " +
                "C199 166 173 178 151 164 " +
                "C127 150 135 121 160 111 Z"
        },

        // 04. LUNA
        {
            id: "luna",
            emoji: "🌙",
            nombre: "Luna de calma",
            significado: "Tranquilidad y descanso.",

            trazo:
                "M190 37 " +
                "C133 51 99 102 110 157 " +
                "C120 209 171 238 226 218 " +
                "C190 248 115 229 82 171 " +
                "C48 110 92 41 190 37 Z",

            detalles:
                "M228 78 L232 88 L243 91 " +
                "L233 96 L230 107 L223 97 " +
                "L212 95 L222 89 Z"
        },

        // 05. LEO
        {
            id: "leo",
            emoji: "🦁",
            nombre: "Leo, el leoncito",
            significado: "Confianza, valentía y amor propio.",

            trazo:
                "M160 36 " +
                "C183 19 210 37 215 57 " +
                "C244 45 263 67 253 95 " +
                "C278 110 274 135 252 151 " +
                "C267 180 245 203 218 198 " +
                "C209 227 182 232 160 215 " +
                "C138 232 111 227 102 198 " +
                "C75 203 53 180 68 151 " +
                "C46 135 42 110 67 95 " +
                "C57 67 76 45 105 57 " +
                "C110 37 137 19 160 36 Z",

            detalles:
                "M114 96 Q160 72 206 96 " +
                "L202 155 Q190 185 160 197 " +
                "Q130 185 118 155 Z " +
                "M135 132 Q144 125 151 134 " +
                "M169 134 Q177 125 185 132 " +
                "M150 155 L170 155 L160 165 Z " +
                "M160 165 Q149 178 138 169 " +
                "M160 165 Q171 178 182 169 " +
                "M113 91 L100 75 " +
                "M207 91 L220 75"
        },

        // 06. ARIES
        {
            id: "aries",
            emoji: "🐏",
            nombre: "Aries, el carnerito",
            significado: "Valor para empezar de nuevo.",

            trazo:
                "M124 112 " +
                "C72 126 48 75 81 51 " +
                "C102 36 132 54 118 77 " +
                "C110 92 93 88 94 76 " +
                "C76 121 113 144 128 138 " +
                "C118 173 135 213 160 221 " +
                "C185 213 202 173 192 138 " +
                "C207 144 244 121 226 76 " +
                "C227 88 210 92 202 77 " +
                "C188 54 218 36 239 51 " +
                "C272 75 248 126 196 112 " +
                "Q160 99 124 112 Z",

            detalles:
                "M132 139 Q160 123 188 139 " +
                "M140 166 Q145 160 151 168 " +
                "M169 168 Q175 160 180 166 " +
                "M151 189 Q160 195 169 189"
        },

        // 07. TAURO
        {
            id: "tauro",
            emoji: "🐂",
            nombre: "Tauro, el torito",
            significado: "Fortaleza interior y paciencia.",

            trazo:
                "M113 103 " +
                "C88 102 56 78 62 40 " +
                "C76 67 98 67 124 69 " +
                "C145 60 175 60 196 69 " +
                "C222 67 244 67 258 40 " +
                "C264 78 232 102 207 103 " +
                "C218 127 215 179 194 207 " +
                "Q160 238 126 207 " +
                "C105 179 102 127 113 103 Z",

            detalles:
                "M113 105 Q78 92 67 123 " +
                "Q84 145 112 136 " +
                "M207 105 Q242 92 253 123 " +
                "Q236 145 208 136 " +
                "M135 149 Q144 143 152 151 " +
                "M168 151 Q176 143 185 149 " +
                "M132 181 Q160 171 188 181 " +
                "L183 204 Q160 215 137 204 Z " +
                "M149 191 L149 195 " +
                "M171 191 L171 195"
        },

        // 08. CÁNCER
        {
            id: "cancer",
            emoji: "🦀",
            nombre: "Cáncer, el cangrejito",
            significado: "Sensibilidad, cuidado y compañía.",

            trazo:
                "M104 151 " +
                "C98 125 120 109 160 109 " +
                "C200 109 222 125 216 151 " +
                "Q212 191 160 191 " +
                "Q108 191 104 151 Z " +
                "M104 139 Q60 126 55 88 " +
                "Q44 60 66 49 " +
                "Q90 42 107 76 " +
                "Q86 65 74 86 " +
                "Q91 94 113 119 " +
                "M216 139 Q260 126 265 88 " +
                "Q276 60 254 49 " +
                "Q230 42 213 76 " +
                "Q234 65 246 86 " +
                "Q229 94 207 119",

            detalles:
                "M124 118 L114 82 " +
                "M196 118 L206 82 " +
                "M142 147 Q149 139 156 147 " +
                "M164 147 Q171 139 178 147 " +
                "M146 169 Q160 179 174 169 " +
                "M111 166 L66 192 " +
                "M119 185 L87 218 " +
                "M209 166 L254 192 " +
                "M201 185 L233 218"
        },

        // 09. ESCORPIO
        {
            id: "escorpio",
            emoji: "🦂",
            nombre: "Escorpio, el escorpioncito",
            significado: "Cambios y fortaleza emocional.",

            trazo:
                "M115 128 " +
                "Q116 95 160 92 " +
                "Q204 95 205 128 " +
                "L189 182 Q160 220 131 182 Z " +
                "M160 92 C170 63 208 53 232 73 " +
                "Q263 96 242 125 " +
                "Q229 143 252 156 " +
                "Q271 174 250 195 " +
                "L229 201 L243 222 " +
                "M115 128 Q77 117 69 89 " +
                "L48 79 L56 58 L79 72 L88 100 " +
                "M205 128 Q243 117 251 89 " +
                "L272 79 L264 58 L241 72 L232 100",

            detalles:
                "M146 128 Q151 123 156 128 " +
                "M164 128 Q169 123 174 128 " +
                "M160 143 L160 175 " +
                "M137 155 L118 171 " +
                "M183 155 L202 171"
        },

        // 10. PISCIS
        {
            id: "piscis",
            emoji: "🐟",
            nombre: "Piscis, los pececitos",
            significado: "Imaginación, sensibilidad y empatía.",

            trazo:
                "M55 97 " +
                "Q106 46 164 96 " +
                "Q109 150 55 97 Z " +
                "M55 97 L30 62 L30 130 Z " +
                "M265 178 " +
                "Q214 127 156 178 " +
                "Q211 232 265 178 Z " +
                "M265 178 L290 143 L290 211 Z",

            detalles:
                "M133 85 Q146 97 133 109 " +
                "M188 166 Q174 178 188 190 " +
                "M94 89 L94 89 " +
                "M229 170 L229 170 " +
                "M164 96 Q188 111 195 142 " +
                "Q202 161 156 178"
        },

        // 11. CAPRICORNIO
        {
            id: "capricornio",
            emoji: "🐐",
            nombre: "Capricornio, la cabrita",
            significado: "Perseverancia y pequeños logros.",

            trazo:
                "M121 115 " +
                "C82 100 70 64 98 42 " +
                "C112 30 134 43 129 65 " +
                "Q125 84 114 91 " +
                "Q160 104 206 91 " +
                "Q195 84 191 65 " +
                "C186 43 208 30 222 42 " +
                "C250 64 238 100 199 115 " +
                "Q207 162 185 190 " +
                "L160 231 L135 190 " +
                "Q113 162 121 115 Z",

            detalles:
                "M129 128 Q160 112 191 128 " +
                "M139 153 Q146 145 152 153 " +
                "M168 153 Q174 145 181 153 " +
                "M148 177 L172 177 L160 188 Z " +
                "M160 190 L160 218"
        },

        // 12. SAGITARIO
        {
            id: "sagitario",
            emoji: "🐴",
            nombre: "Sagitario, el caballito",
            significado: "Libertad y curiosidad.",

            trazo:
                "M107 202 " +
                "Q91 159 113 129 " +
                "L104 94 Q107 62 133 56 " +
                "L142 30 L169 69 " +
                "L187 45 L199 91 " +
                "Q228 103 248 133 " +
                "L239 154 L204 151 " +
                "Q198 180 216 219 " +
                "L167 226 Q146 200 131 218 Z",

            detalles:
                "M130 103 Q157 90 189 107 " +
                "M190 119 Q197 115 204 124 " +
                "M215 145 Q225 143 231 149 " +
                "M135 131 Q157 150 164 185 " +
                "M103 94 L80 70"
        },

        // 13. CONEJITO LUNAR
        {
            id: "conejo",
            emoji: "🐇",
            nombre: "Conejito lunar",
            significado: "Ternura, creatividad y nuevos comienzos.",

            trazo:
                "M123 108 " +
                "Q83 40 105 23 " +
                "Q125 13 144 97 " +
                "Q170 18 188 27 " +
                "Q210 43 174 112 " +
                "C213 128 225 165 203 193 " +
                "Q183 218 160 218 " +
                "Q137 218 117 193 " +
                "C95 165 107 128 123 108 Z",

            detalles:
                "M130 135 Q139 128 147 138 " +
                "M173 138 Q181 128 190 135 " +
                "M151 163 L169 163 L160 171 Z " +
                "M160 171 Q150 181 141 174 " +
                "M160 171 Q170 181 179 174 " +
                "M120 168 L85 164 " +
                "M200 168 L235 164"
        },

        // 14. DRAGÓN DE LUZ
        {
            id: "dragon",
            emoji: "🐉",
            nombre: "Dragón de luz",
            significado: "Imaginación, energía y renovación.",

            trazo:
                "M59 202 " +
                "Q79 172 116 192 " +
                "Q157 228 196 191 " +
                "C235 156 212 126 185 138 " +
                "Q158 147 149 117 " +
                "Q134 90 163 66 " +
                "L173 32 L193 58 " +
                "L219 36 L215 79 " +
                "L248 94 L265 115 " +
                "L241 128 L218 119 " +
                "C234 164 270 218 226 238 " +
                "Q179 259 140 223 " +
                "Q101 188 59 202 Z",

            detalles:
                "M185 88 Q191 84 198 89 " +
                "M233 104 L239 104 " +
                "M161 116 Q136 130 120 121 " +
                "M174 180 L150 164 L161 193 " +
                "M203 187 L223 163 L222 207"
        }
    ];

    // ================================================
    // 4. CATÁLOGO Y FIGURA ACTIVA
    // ================================================

    const catalogo = Object.fromEntries(
        figuras.map(figura => [figura.id, figura])
    );

    let visible = catalogo[cielo.figura_activa]
        ? cielo.figura_activa
        : "corazon";

    // ================================================
    // 5. CREAR ELEMENTOS SVG
    // ================================================

    function svg(tipo, atributos = {}) {
        const elemento = document.createElementNS(NS, tipo);

        for (const [nombre, valor] of Object.entries(atributos)) {
            elemento.setAttribute(nombre, String(valor));
        }

        return elemento;
    }

    // ================================================
    // 6. CREAR ESTRELLAS
    // ================================================

    function crearEstrella(x, y, radio, encendida) {
        const puntos = [];

        for (let n = 0; n < 10; n++) {
            const angulo = -Math.PI / 2 + Math.PI / 5 * n;
            const r = n % 2 === 0 ? radio : radio * 0.45;

            const px = x + Math.cos(angulo) * r;
            const py = y + Math.sin(angulo) * r;

            puntos.push(`${px},${py}`);
        }

        return svg("polygon", {
            points: puntos.join(" "),
            class: encendida
                ? "estrella-encendida"
                : "estrella-apagada"
        });
    }

    // ================================================
    // 7. CREAR DESTELLOS DE CELEBRACIÓN
    // ================================================

    function agregarDestellos(figura, ruta, longitud) {
        const color = colores[figura.id] || "#d7b8ef";

        for (let i = 0; i < 20; i++) {
            const punto = ruta.getPointAtLength(
                longitud * (i + 0.3) / 20
            );

            const angulo = i * Math.PI * 2 / 20;

            const chispa = svg("circle", {
                cx: punto.x,
                cy: punto.y,
                r: 2 + i % 3,
                fill: i % 3 === 0 ? color : "#fff1c3",
                class: "chispa-final"
            });

            chispa.style.setProperty(
                "--dx",
                `${Math.cos(angulo) * 29}px`
            );

            chispa.style.setProperty(
                "--dy",
                `${Math.sin(angulo) * 29}px`
            );

            chispa.style.setProperty(
                "--retardo",
                `${(i % 8) * 0.08}s`
            );

            mapa.appendChild(chispa);
        }
    }

    // ================================================
    // 8. DIBUJAR UNA CONSTELACIÓN
    // ================================================

    function dibujar(figura, cantidad, esPrevia) {
        mapa.replaceChildren();

        mapa.setAttribute("viewBox", "0 0 320 270");

        mapa.setAttribute(
            "aria-label",
            `${figura.nombre}: ${cantidad} de 8 estrellas encendidas`
        );

        // ESTRELLAS DECORATIVAS DEL FONDO

        for (let i = 0; i < 34; i++) {
            const x = 12 + (i * 83) % 294;
            const y = 10 + (i * 113) % 245;

            mapa.appendChild(
                svg("circle", {
                    cx: x,
                    cy: y,
                    r: i % 4 === 0 ? 1.5 : 0.8,
                    fill: "#ffffff",
                    opacity: 0.48
                })
            );
        }

        // SILUETA TENUE DE LA FIGURA

        const guia = svg("path", {
            d: figura.trazo,
            fill: "none",
            stroke: "#f1dcff",
            "stroke-width": 3,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-dasharray": "4 8",
            opacity: 0.6,
            class: "linea-guia"
        });

        mapa.appendChild(guia);

        // RELLENO FINAL CON ANIMACIÓN
        // Solo se agrega si la figura ya tiene 8 estrellas.

        if (cantidad === META) {
            const relleno = svg("path", {
                d: figura.trazo,
                fill: colores[figura.id] || "#d7b8ef",
                stroke: "none",
                class: "relleno-final"
            });

            mapa.appendChild(relleno);
        }

        // OJOS Y DETALLES

        const detalles = svg("path", {
            d: figura.detalles,
            fill: "none",
            stroke: "#f5dbf4",
            "stroke-width": 2.7,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            opacity: cantidad === META
                ? 0.95
                : esPrevia
                    ? 0.55
                    : 0.32,
            class: "detalles-figura"
        });

        mapa.appendChild(detalles);

        // CONTORNO ILUMINADO

        const avance = svg("path", {
            d: figura.trazo,
            fill: "none",
            stroke: "#ffe5a3",
            "stroke-width": 4.5,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            class: cantidad === META
                ? "linea-encendida trazo-final"
                : "linea-encendida"
        });

        mapa.appendChild(avance);

        const longitud = avance.getTotalLength();
        const iluminado = longitud * cantidad / META;

        // MOSTRAR PROGRESO DEL TRAZO

        if (cantidad === 0) {
            avance.style.display = "none";
        } else {
            avance.setAttribute(
                "stroke-dasharray",
                `${iluminado} ${longitud + 1}`
            );
        }

        // UBICAR LAS 8 ESTRELLAS

        for (let i = 0; i < META; i++) {
            const punto = avance.getPointAtLength(
                longitud * (i + 1) / META
            );

            mapa.appendChild(
                crearEstrella(
                    punto.x,
                    punto.y,
                    i < cantidad ? 9 : 6.5,
                    i < cantidad
                )
            );
        }

        // CELEBRACIÓN FINAL

        if (cantidad === META) {
            agregarDestellos(figura, avance, longitud);
        }

        // BOTÓN PARA REPETIR ANIMACIÓN

        let repetir = document.getElementById(
            "repetir-animacion"
        );

        if (!repetir) {
            repetir = document.createElement("button");
            repetir.id = "repetir-animacion";
            repetir.type = "button";
            repetir.className = "boton-elegir boton-repetir";
            repetir.textContent = "✨ Volver a ver la animación";

            repetir.addEventListener("click", () => {
                const figuraActual = catalogo[visible];

                if (!figuraActual) return;

                const descubierta =
                    cielo.descubiertas.includes(visible);

                const activa =
                    cielo.figura_activa === visible;

                if (descubierta || (
                    activa && Number(cielo.progreso) >= META
                )) {
                    dibujar(figuraActual, META, false);
                }
            });

            const tarjeta = mapa.closest(".tarjeta-cielo");

            if (tarjeta) {
                tarjeta.appendChild(repetir);
            }
        }

        repetir.hidden = cantidad !== META;
    }

    // ================================================
    // 9. GALERÍA DE LAS 14 FIGURAS
    // ================================================

    function dibujarGaleria() {
        galeria.replaceChildren();

        for (const figura of figuras) {
            const descubierta =
                cielo.descubiertas.includes(figura.id);

            const activa =
                cielo.figura_activa === figura.id &&
                !descubierta;

            const tarjeta = document.createElement("button");
            tarjeta.type = "button";

            tarjeta.className =
                "tarjeta-figura" +
                (visible === figura.id ? " seleccionada" : "");

            tarjeta.setAttribute(
                "aria-pressed",
                String(visible === figura.id)
            );

            const icono = document.createElement("span");
            icono.className = "figura-emoji";
            icono.textContent = figura.emoji;

            const contenido = document.createElement("span");

            const nombre = document.createElement("strong");
            nombre.textContent = figura.nombre;

            const estado = document.createElement("small");

            if (descubierta) {
                estado.textContent = "✨ Descubierta";
            } else if (activa) {
                estado.textContent = "⭐ En construcción";
            } else {
                estado.textContent = "🌙 Por descubrir";
            }

            contenido.append(nombre, estado);
            tarjeta.append(icono, contenido);

            tarjeta.addEventListener("click", () => {
                visible = figura.id;

                if (mensaje) {
                    mensaje.textContent = "";
                }

                actualizar();
            });

            galeria.appendChild(tarjeta);
        }
    }

    // ================================================
    // 10. ACTUALIZAR PANTALLA Y PROGRESO
    // ================================================

    function actualizar() {
        const figura = catalogo[visible];

        if (!figura) return;

        const descubierta =
            cielo.descubiertas.includes(figura.id);

        const activa =
            cielo.figura_activa === figura.id &&
            !descubierta;

        const cantidad = descubierta
            ? META
            : activa
                ? Math.min(
                    META,
                    Math.max(0, Number(cielo.progreso) || 0)
                )
                : 0;

        const previa = !descubierta && !activa;

        const nombreFigura =
            document.getElementById("nombre-figura");

        if (nombreFigura) {
            nombreFigura.textContent =
                `${figura.emoji} ${figura.nombre}`;
        }

        const significado =
            document.getElementById("significado-figura");

        if (significado) {
            significado.textContent = figura.significado;
        }

        const totalEstrellas =
            document.getElementById("total-estrellas");

        if (totalEstrellas) {
            totalEstrellas.textContent =
                cielo.estrellas_total ?? 0;
        }

        const totalFiguras =
            document.getElementById("total-figuras");

        if (totalFiguras) {
            totalFiguras.textContent =
                cielo.constelaciones ?? 0;
        }

        // PROGRESO

        const textoProgreso =
            document.getElementById("texto-progreso");

        if (textoProgreso) {
            if (descubierta) {
                textoProgreso.textContent =
                    "🌟 Constelación completada";
            } else if (previa) {
                textoProgreso.textContent =
                    "✨ Vista previa de la constelación";
            } else {
                textoProgreso.textContent =
                    `${cantidad} de 8 estrellas`;
            }
        }

        const relleno =
            document.getElementById("relleno-estrellas");

        if (relleno) {
            relleno.style.width =
                `${cantidad / META * 100}%`;
        }

        const estado =
            document.getElementById("estado-figura");

        if (estado) {
            estado.textContent = descubierta
                ? "¡Completaste esta constelación! " +
                  "Sus estrellas siempre serán tuyas."
                : previa
                    ? "Esta es una vista previa. " +
                      "Elígela para empezar a iluminarla."
                    : "Cada nueva estrella ilumina " +
                      "otra parte de tu constelación.";
        }

        const barra =
            document.querySelector(".barra-estrellas");

        if (barra) {
            barra.setAttribute(
                "aria-valuenow",
                String(cantidad)
            );
            barra.setAttribute(
                "aria-valuemax",
                String(META)
            );
        }

        // BOTÓN PARA SELECCIONAR

        elegir.hidden = descubierta || activa;

        // DIBUJAR

        dibujar(figura, cantidad, previa);
        dibujarGaleria();
    }

    // ================================================
    // 11. GUARDAR ELECCIÓN EN FLASK
    // ================================================

    elegir.addEventListener("click", async () => {
        elegir.disabled = true;

        if (mensaje) {
            mensaje.textContent = "Guardando tu elección... ✨";
        }

        try {
            const respuesta = await fetch(
                "/api/constelacion/seleccionar",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrf
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        codigo: visible
                    })
                }
            );

            if (respuesta.status === 401) {
                window.location.href = "/";
                return;
            }

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    resultado.mensaje ||
                    "No se pudo guardar tu elección."
                );
            }

            if (!resultado.cielo) {
                throw new Error(
                    "El servidor no devolvió los datos del cielo."
                );
            }

            cielo = resultado.cielo;

            cielo.descubiertas =
                Array.isArray(cielo.descubiertas)
                    ? cielo.descubiertas
                    : [];

            if (mensaje) {
                mensaje.textContent =
                    "¡Elegiste tu constelación! 💜";
            }

            actualizar();

        } catch (error) {
            if (mensaje) {
                mensaje.textContent = error.message;
            }

            console.error(
                "CONTIGO: error al elegir constelación",
                error
            );

        } finally {
            elegir.disabled = false;
        }
    });

    // ================================================
    // 12. INICIAR
    // ================================================

    actualizar();

    console.log(
        "CONTIGO: 14 constelaciones cargadas correctamente."
    );
});
