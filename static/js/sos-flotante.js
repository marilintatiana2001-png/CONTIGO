document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "contigo_sos_posicion_v1";

    // Si ya existe un botón SOS en la página, lo reutilizamos; si no, lo creamos
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
    }

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
        } catch (e) {
            // Si hay error leyendo localStorage, se mantiene la posición CSS por defecto
        }
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

        // Si ya tienes un modal o función propia de SOS, llámala aquí; si no, redirige a red de apoyo
        if (typeof window.abrirModalSos === "function") {
            window.abrirModalSos();
        } else {
            window.location.href = "/red-apoyo";
        }
    });

    window.addEventListener("resize", () => {
        if (!btn.style.left || !btn.style.top) return;
        const rect = btn.getBoundingClientRect();
        const ajustada = limitarDentroDePantalla(rect.left, rect.top);
        btn.style.left = `${ajustada.left}px`;
        btn.style.top = `${ajustada.top}px`;
    });
});