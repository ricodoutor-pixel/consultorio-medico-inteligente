// Singleton loader para o script do Google Maps JS API.
// Garante que o script carregue UMA ÚNICA vez em toda a aplicação.
declare global {
  interface Window {
    google?: any;
    __pyrGmapsCb?: () => void;
  }
}

// Fallback order for the browser key:
// 1. VITE_GOOGLE_API_KEY — chave própria do domínio customizado (plantayraiz.com.br) com
//    HTTP referrers autorizados no Google Cloud Console.
// 2. VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY — chave gerenciada pela Lovable
//    (funciona somente em *.lovable.app / *.lovableproject.com).
const env = import.meta.env as any;
const BROWSER_KEY = (env.VITE_GOOGLE_API_KEY ||
  env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY) as string | undefined;
const TRACKING_ID = env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

let loaderPromise: Promise<typeof window.google> | null = null;

/**
 * Carrega o script do Google Maps JS API uma única vez.
 * Libraries: places, geometry, marker.
 */
export function loadGoogleMaps(): Promise<typeof window.google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps só pode ser carregado no browser"));
  }
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;
  if (!BROWSER_KEY) {
    return Promise.reject(
      new Error(
        "Google Maps key ausente: defina VITE_GOOGLE_API_KEY (custom domain) ou VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY (lovable.app).",
      ),
    );
  }

  loaderPromise = new Promise((resolve, reject) => {
    window.__pyrGmapsCb = () => resolve(window.google);
    const existing = document.querySelector<HTMLScriptElement>("script[data-pyr-gmaps]");
    if (existing) {
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar Google Maps")));
      return;
    }
    const s = document.createElement("script");
    s.dataset.pyrGmaps = "1";
    const ch = TRACKING_ID ? `&channel=${TRACKING_ID}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&libraries=places,geometry,marker&callback=__pyrGmapsCb${ch}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      loaderPromise = null;
      reject(new Error("Falha ao carregar Google Maps"));
    };
    document.head.appendChild(s);
  });

  return loaderPromise;
}

export const hasBrowserKey = () => Boolean(BROWSER_KEY);
