import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Info } from "lucide-react";

interface SaMDBiofeedbackDisclaimerProps {
  compact?: boolean;
  className?: string;
  toolName?: string;
}

/**
 * Componente de Blindagem Regulatória Sanitária (ANVISA RDC 657/2022 & CFM nº 2.314/2022)
 * Assegura que ferramentas de visão computacional, rPPG, acelerometria e biofeedback
 * sejam categorizadas estritamente como triagem não-invasiva, afastando enquadramento indevido como SaMD de diagnóstico.
 */
export const SaMDBiofeedbackDisclaimer: React.FC<SaMDBiofeedbackDisclaimerProps> = ({
  compact = false,
  className = "",
  toolName = "Esta ferramenta de biofeedback",
}) => {
  if (compact) {
    return (
      <div className={`p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2 ${className}`}>
        <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-400 font-semibold">Biofeedback Preliminar Não Invasivo: </strong>
          {toolName} atua para triagem e monitoramento de apoio. Não constitui Software como Dispositivo Médico (SaMD) de diagnóstico definitivo e não substitui a consulta médica.
        </div>
      </div>
    );
  }

  return (
    <Alert className={`bg-amber-500/10 border-amber-500/30 text-amber-200 ${className}`}>
      <ShieldCheck className="h-4 w-4 text-amber-400 mt-0.5" />
      <AlertTitle className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
        Aviso de Conformidade Regulatória (Anvisa & CFM)
      </AlertTitle>
      <AlertDescription className="text-xs text-amber-200/80 leading-relaxed mt-1">
        {toolName} é uma ferramenta de <strong>biofeedback preliminar não invasivo para triagem e monitoramento complementar</strong>.
        Em estrita conformidade com a RDC ANVISA nº 657/2022 e a Resolução CFM nº 2.314/2022, este sistema <strong>não constitui Software como Dispositivo Médico (SaMD)</strong> de diagnóstico definitivo, não emite laudo médico conclusivo e não substitui a anamnese e avaliação clínica por médico habilitado.
      </AlertDescription>
    </Alert>
  );
};
