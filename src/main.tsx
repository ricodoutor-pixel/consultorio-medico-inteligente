import { createRoot } from "react-dom/client";
import { initAntiClone } from "./lib/anti-clone";
import { registerServiceWorker } from "./lib/serviceWorkerRegistration";
import "./lib/i18n"; // Initialize i18next before App
import App from "./App.tsx";
import { CustomLoader } from "./components/CustomLoader";
import "./index.css";

// ───────────────────────────────────────────────────────────────
// 🛡️ Production safety: validate critical env vars BEFORE mount
// Prevents "tela escura" on plantayraiz.com.br when build env
// is missing VITE_SUPABASE_* (e.g. Hostinger deploy without env).
// ───────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "[Planta y Raiz] Missing Supabase env vars. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in production."
  );
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0e1a;color:#fff;font-family:Inter,sans-serif;padding:2rem;text-align:center;">
        <div style="max-width:480px;">
          <h1 style="font-size:1.75rem;margin-bottom:1rem;color:#10B981;">🌿 Planta y Raiz</h1>
          <p style="opacity:.85;margin-bottom:1rem;">Estamos finalizando a configuração do servidor. Atualize a página em alguns instantes.</p>
          <button onclick="location.reload()" style="background:#10B981;color:#000;border:0;padding:.75rem 1.5rem;border-radius:.75rem;font-weight:700;cursor:pointer;">Recarregar</button>
        </div>
      </div>`;
  }
  throw new Error("Missing Supabase configuration");
}

// Inicializa proteções anti-clonagem ANTES do React
try {
  initAntiClone();
} catch (e) {
  console.warn("[anti-clone] init failed:", e);
}

// PWA: Guard against service workers in preview/iframe contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

// 🚨 MOBILE FIX: Limpa SWs/caches antigos SEMPRE antes de registrar o novo.
// Mobile (iOS Safari + Android Chrome) costuma manter SWs zumbis que servem
// HTML stale apontando para bundles JS que não existem mais → tela escura.
async function cleanStaleServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    // Em preview/iframe: remove tudo e sai
    if (isPreviewHost || isInIframe) {
      await Promise.all(regs.map((r) => r.unregister()));
      return;
    }
    // Em produção: remove caches antigos que não batem com a versão atual
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.includes('plantayraiz-v2.0'))
          .map((k) => caches.delete(k))
      );
    }
  } catch (e) {
    console.warn('[PWA] cleanup failed:', e);
  }
}

cleanStaleServiceWorkers().then(() => {
  if (!isPreviewHost && !isInIframe) {
    registerServiceWorker();
  }
});

// 🛡️ Failsafe global: erros não tratados no boot não devem deixar tela preta
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Promise]', e.reason);
});

createRoot(document.getElementById("root")!).render(
  <>
    <CustomLoader />
    <App />
  </>
);
