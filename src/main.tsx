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

// 🛡️ Mobile safety: ALWAYS purge stale service workers + caches on every load.
// This prevents the #1 cause of "tela escura" on mobile: an old SW serving a
// broken cached build. After purge, only re-register in real production.
(async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      // Force unregister stale workers (cache busting)
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      // Drop old plantayraiz caches (kept names like plantayraiz-v2.0)
      await Promise.all(
        keys
          .filter((k) => k.startsWith("plantayraiz-"))
          .map((k) => caches.delete(k))
      );
    }
  } catch (e) {
    console.warn("[sw-cleanup] failed:", e);
  }

  if (!isPreviewHost && !isInIframe) {
    // Re-register only on real production domain (not iframe/preview)
    registerServiceWorker();
  }
})();

createRoot(document.getElementById("root")!).render(
  <>
    <CustomLoader />
    <App />
  </>
);
