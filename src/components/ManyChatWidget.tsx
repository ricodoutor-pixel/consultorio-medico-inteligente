import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Floating ManyChat / WhatsApp widget.
 *
 * - Lazy-injects the ManyChat embed script (Widget ID: 11227069).
 * - Only loads AFTER the user has granted analytics/marketing consent
 *   (LGPD compliance — see CookieBanner -> window.updateConsent).
 * - Forwards the user's selected locale + flow token so Brisa can route
 *   conversations to the correct ManyChat flow.
 */

const MANYCHAT_WIDGET_ID = "11227069";
const MANYCHAT_FLOW_TOKEN = "c03b9e007a109e1c84d19ff83de4bcd2";

function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("cookie-consent");
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return parsed?.analytics_storage === "granted" || parsed?.ad_storage === "granted";
  } catch {
    return false;
  }
}

export const ManyChatWidget = () => {
  const { locale } = useLanguage();
  const [consent, setConsent] = useState<boolean>(hasMarketingConsent());

  // Re-check consent if the CookieBanner updates it after mount.
  useEffect(() => {
    if (consent) return;
    const handler = () => setConsent(hasMarketingConsent());
    window.addEventListener("consent-updated", handler);
    const interval = window.setInterval(handler, 2000);
    return () => {
      window.removeEventListener("consent-updated", handler);
      window.clearInterval(interval);
    };
  }, [consent]);

  // Inject the ManyChat script once consent is granted.
  useEffect(() => {
    if (!consent) return;
    if (typeof window === "undefined") return;
// ManyChat removed

    const inject = () => {
      const s = document.createElement("script");
// ManyChat removed
      s.async = true;
      s.defer = true;
      s.dataset.flowToken = MANYCHAT_FLOW_TOKEN;
// ManyChat removed
      document.body.appendChild(s);
    };

    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(inject);
    } else {
      setTimeout(inject, 1500);
    }
  }, [consent, locale]);

  // Bridge: when the user clicks any WhatsApp / Brisa CTA, sync the lead to
// ManyChat removed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = async (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest) return;
      const link = target.closest(
        'a[href*="wa.me"], a[href*="api.whatsapp.com"], [data-brisa-cta]'
      ) as HTMLElement | null;
      if (!link) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
// ManyChat removed
          body: {
            event_type: "whatsapp_click",
            user_id: user?.id,
            metadata: {
              source: "brisa_widget",
              href: link.getAttribute("href") || "",
              locale,
              flow_token: MANYCHAT_FLOW_TOKEN,
            },
          },
        });
      } catch (err) {
        // Silent — analytics tracking already fires from index.html
        console.warn("[ManyChat] lead sync failed", err);
      }
    };

    document.addEventListener("click", handler, { passive: true });
    return () => document.removeEventListener("click", handler);
  }, [locale]);

  return null;
};

export default ManyChatWidget;
