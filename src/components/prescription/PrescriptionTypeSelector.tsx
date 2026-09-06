import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, FileSignature, ShieldCheck } from "lucide-react";
import {
  PRESCRIPTION_TYPES,
  getPrescriptionTypeMeta,
  suggestPrescriptionType,
  type PrescriptionType,
} from "@/lib/prescription-types";

interface PrescriptionTypeSelectorProps {
  value: PrescriptionType;
  onChange: (value: PrescriptionType) => void;
  thcPercentage: number;
  onThcChange: (value: number) => void;
  hasDigitalSignature?: boolean;
}

/**
 * Seletor do tipo de receituário no ato da prescrição (prontuário do médico).
 * Ajusta automaticamente a sugestão conforme o teor de THC declarado.
 */
export function PrescriptionTypeSelector({
  value,
  onChange,
  thcPercentage,
  onThcChange,
  hasDigitalSignature = true,
}: PrescriptionTypeSelectorProps) {
  const meta = getPrescriptionTypeMeta(value);
  const suggested = useMemo(() => suggestPrescriptionType(thcPercentage), [thcPercentage]);
  const divergent = suggested !== value;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Tipo de receituário
        </Label>
        <div className="grid gap-2">
          {PRESCRIPTION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                value === t.value
                  ? "border-primary bg-primary/10"
                  : "border-border/40 bg-card/50 hover:bg-accent/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{t.label}</span>
                <Badge variant="outline" className="text-[10px]">
                  {t.copies} via{t.copies > 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{t.description}</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70 italic">{t.legalBasis}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="thc-percentage" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Teor de THC da formulação (% m/m)
        </Label>
        <Input
          id="thc-percentage"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={Number.isFinite(thcPercentage) ? thcPercentage : 0}
          onChange={(e) => onThcChange(Number(e.target.value))}
          className="h-9"
        />
      </div>

      {divergent && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-xs font-bold">Sugestão regulatória</AlertTitle>
          <AlertDescription className="text-[11px]">
            Para {thcPercentage}% de THC o modelo indicado é{" "}
            <strong>{getPrescriptionTypeMeta(suggested).label}</strong>.
          </AlertDescription>
        </Alert>
      )}

      {meta.requiresPhysicalNotification && (
        <Alert variant="destructive" className="border-rose-500/50 bg-rose-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold">Notificação de Receita B obrigatória</AlertTitle>
          <AlertDescription className="text-[11px]">
            THC acima de 0,2%: é necessária a retenção da notificação física numerada (talonário azul)
            pela farmácia. O PDF digital é apenas cópia de acompanhamento.
          </AlertDescription>
        </Alert>
      )}

      {meta.value === "controle_especial_c1" && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <FileSignature className="h-4 w-4 text-emerald-500" />
          <AlertTitle className="text-xs font-bold">Emissão em duas vias</AlertTitle>
          <AlertDescription className="text-[11px]">
            Serão geradas 2 vias (farmácia e paciente) com assinatura digital ICP-Brasil (padrão ITI/CFM).
          </AlertDescription>
        </Alert>
      )}

      <div
        className={`flex items-center gap-2 rounded-lg border p-2.5 text-[11px] ${
          hasDigitalSignature
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : "border-rose-500/40 bg-rose-950/30 text-rose-300"
        }`}
      >
        <ShieldCheck className="h-4 w-4 flex-shrink-0" />
        {hasDigitalSignature
          ? "Assinatura digital ICP-Brasil (ITI/CFM) validada para este prescritor."
          : "Prescritor sem assinatura ICP-Brasil validada — a assinatura da plataforma será utilizada."}
      </div>
    </div>
  );
}

export default PrescriptionTypeSelector;
