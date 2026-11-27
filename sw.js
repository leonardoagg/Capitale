const CACHE_NAME = "capitale-shell-v35";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./css/forms.css",
  "./css/controls.css",
  "./css/editing.css",
  "./css/month.css",
  "./css/modal.css",
  "./css/chart.css",
  "./js/app.js",
  "./js/db/database.js",
  "./js/db/schema.js",
  "./js/domain/money.js",
  "./js/domain/date.js",
  "./js/domain/validation.js",
  "./js/domain/movements.js",
  "./js/domain/wealth.js",
  "./js/backup/backup.js",
  "./js/backup/crypto.js",
  "./js/backup/csv.js",
  "./js/security/pin.js",
  "./js/ui/shell.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => key.startsWith("capitale-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || (event.request.mode === "navigate" ? caches.match("./index.html") : undefined)).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && new URL(event.request.url).pathname.startsWith(self.registration.scope.replace(self.location.origin, ""))) {
        const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : Response.error()))
  );
});
