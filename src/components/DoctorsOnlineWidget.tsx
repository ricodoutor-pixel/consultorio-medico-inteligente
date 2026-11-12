import { Activity } from "lucide-react";
import { useRealProfessionals } from "@/hooks/useRealProfessionals";

const MEDICOS_CATEGORY = "Médicos Prescritores";

/**
 * Selo da página inicial com a presença REAL dos médicos (mesma regra da vitrine):
 * verde = botão ON no Consultório com batimento recente; amarelo = em consulta paga agora.
 * Nunca mostra número inventado: sem médico online, diz isso e convida a agendar.
 */
export function DoctorsOnlineWidget() {
  const { professionals } = useRealProfessionals();
  const doctors = professionals.filter((p) => p.category === MEDICOS_CATEGORY);
  const online = doctors.filter((p) => p.online).length;
  const busy = doctors.filter((p) => p.presenceState === "em_consulta").length;

  const tone = online > 0 ? "primary" : busy > 0 ? "amber" : "muted";
  const dot = tone === "primary" ? "bg-primary" : tone === "amber" ? "bg-amber-400" : "bg-muted-foreground/50";
  const label =
    online > 0
      ? ` ${online === 1 ? "médico de plantão online" : "médicos de plantão online"} agora`
      : busy > 0
        ? `${busy} ${busy === 1 ? "médico em consulta" : "médicos em consulta"} agora · agende o seu horário`
        : "Médicos entram de plantão ao longo do dia · agende sua consulta";

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-md shadow-lg shadow-primary/10"
    >
      <span className="relative flex h-2.5 w-2.5">
        {tone !== "muted" && <span className={`absolute inline-flex h-full w-full rounded-full ${dot} opacity-75 animate-ping`} />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dot}`} />
      </span>
      <Activity size={14} className="text-primary" aria-hidden />
      <span className="text-xs sm:text-sm font-black text-foreground">
        {online > 0 && <span className="text-primary tabular-nums">{online}</span>}
        {label}
      </span>
    </div>
  );
}

export default DoctorsOnlineWidget;
