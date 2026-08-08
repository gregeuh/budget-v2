// Service worker minimal : cache des ressources statiques, réseau d'abord pour le reste.
const CACHE = "budget-v2-6";
const STATIQUES = ["/", "/transactions", "/comptes", "/budgets", "/statistiques", "/conseils", "/reglages", "/offline.html", "/manifest.json", "/pecule-mark.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIQUES).catch(() => c.addAll(["/offline.html", "/manifest.json", "/pecule-mark.svg"]))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  // Les pages HTML passent toujours par le réseau (cache uniquement en secours hors-ligne).
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then((rep) => {
      const copie = rep.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copie));
      return rep;
    }).catch(() => caches.match(e.request).then((rep) => rep || caches.match("/offline.html"))));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((rep) => {
        if (rep.ok && url.origin === location.origin) {
          const copie = rep.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copie));
        }
        return rep;
      })
      .catch(() => caches.match(e.request))
  );
});
