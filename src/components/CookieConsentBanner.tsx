import { useState, useEffect } from "react";
import { Shield, Check } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "plr_cookie_consent";

export const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem(COOKIE_KEY, "true");
      setVisible(false);
    }, 500);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-700 ease-out ${
        exiting ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="mx-3 mb-3 sm:mx-6 sm:mb-6">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-900/95 via-emerald-800/95 to-emerald-900/95 backdrop-blur-xl shadow-2xl shadow-emerald-900/40">
          {/* Decorative leaf pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgNUMxNSAxMCA1IDIwIDUgMzVjMCAxNSAyMCAyMCAyNSAyMFM1NSA1MCA1NSAzNUM1NSAyMCA0NSAxMCAzMCA1eiIgZmlsbD0iIzRhZGU4MCIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+')] bg-repeat" />
          
          <div className="relative flex flex-col sm:flex-row items-center gap-3 sm:gap-5 p-4 sm:p-5">
            <div className="flex items-start gap-3 flex-1">
              <Shield size={22} className="text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="font-display font-bold text-white text-sm sm:text-base mb-1">
                  Cultivamos transparência.
                </p>
                <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
                  Este site utiliza cookies para aprimorar sua experiência de saúde e bem-estar. Saiba mais em nossa{" "}
                  <Link to="/privacidade" className="underline underline-offset-2 text-emerald-300 hover:text-white transition-colors">
                    Política de Privacidade
                  </Link>.
                </p>
              </div>
            </div>

            <button
              onClick={handleAccept}
              className="shrink-0 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
            >
              Aceitar
              <Check size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
