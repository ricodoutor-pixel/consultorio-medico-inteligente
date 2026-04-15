import { createRoot } from "react-dom/client";
import { initAntiClone } from "./lib/anti-clone";
import { registerServiceWorker } from "./lib/serviceWorkerRegistration";
import "./lib/i18n"; // Initialize i18next before App
import App from "./App.tsx";
import { CustomLoader } from "./components/CustomLoader";
import "./index.css";

// Inicializa proteções anti-clonagem ANTES do React
initAntiClone();

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

createRoot(document.getElementById("root")!).render(
  <>
    <CustomLoader />
    <App />
  </>
);
