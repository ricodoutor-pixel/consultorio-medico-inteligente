import { createRoot } from "react-dom/client";
import { initAntiClone } from "./lib/anti-clone";
import { registerServiceWorker } from "./lib/serviceWorkerRegistration";
import { devlog } from "./lib/devlog";
import "./lib/i18n"; // Initialize i18next before App
import App from "./App.tsx";
import "./index.css";

// 🔇 Silenciar console.log/info/debug/warn em produção (credibilidade técnica).
// console.error é mantido para que Sentry/observability capturem erros reais.
// Opt-out: ?debug=1 na URL ou localStorage.PR_DEBUG === "1".
if (import.meta.env.PROD) {
  const debugForced =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("debug") === "1" ||
      window.localStorage?.getItem("PR_DEBUG") === "1");
  if (!debugForced) {
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    console.warn = noop;
  }
}


// Inicializa proteções anti-clonagem ANTES do React
initAntiClone();

// 🔄 Recupera de chunks falhados (Hostinger 429 ou deploy invalidando hashes)
const RELOAD_KEY = "__pr_chunk_reload__";
const clearRuntimeCaches = async () => {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs ?? []).map((reg) => reg.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch {
    // noop
  }
};
const reloadOnce = () => {
  if (!sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, "1");
    devlog.warn("⚠️ Chunk falhou ao carregar. Recarregando…");
    void clearRuntimeCaches().finally(() => window.location.reload());
  }
};
window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); reloadOnce(); });
window.addEventListener("error", (e) => {
  const m = e.message || "";
  if (m.includes("Failed to fetch dynamically imported module") ||
      m.includes("Importing a module script failed")) reloadOnce();
});
window.addEventListener("load", () => {
  setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 5000);
});

// PWA: Guard against service workers in preview/iframe contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const host = window.location.hostname;
const isPreviewHost =
  host.startsWith("id-preview--") ||
  host.startsWith("preview--") ||
  host === "lovableproject.com" || host.endsWith(".lovableproject.com") ||
  host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com") ||
  host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev") ||
  new URLSearchParams(window.location.search).get("sw") === "off";

if (isPreviewHost || isInIframe || !import.meta.env.PROD) {
  // Nunca registra SW em preview/iframe/dev — e limpa registros antigos.
  void (async () => {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    } catch {
      /* documento em estado inválido dentro do iframe — ignorar */
    }
  })();
} else {
  // Registrar Service Worker apenas em produção
  void Promise.resolve(registerServiceWorker()).catch(() => {});
}


// Inicializa Sentry (não-bloqueante) — DSN vem do edge function sentry-config
import("./lib/sentry").then(({ initSentry }) => initSentry()).catch(() => {});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz da aplicação não encontrado");
}

rootElement.dataset.reactMounted = "1";
createRoot(rootElement).render(<App />);

