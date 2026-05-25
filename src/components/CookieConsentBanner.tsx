import { useState, useEffect, useCallback } from "react";
import { Shield, Check, Cookie, BarChart3, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const COOKIE_KEY = "plr_cookie_consent";
const CONSENT_VERSION = "1.0";

interface ConsentRecord {
  version: string;
  accepted_at: string;
  categories: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
  };
  ip_hint?: string;
}

/**
 * Cookie Consent Banner — LGPD Compliant
 *
 * Funções jurídicas:
 * 1. Blindagem LGPD — consentimento formal para dados sensíveis (médicos/receitas).
 * 2. Memória do paciente — cookies preservam triagem, cupons, sessão.
 * 3. Inteligência de vendas — habilita Meta Pixel, CAPI e remarketing.
 *
 * O consentimento é armazenado com timestamp ISO-8601 e versão para auditoria.
 */
export const CookieConsentBanner = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const isDenseCatalogRoute = location.pathname.startsWith("/biblioteca");
  const isPlansRoute = location.pathname === "/planos" || location.pathname === "/precos";
  const isSaudeVerdeRoute = location.pathname.startsWith("/saude-verde") || location.pathname === "/cartao-saude";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY);
      if (stored) {
        const parsed: ConsentRecord = JSON.parse(stored);
        // Re-ask if consent version changed
        if (parsed.version === CONSENT_VERSION) return;
      }
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    } catch {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = useCallback(() => {
    setExiting(true);

    const consent: ConsentRecord = {
      version: CONSENT_VERSION,
      accepted_at: new Date().toISOString(),
      categories: {
        essential: true,
        analytics: true,
        marketing: true,
        personalization: true,
      },
    };

    setTimeout(() => {
      localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
      setVisible(false);

      // Integrar com GTM Consent Mode v2 via função global definida no index.html
      if (typeof (window as any).updateConsent === "function") {
        (window as any).updateConsent({
          analytics_storage: "granted",
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
        });
      }

      // Dispatch custom event so analytics/pixel scripts know consent was granted
      window.dispatchEvent(new CustomEvent("plr:cookie-consent", { detail: consent }));

      console.log("[LGPD] Consentimento registrado:", consent.accepted_at);
    }, 500);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de Cookies — LGPD"
      className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-700 ease-out ${
        exiting ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className={`mx-2 sm:mx-6 ${isPlansRoute && isMobile ? "mb-2" : "mb-2 sm:mb-6"}`}>
        <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-900/40 ${
          (isDenseCatalogRoute && isMobile) || (isSaudeVerdeRoute && isMobile)
            ? "bg-emerald-950/95"
            : "bg-gradient-to-r from-emerald-900/95 via-emerald-800/95 to-emerald-900/95 backdrop-blur-xl"
        }`}>
          {/* Decorative leaf pattern — desktop only para manter o banner enxuto no mobile */}
          <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgNUMxNSAxMCA1IDIwIDUgMzVjMCAxNSAyMCAyMCAyNSAyMFM1NSA1MCA1NSAzNUM1NSAyMCA0NSAxMCAzMCA1eiIgZmlsbD0iIzRhZGU4MCIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+')] bg-repeat" />

          <div className={`relative flex flex-row items-center gap-2 sm:gap-5 p-2.5 sm:p-5 ${isPlansRoute && isMobile ? "px-2.5 py-2 pr-2" : ""}`}>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Shield size={18} className="text-emerald-300 shrink-0 hidden sm:block" />
              <div className="min-w-0">
                <p className={`font-display font-bold text-white leading-tight sm:mb-1 truncate sm:whitespace-normal ${isPlansRoute && isMobile ? 'text-[11px]' : 'text-xs sm:text-base'}`}>
                  🍪 Cookies & Privacidade
                </p>
                <p className="hidden sm:block text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
                  Este site utiliza cookies para aprimorar sua experiência. Saiba mais em nossa{" "}
                  <Link to="/privacidade" className="underline underline-offset-2 text-emerald-300 hover:text-white transition-colors">
                    Política de Privacidade
                  </Link>.
                </p>
                <Link to="/privacidade" className={`sm:hidden text-emerald-300 underline underline-offset-2 ${isPlansRoute && isMobile ? 'text-[9px]' : 'text-[10px]'}`}>
                  Política de Privacidade
                </Link>
                {/* Micro-badges só no desktop */}
                <div className="hidden sm:flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200/70 bg-emerald-950/50 rounded-full px-2 py-0.5">
                    <Cookie size={10} /> Essenciais
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200/70 bg-emerald-950/50 rounded-full px-2 py-0.5">
                    <BarChart3 size={10} /> Analytics
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200/70 bg-emerald-950/50 rounded-full px-2 py-0.5">
                    <Heart size={10} /> Personalização
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAccept}
              className={`shrink-0 flex items-center gap-1 sm:gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 transition-all duration-300 hover:scale-105 ${isPlansRoute && isMobile ? 'px-3 py-2 text-[11px]' : 'px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-base'}`}
            >
              Aceitar
              <Check size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Utility: check if user has given cookie consent
 */
export function hasCookieConsent(): boolean {
  try {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) return false;
    const parsed: ConsentRecord = JSON.parse(stored);
    return parsed.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

/**
 * Utility: get consent record for audit
 */
export function getConsentRecord(): ConsentRecord | null {
  try {
    const stored = localStorage.getItem(COOKIE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
