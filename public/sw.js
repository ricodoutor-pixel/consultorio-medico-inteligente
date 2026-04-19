/**
 * 🐸 Planta y Raiz — Service Worker v3.1
 * Mobile hotfix: evita servir HTML antigo em Android/iOS.
 */

const STATIC_CACHE = 'plantayraiz-static-v3.1';
const RUNTIME_CACHE = 'plantayraiz-runtime-v3.1';

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/frog-happy.png',
  '/frog-warning.png',
  '/frog-critical.png',
  '/og-image.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v3.1...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker v3.1...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => ![STATIC_CACHE, RUNTIME_CACHE].includes(name))
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const accept = request.headers.get('accept') || '';

  if (!isSameOrigin) {
    if (url.pathname.includes('/rest/') || url.pathname.includes('/auth/') || url.pathname.includes('/functions/')) {
      event.respondWith(fetch(request));
    }
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document' || accept.includes('text/html')) {
    event.respondWith(networkFirst(request, false));
    return;
  }

  if (url.pathname === '/manifest.json' || /\/frog-(happy|warning|critical)\.png$/.test(url.pathname)) {
    event.respondWith(networkFirst(request, true, STATIC_CACHE));
    return;
  }

  if (['script', 'style', 'worker'].includes(request.destination)) {
    event.respondWith(networkFirst(request, true, RUNTIME_CACHE));
    return;
  }

  if (['image', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, true, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, shouldCache = true, cacheName = RUNTIME_CACHE) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (shouldCache && response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_ICON') {
    console.log('[SW] Recebido pedido de atualização de ícone:', event.data.mood);
    caches.open(STATIC_CACHE).then((cache) => {
      cache.delete('/manifest.json');
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'ICON_UPDATED',
            mood: event.data.mood
          });
        });
      });
    });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
