import { ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnvisaBadgeProps {
  /** Registration or authorization code (e.g. "RDC-660/22-001"). Optional. */
  registration?: string;
  /** Compact variant used inside product cards */
  compact?: boolean;
  className?: string;
}

/**
 * AnvisaBadge — selo visual de conformidade sanitária ANVISA.
 *
 * Uso:
 *  - Rodapé institucional (Footer)
 *  - Cards de produtos médicos (Shopping / Dispensário)
 *  - Página institucional /produtos-anvisa
 *
 * Link direto para o portal de Consultas da ANVISA (empresas & produtos).
 */
export function AnvisaBadge({ registration, compact = false, className }: AnvisaBadgeProps) {
  const href = "https://consultas.anvisa.gov.br/";
  const label = compact
    ? "ANVISA"
    : registration
      ? `ANVISA · ${registration}`
      : "Conformidade ANVISA";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title="Verificar conformidade no portal de consultas da ANVISA"
      aria-label={`Verificar ${label} no portal da ANVISA`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-semibold transition-colors hover:bg-primary/20 hover:border-primary/50",
        compact
          ? "px-1.5 py-0.5 text-[9px] leading-none"
          : "px-2.5 py-1 text-[10px] leading-tight",
        className,
      )}
    >
      <ShieldCheck size={compact ? 9 : 11} className="shrink-0" />
      <span className="truncate">{label}</span>
      {!compact && <ExternalLink size={9} className="shrink-0 opacity-70" />}
    </a>
  );
}

export default AnvisaBadge;
