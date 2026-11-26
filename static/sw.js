/* ==========================================
   CONTIGO - SERVICE WORKER
   PWA - RECURSOS PÚBLICOS (PC, MÓVIL, TABLET)
========================================== */

"use strict";

const CACHE_NAME = "contigo-pwa-publico-v2";

const ARCHIVOS_PUBLICOS = [
    "/static/manifest.webmanifest",
    "/static/css/estilos.css",
    "/static/css/responsive.css",
    "/static/img/logo-contigo.jpeg",
    "/static/img/icono-contigo-192.png",
    "/static/img/icono-contigo-512.png"
];

// INSTALACIÓN

self.addEventListener("install", (evento) => {

    evento.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ARCHIVOS_PUBLICOS);
            })
            .then(() => self.skipWaiting())
    );

});

// ACTIVACIÓN

self.addEventListener("activate", (evento) => {

    evento.waitUntil(
        caches.keys()
            .then((nombres) => {
                return Promise.all(
                    nombres
                        .filter((nombre) =>
                            nombre.startsWith("contigo-pwa-publico-") &&
                            nombre !== CACHE_NAME
                        )
                        .map((nombre) => caches.delete(nombre))
                );
            })
            .then(() => self.clients.claim())
    );

});

// SOLICITUDES DE RECURSOS PÚBLICOS

self.addEventListener("fetch", (evento) => {

    if (evento.request.method !== "GET") {
        return;
    }

    const url = new URL(evento.request.url);

    // Solo intercepta archivos públicos estáticos; las rutas de Flask van directo al servidor
    if (
        url.origin !== self.location.origin ||
        !ARCHIVOS_PUBLICOS.includes(url.pathname)
    ) {
        return;
    }

    evento.respondWith(
        caches.match(evento.request)
            .then((guardado) => {
                return guardado || fetch(evento.request);
            })
    );

});