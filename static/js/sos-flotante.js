document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "contigo_sos_posicion_v1";

    // Elimina cualquier #btn-sos-flotante viejo si existiera de versiones anteriores
    const btnViejo = document.getElementById("btn-sos-flotante");
    if (btnViejo) {
        btnViejo.remove();
    }

    let arrastrando = false;
    let seMovio = false;
    let inicioX = 0;
    let inicioY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let btnActual = null;

    function limitarDentroDePantalla(btn, left, top) {
        const rect = btn.getBoundingClientRect();
        const margen = 10;
        const maxLeft = Math.max(margen, window.innerWidth - rect.width - margen);
        const maxTop = Math.max(margen, window.innerHeight - rect.height - margen);

        return {
            left: Math.min(Math.max(margen, left), maxLeft),
            top: Math.min(Math.max(margen, top), maxTop),
        };
    }

    function aplicarPosicionGuardada(btn) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const pos = JSON.parse(raw);
            if (typeof pos.left === "number" && typeof pos.top === "number") {
                const ajustada = limitarDentroDePantalla(btn, pos.left, pos.top);
                btn.style.left = `${ajustada.left}px`;
                btn.style.top = `${ajustada.top}px`;
                btn.style.right = "auto";
                btn.style.bottom = "auto";
            }
        } catch (_) {}
    }

    function inicializarBotonSos(btn) {
        if (!btn || btn.dataset.sosArrastrableListo === "1") return;
        btn.dataset.sosArrastrableListo = "1";
        btnActual = btn;

        btn.style.position = "fixed";
        btn.style.zIndex = "9999";
        btn.style.touchAction = "none";
        btn.style.userSelect = "none";
        btn.style.webkitUserSelect = "none";
        btn.style.cursor = "grab";

        aplicarPosicionGuardada(btn);

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
            btn.style.cursor = "grabbing";
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

            const ajustada = limitarDentroDePantalla(btn, e.clientX - offsetX, e.clientY - offsetY);
            btn.style.left = `${ajustada.left}px`;
            btn.style.top = `${ajustada.top}px`;
        });

        function finalizarArrastre(e) {
            if (!arrastrando) return;
            arrastrando = false;
            btn.style.cursor = "grab";
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

        // Fase de captura: si hubo arrastre, bloquea el clic para que no abra el modal sin querer;
        // si fue solo toque/clic, deja pasar el evento normal que abre el modal de líneas
        btn.addEventListener(
            "click",
            (e) => {
                if (seMovio) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    seMovio = false;
                }
            },
            true
        );
    }

    function buscarYActivar() {
        const btnReal = document.getElementById("contigo-sos-btn");
        if (btnReal) {
            inicializarBotonSos(btnReal);
        }
    }

    buscarYActivar();

    const observador = new MutationObserver(() => {
        buscarYActivar();
    });
    observador.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", () => {
        if (!btnActual || !btnActual.style.left || !btnActual.style.top) return;
        const rect = btnActual.getBoundingClientRect();
        const ajustada = limitarDentroDePantalla(btnActual, rect.left, rect.top);
        btnActual.style.left = `${ajustada.left}px`;
        btnActual.style.top = `${ajustada.top}px`;
    });
});