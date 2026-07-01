// Sydney, Layered service worker — enables install + basic offline (network-first, cache fallback).
const CACHE = "sl-v14";
const CORE = [
  "./", "index.html", "app.js", "geo.js", "style.css", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png",
  "data/stories.geojson", "data/buildings.geojson", "data/people.geojson",
  "data/streets.geojson", "data/dossiers.json", "data/tours.json", "data/suburbs.json",
  "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js",
  "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css"
];
self.addEventListener("message", (e) => { if (e.data === "skip-waiting") self.skipWaiting(); });
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(CORE.map((u) => c.add(u)))));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && (req.url.startsWith(self.location.origin) || req.url.includes("maplibre-gl"))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
