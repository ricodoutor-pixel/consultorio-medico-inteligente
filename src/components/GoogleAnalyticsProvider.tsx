/**
 * GoogleAnalyticsProvider — envia page_view ao GA4 em cada troca de rota (SPA).
 * O script do GA só existe depois do consentimento LGPD (index.html), então
 * aqui apenas disparamos o evento quando gtag já está disponível.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { APP_CONFIG } from "@/lib/app-config";

type GtagFn = (...args: unknown[]) => void;

export function GoogleAnalyticsProvider() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) return;

    const send = () => {
      const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
      if (typeof gtag !== "function") return false;
      gtag("event", "page_view", {
        send_to: APP_CONFIG.GOOGLE_ANALYTICS_ID,
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      });
      lastPath.current = path;
      return true;
    };

    if (send()) return;

    // gtag ainda não carregou (consentimento pendente): tenta novamente por até 15s
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (send() || tries > 30) window.clearInterval(id);
    }, 500);
    return () => window.clearInterval(id);
  }, [location.pathname, location.search]);

  return null;
}
