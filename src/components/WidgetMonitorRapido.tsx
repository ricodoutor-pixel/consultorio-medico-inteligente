import { Link, useLocation } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";

interface WidgetMonitorRapidoProps {
  className?: string;
  compact?: boolean;
}

/**
 * Widget de acesso rápido ao Monitor Cardíaco PPG.
 * Glassmorphism dark — preserva query string da rota atual ao navegar.
 */
export default function WidgetMonitorRapido({ className = "", compact = false }: WidgetMonitorRapidoProps) {
  const location = useLocation();
  const to = {
    pathname: "/monitor-cardiaco",
    search: location.search, // preserva utm/ref/tracking
    state: { from: location.pathname },
  };

  const handleClick = () => {
    try {
      // GTM event (não bloqueia lazy import)
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: "widget_monitor_click",
        origem: location.pathname,
      });
    } catch { /* noop */ }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      aria-label="Abrir monitor cardíaco — medir BPM agora"
      className={`group block rounded-2xl border border-[#1A2540] bg-[#0B1120]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] hover:border-emerald-500/60 transition-all ${
        compact ? "p-3" : "p-4 md:p-5"
      } ${className}`}
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative shrink-0">
          <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" aria-hidden />
          <div className="relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-500/30">
            <Heart className="w-5 h-5 md:w-6 md:h-6 text-white fill-white animate-pulse" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] md:text-xs uppercase tracking-wider text-emerald-300/80 font-semibold">
            Monitor PPG · Tempo real
          </p>
          <p className="text-sm md:text-base font-bold text-white leading-tight truncate">
            Monitoramento de Saúde em tempo real
          </p>
          {!compact && (
            <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">
              Meça BPM e HRV com a câmera do seu celular · 30s
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-500 group-hover:bg-emerald-400 px-3 py-2 text-xs md:text-sm font-bold text-black transition-colors shrink-0">
          Medir Coração Agora
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
        <div className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500 group-hover:bg-emerald-400 text-black shrink-0">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {!compact && (
        <div className="sm:hidden mt-3">
          <div className="w-full text-center rounded-xl bg-emerald-500 group-hover:bg-emerald-400 px-3 py-2.5 text-sm font-bold text-black transition-colors">
            Medir Coração Agora
          </div>
        </div>
      )}
    </Link>
  );
}
