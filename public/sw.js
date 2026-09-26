// Bump this cache version for each production app release so installed PWAs detect a new worker.
const CACHE_NAME = 'admin-hub-games-v26';
const CORE_ASSETS = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.svg', '/icons/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('admin-hub-games-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => { if (response.ok) { const copy = response.clone(); void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); } return response; }).catch(() => caches.match(request).then((cached) => cached || caches.match('/'))));
    return;
  }
  const destination = request.destination;
  const cacheable = destination === 'script' || destination === 'style' || destination === 'image' || destination === 'font' || destination === 'audio' || request.url.endsWith('.json') || request.url.endsWith('.webmanifest');
  if (!cacheable) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok) { const copy = response.clone(); void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); } return response; })));
});
