import { createRoot } from "react-dom/client";
import { initAntiClone } from "./lib/anti-clone";
import { registerServiceWorker } from "./lib/serviceWorkerRegistration";
import "./lib/i18n"; // Initialize i18next before App
import App from "./App.tsx";
import "./index.css";

// Inicializa proteções anti-clonagem ANTES do React
initAntiClone();

// 🔄 Recupera de chunks falhados (Hostinger 429 ou deploy invalidando hashes)
const RELOAD_KEY = "__pr_chunk_reload__";
const reloadOnce = () => {
  if (!sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, "1");
    console.warn("⚠️ Chunk falhou ao carregar. Recarregando…");
    window.location.reload();
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
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else {
  // Registrar Service Worker apenas em produção
  registerServiceWorker();
}

// Inicializa Sentry (não-bloqueante) — DSN vem do edge function sentry-config
import("./lib/sentry").then(({ initSentry }) => initSentry()).catch(() => {});

createRoot(document.getElementById("root")!).render(<App />);

