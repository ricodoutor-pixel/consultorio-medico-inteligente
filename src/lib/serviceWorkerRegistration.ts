/**
 * 🐸 Planta y Raiz — Service Worker Registration
 * Registro, atualização e comunicação com o SW
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker não suportado neste navegador.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Sempre buscar SW atualizado
    });

    console.log('[PWA] Service Worker registrado com sucesso.');

    // Verificar atualizações a cada 30 minutos
    setInterval(() => {
      registration.update();
      console.log('[PWA] Verificando atualizações do Service Worker...');
    }, 30 * 60 * 1000);

    // Quando uma nova versão for encontrada, ativar imediatamente
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          console.log('[PWA] Nova versão do app ativada!');
        }
      });
    });

    // Listener para mensagens do SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'ICON_UPDATED') {
        console.log('[PWA] Ícone atualizado para mood:', event.data.mood);
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Erro ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Notifica o SW para atualizar o ícone dinâmico do sapo
 */
export function updateFrogIcon(mood: 'happy' | 'warning' | 'critical' | 'in_call'): void {
  if (!navigator.serviceWorker?.controller) return;

  navigator.serviceWorker.controller.postMessage({
    type: 'UPDATE_ICON',
    mood
  });

  // Cache busting: força reload do manifest link
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    const baseHref = '/manifest.json';
    (manifestLink as HTMLLinkElement).href = `${baseHref}?v=${Date.now()}`;
  }

  console.log(`[PWA] Ícone do Verdinho atualizado: ${mood}`);
}

/**
 * Verifica se o app está instalado como PWA
 */
export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}
