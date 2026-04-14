import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Link } from "react-router-dom";

export function LocalCTABanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-primary/90 text-primary-foreground text-center text-sm py-2 px-4 relative z-50 flex items-center justify-center gap-2">
      <MapPin size={14} className="shrink-0" />
      <span>
        Atendimento prioritário para pacientes de <strong>São Paulo</strong> e região da <strong>Av. Paulista</strong> —{" "}
        <Link to="/agendamento" className="underline font-semibold hover:opacity-80 transition-opacity">
          Agende agora
        </Link>
      </span>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fechar banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
