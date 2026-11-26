document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "contigo_sos_posicion_v1";

    // Reutiliza el botón principal si ya existe o crea uno único
    let btn = document.getElementById("btn-sos-flotante") || document.querySelector("[data-sos-ayuda]");

    if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.id = "btn-sos-flotante";
        btn.setAttribute("aria-label", "SOS Ayuda");
        btn.innerHTML = `<span class="sos-badge">SOS</span><span>Ayuda</span>`;
        document.body.appendChild(btn);
    } else {
        btn.id = "btn-sos-flotante";
        if (btn.tagName === "BUTTON" && !btn.getAttribute("type")) {
            btn.setAttribute("type", "button");
        }
        if (!btn.getAttribute("aria-label")) {
            btn.setAttribute("aria-label", "SOS Ayuda");
        }
    }

    // Oculta cualquier botón o enlace SOS antiguo duplicado para que solo quede uno arrastrable
    document.querySelectorAll("button, a").forEach((el) => {
        if (el === btn) return;
        const texto = (el.textContent || "").trim().toLowerCase();
        const idMinuscula = (el.id || "").toLowerCase();
        const esSosDuplicado =
            texto === "sos ayuda" ||
            texto.startsWith("sos ayuda") ||
            (idMinuscula.includes("sos") && idMinuscula !== "btn-sos-flotante");

        if (esSosDuplicado) {
            el.style.setProperty("display", "none", "important");
        }
    });

    let arrastrando = false;
    let seMovio = false;
    let inicioX = 0;
    let inicioY = 0;
    let offsetX = 0;
    let offsetY = 0;

    function limitarDentroDePantalla(left, top) {
        const rect = btn.getBoundingClientRect();
        const margen = 10;
        const maxLeft = Math.max(margen, window.innerWidth - rect.width - margen);
        const maxTop = Math.max(margen, window.innerHeight - rect.height - margen);

        return {
            left: Math.min(Math.max(margen, left), maxLeft),
            top: Math.min(Math.max(margen, top), maxTop),
        };
    }

    function aplicarPosicionGuardada() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const pos = JSON.parse(raw);
            if (typeof pos.left === "number" && typeof pos.top === "number") {
                const ajustada = limitarDentroDePantalla(pos.left, pos.top);
                btn.style.left = `${ajustada.left}px`;
                btn.style.top = `${ajustada.top}px`;
                btn.style.right = "auto";
                btn.style.bottom = "auto";
            }
        } catch (_) {
            // Si no hay posición válida guardada, se respeta el CSS por defecto
        }
    }

    function abrirModalApoyoInmediato() {
        if (typeof window.abrirModalSos === "function") {
            window.abrirModalSos();
            return;
        }
        if (typeof window.abrirSos === "function") {
            window.abrirSos();
            return;
        }
        if (typeof window.mostrarModalSos === "function") {
            window.mostrarModalSos();
            return;
        }

        // Busca un modal SOS existente en el DOM si no hay función global expuesta
        const modalSos =
            document.getElementById("modal-sos") ||
            document.getElementById("sosModal") ||
            document.getElementById("modalSosAyuda") ||
            document.querySelector("[data-modal-sos]");

        if (modalSos) {
            modalSos.classList.remove("hidden", "oculto", "d-none");
            modalSos.classList.add("activo", "show", "open");
            modalSos.style.display = "flex";
            return;
        }

        window.location.href = "/red-apoyo";
    }

    aplicarPosicionGuardada();

    btn.addEventListener("pointerdown", (e) => {
        if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;

        const rect = btn.getBoundingClientRect();
        arrastrando = true;
        seMovio = false;
        inicioX = e.clientX;
        inicioY = e.clientY;
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        btn.style.left = `${rect.left}px`;
        btn.style.top = `${rect.top}px`;
        btn.style.right = "auto";
        btn.style.bottom = "auto";
        btn.classList.add("arrastrando");

        if (btn.setPointerCapture) {
            try {
                btn.setPointerCapture(e.pointerId);
            } catch (_) {}
        }
    });

    btn.addEventListener("pointermove", (e) => {
        if (!arrastrando) return;

        const dx = e.clientX - inicioX;
        const dy = e.clientY - inicioY;

        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
            seMovio = true;
        }

        if (!seMovio) return;

        const ajustada = limitarDentroDePantalla(e.clientX - offsetX, e.clientY - offsetY);
        btn.style.left = `${ajustada.left}px`;
        btn.style.top = `${ajustada.top}px`;
    });

    function finalizarArrastre(e) {
        if (!arrastrando) return;
        arrastrando = false;
        btn.classList.remove("arrastrando");

        if (btn.releasePointerCapture && e && e.pointerId !== undefined) {
            try {
                btn.releasePointerCapture(e.pointerId);
            } catch (_) {}
        }

        if (seMovio) {
            const rect = btn.getBoundingClientRect();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
            } catch (_) {}
        }
    }

    btn.addEventListener("pointerup", finalizarArrastre);
    btn.addEventListener("pointercancel", finalizarArrastre);

    btn.addEventListener("click", (e) => {
        if (seMovio) {
            e.preventDefault();
            e.stopPropagation();
            seMovio = false;
            return;
        }

        abrirModalApoyoInmediato();
    });

    window.addEventListener("resize", () => {
        if (!btn.style.left || !btn.style.top) return;
        const rect = btn.getBoundingClientRect();
        const ajustada = limitarDentroDePantalla(rect.left, rect.top);
        btn.style.left = `${ajustada.left}px`;
        btn.style.top = `${ajustada.top}px`;
    });
});