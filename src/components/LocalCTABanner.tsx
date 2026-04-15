import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Link } from "react-router-dom";

export function LocalCTABanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-primary/90 text-primary-foreground text-center text-[11px] sm:text-xs md:text-sm py-1 sm:py-1.5 px-8 sm:px-4 relative z-50 flex items-center justify-center gap-1 sm:gap-2 leading-tight">
      <MapPin size={12} className="shrink-0 hidden sm:block" />
      <span className="truncate sm:truncate-none">
        <span className="sm:hidden">Atendimento SP — <strong>Av. Paulista</strong> · </span>
        <span className="hidden sm:inline">Atendimento prioritário · <strong>São Paulo</strong> · <strong>Av. Paulista</strong> — </span>
        <Link to="/agendamento" className="underline font-semibold hover:opacity-80 transition-opacity">
          Agende agora
        </Link>
      </span>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity p-1"
        aria-label="Fechar banner"
      >
        <X size={12} />
      </button>
    </div>
  );
}
