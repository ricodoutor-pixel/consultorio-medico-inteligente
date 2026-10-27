/**
 * 🐸 Planta y Raiz — Service Worker v2.0
 * Cache inteligente + atualização dinâmica de ícones
 * Protocolo: Cache-First com Network Fallback
 */

const CACHE_VERSION = 'plantayraiz-v3.3';
const DYNAMIC_CACHE = 'plantayraiz-dynamic-v2.6';

// Assets essenciais para cache imediato (apenas arquivos garantidamente existentes)
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/dr-verdinho-192.png',
  '/dr-verdinho-512.png',
  '/og-image.png'
];

// Instalação: pré-cacheia assets essenciais
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v2.0...');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // Um ícone indisponível não pode impedir a instalação inteira.
      .then((cache) => Promise.allSettled(PRECACHE_ASSETS.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting()) // Ativa imediatamente
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker v2.0...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('plantayraiz-') && name !== CACHE_VERSION && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim()) // Controla todas as abas abertas
  );
});

// Estratégia de Fetch: Network-First para documentos/HTML e API, Cache-First para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-GET
  if (request.method !== 'GET') return;

  // Ignorar requests externos (analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // HTML/documentos da SPA: SEMPRE priorizar rede para evitar shell antigo preso em cache
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // manifest.json: SEMPRE buscar da rede (cache busting de ícones)
  if (url.pathname === '/manifest.json') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Ícones do sapo: Network-First para atualização dinâmica
  if (url.pathname.match(/\/frog-(happy|warning|critical)\.png/)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // API/Supabase: Network-only
  if (url.pathname.includes('/rest/') || 
      url.pathname.includes('/auth/') ||
      url.pathname.includes('/functions/')) {
    event.respondWith(fetch(request));
    return;
  }

  // O hash muda a URL a cada versão: reaproveitar o arquivo exato é seguro.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(/-[a-zA-Z0-9_-]{8,}\.[^/]+$/.test(url.pathname)
      ? cacheFirst(request)
      : networkFirst(request));
    return;
  }

  // Demais assets estáticos: Cache-First com fallback para rede
  event.respondWith(cacheFirst(request));
});

// Cache-First: responde do cache, faz fetch em segundo plano
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    // Offline fallback
    return new Response('Offline', { status: 503 });
  }
}

// Network-First: busca na rede, cacheia, fallback para cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      if (request.method === 'GET') {
        await cache.put(request, response.clone()).catch(() => {});
      }
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Listener para mensagens do app (atualização dinâmica de ícone)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_ICON') {
    console.log('[SW] Recebido pedido de atualização de ícone:', event.data.mood);
    // Invalida cache do manifest para forçar re-fetch
    caches.open(CACHE_VERSION).then((cache) => {
      cache.delete('/manifest.json');
      // Notifica todos os clients que o ícone mudou
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

// Background Sync: verificar atualizações periódicas
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(
      caches.open(CACHE_VERSION).then((cache) => {
        // Força re-cache do manifest
        return cache.delete('/manifest.json').then(() =>
          cache.add('/manifest.json')
        );
      })
    );
  }
});
