import React, { useState } from "react";
import { 
  checkDrugInteractions, 
  type DrugInteraction, 
  type InteractionCheckResult,
  type SeverityLevel 
} from "@/services/drugInteractions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertOctagon, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  CheckCircle2,
  Stethoscope
} from "lucide-react";

interface DrugInteractionAlertCardProps {
  cannabinoids: string | string[];
  patientMedications: string | string[];
  onAcknowledgeRisk?: (acknowledged: boolean) => void;
  className?: string;
  showIfSafe?: boolean;
}

const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; text: string; border: string; label: string }> = {
  contraindicated: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/50",
    label: "Contraindicado",
  },
  high: {
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/40",
    label: "Alto Risco Clínico",
  },
  moderate: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/40",
    label: "Manejo Moderado",
  },
  low: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/40",
    label: "Leve / Monitorar",
  },
  none: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    label: "Sem Interações Conhecidas",
  },
};

export const DrugInteractionAlertCard: React.FC<DrugInteractionAlertCardProps> = ({
  cannabinoids,
  patientMedications,
  onAcknowledgeRisk,
  className = "",
  showIfSafe = true,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Normaliza entradas
  const cannabinoidList = Array.isArray(cannabinoids)
    ? cannabinoids
    : typeof cannabinoids === "string"
    ? cannabinoids.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const medicationList = Array.isArray(patientMedications)
    ? patientMedications
    : typeof patientMedications === "string"
    ? patientMedications.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const result: InteractionCheckResult = checkDrugInteractions(
    cannabinoidList.length > 0 ? cannabinoidList : ["CBD", "Full Spectrum"],
    medicationList
  );

  const handleToggleAcknowledge = () => {
    const nextState = !isAcknowledged;
    setIsAcknowledged(nextState);
    onAcknowledgeRisk?.(nextState);
  };

  // Se não há interações e showIfSafe é falso, não renderiza
  if (result.interactions.length === 0) {
    if (!showIfSafe) return null;

    return (
      <div className={`p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-2 ${className}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            <strong>Suporte Clínico à Decisão (CYP450):</strong> Nenhuma interação medicamentosa de risco conhecida identificada com os fármacos informados.
          </span>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
          Seguro
        </Badge>
      </div>
    );
  }

  const isHighRisk = result.hasHighRisk;
  const config = SEVERITY_COLORS[result.maxSeverity] || SEVERITY_COLORS.moderate;

  return (
    <Card className={`border ${config.border} ${isHighRisk ? "bg-red-950/20" : "bg-amber-950/20"} shadow-md overflow-hidden ${className}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header do Alerta */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            {isHighRisk ? (
              <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`font-bold text-sm ${config.text}`}>
                  {isHighRisk ? "Alerta Clínico: Interação de Alto Risco" : "Aviso de Interação Farmacocinética"}
                </h4>
                <Badge variant="outline" className={`text-[10px] uppercase font-bold ${config.bg} ${config.text} ${config.border}`}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-foreground/80 mt-1">
                {result.summaryText}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>

        {/* Detalhes expandidos de cada interação */}
        {expanded && (
          <div className="space-y-3 pt-2 border-t border-border/40">
            {result.interactions.map((interaction: DrugInteraction) => (
              <div
                key={interaction.id}
                className="p-3 rounded-lg bg-background/60 border border-border/50 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Stethoscope size={13} className="text-primary" />
                    {interaction.medication.toUpperCase()} × {interaction.cannabinoid}
                  </span>
                  <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[interaction.severity]?.bg} ${SEVERITY_COLORS[interaction.severity]?.text}`}>
                    {interaction.medicationClass}
                  </Badge>
                </div>

                <div className="space-y-1 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Mecanismo:</strong> {interaction.mechanism}
                  </p>
                  <p>
                    <strong className="text-foreground">Efeito Clínico:</strong> {interaction.clinicalEffect}
                  </p>
                  <p className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                    <strong>Conduta Sugerida:</strong> {interaction.recommendation}
                  </p>
                </div>

                {interaction.references.length > 0 && (
                  <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                    <BookOpen size={11} className="shrink-0" />
                    <span>Evidência: {interaction.references.join(" • ")}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Checkbox de Confirmação Médica */}
            {isHighRisk && (
              <div className="pt-2 flex items-center justify-between gap-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                <span className="text-[11px] text-red-200 font-medium">
                  Declaro ter avaliado o perfil de interações e orientarei o paciente sobre o monitoramento laboratorial/clínico.
                </span>
                <Button
                  size="sm"
                  variant={isAcknowledged ? "default" : "outline"}
                  onClick={handleToggleAcknowledge}
                  className={`text-xs shrink-0 ${isAcknowledged ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-red-400 text-red-300 hover:bg-red-500/20"}`}
                >
                  <CheckCircle2 size={13} className="mr-1" />
                  {isAcknowledged ? "Ciente & Confirmado" : "Confirmar Ciência"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
