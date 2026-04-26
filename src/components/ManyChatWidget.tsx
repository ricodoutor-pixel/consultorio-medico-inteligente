import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Floating ManyChat / WhatsApp widget.
 * Lazy-injects the ManyChat embed script, defers loading until idle so it
 * does NOT block first paint on Android. Forwards the user's selected locale
 * via the `mcLocale` query param so Brisa can answer in the right language.
 */
export const ManyChatWidget = () => {
  const { locale } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("manychat-widget-script")) return;

    const inject = () => {
      const s = document.createElement("script");
      s.id = "manychat-widget-script";
      s.async = true;
      s.defer = true;
      s.src = `https://widget.manychat.com/11227069.js?locale=${locale}`;
      document.body.appendChild(s);
    };

    // Defer injection until the browser is idle to keep TTI fast on Android.
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(inject);
    } else {
      setTimeout(inject, 1500);
    }
  }, [locale]);

  return null;
};

export default ManyChatWidget;
