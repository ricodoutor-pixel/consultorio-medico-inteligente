import { AlertTriangle, Pill, Stethoscope } from "lucide-react";
import { parseTriageNotes } from "@/lib/clinical-summary";

/** Faixa fixa no topo do prontuário: medicamentos/alergias, queixa e intensidade informados na triagem. */
export function ClinicalAlertsBar({ notes }: { notes: string | null | undefined }) {
  const t = parseTriageNotes(notes);
  if (!t.medsAllergies && !t.complaint && t.intensity === null) return null;
  const highIntensity = t.intensity !== null && t.intensity >= 8;
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-1.5 text-sm">
      {t.medsAllergies && (
        <p className="flex items-start gap-2">
          <Pill className="h-4 w-4 mt-0.5 text-amber-700 shrink-0" />
          <span>
            <strong>Medicamentos / alergias:</strong> {t.medsAllergies}
          </span>
        </p>
      )}
      {t.complaint && (
        <p className="flex items-start gap-2">
          <Stethoscope className="h-4 w-4 mt-0.5 text-amber-700 shrink-0" />
          <span>
            <strong>Queixa:</strong> {t.complaint}
            {t.duration ? ` (há ${t.duration})` : ""}
          </span>
        </p>
      )}
      {t.intensity !== null && (
        <p className={`flex items-start gap-2 ${highIntensity ? "text-red-700 font-semibold" : ""}`}>
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Intensidade informada: {t.intensity}/10</span>
        </p>
      )}
    </div>
  );
}
