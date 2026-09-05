import { AlertTriangle, ShieldAlert, Info, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Alerta de interação medicamentosa entre canabinoides (CBD/THC) e
 * fármacos de uso contínuo. Base: metabolismo hepático CYP450 (CYP3A4/CYP2C19/CYP2C9).
 * Caráter informativo de apoio à decisão — não substitui o julgamento clínico.
 */

export type InteractionSeverity = "grave" | "moderada" | "leve";

export interface DrugInteraction {
  drug: string;
  severity: InteractionSeverity;
  mechanism: string;
  advice: string;
}

const RULES: { match: RegExp; interaction: Omit<DrugInteraction, "drug"> }[] = [
  {
    match: /clobazam|clonazepam|diazepam|midazolam|benzodiazep/i,
    interaction: {
      severity: "grave",
      mechanism: "CBD inibe CYP2C19 e eleva o N-desmetilclobazam (metabólito ativo) em até 3x.",
      advice: "Reduzir dose do benzodiazepínico e monitorar sedação, ataxia e sialorreia.",
    },
  },
  {
    match: /varfarina|warfarin|marevan/i,
    interaction: {
      severity: "grave",
      mechanism: "CBD inibe CYP2C9, aumentando a concentração de varfarina e o INR.",
      advice: "Controlar INR semanalmente nas primeiras 4 semanas e ajustar a anticoagulação.",
    },
  },
  {
    match: /valproat|valpro|depakene|acido valproico|ácido valproico/i,
    interaction: {
      severity: "grave",
      mechanism: "Associação CBD + valproato aumenta risco de elevação de transaminases.",
      advice: "Solicitar TGO/TGP e bilirrubinas antes e a cada 1–3 meses.",
    },
  },
  {
    match: /tacrolimo|ciclosporina|sirolimo|everolimo/i,
    interaction: {
      severity: "grave",
      mechanism: "Inibição de CYP3A4 eleva níveis séricos do imunossupressor.",
      advice: "Dosar nível sérico do imunossupressor antes e após o início do canabinoide.",
    },
  },
  {
    match: /sertralina|fluoxetina|escitalopram|paroxetina|citalopram|amitriptilina|venlafaxina|duloxetina/i,
    interaction: {
      severity: "moderada",
      mechanism: "Competição por CYP2D6/CYP2C19 pode aumentar exposição ao antidepressivo.",
      advice: "Iniciar canabinoide em dose baixa e vigiar sedação, tremor e sinais serotoninérgicos.",
    },
  },
  {
    match: /omeprazol|pantoprazol|esomeprazol|lansoprazol/i,
    interaction: {
      severity: "moderada",
      mechanism: "Inibidores de bomba de prótons compartilham metabolismo por CYP2C19 com o CBD.",
      advice: "Espaçar administração e monitorar dispepsia ou sonolência excessiva.",
    },
  },
  {
    match: /atorvastatina|sinvastatina|rosuvastatina|estatina/i,
    interaction: {
      severity: "moderada",
      mechanism: "Inibição de CYP3A4 aumenta exposição à estatina e risco de mialgia/rabdomiólise.",
      advice: "Orientar sobre dor muscular e considerar dosagem de CPK se sintomático.",
    },
  },
  {
    match: /clopidogrel|apixaban|rivaroxaban|xarelto|eliquis/i,
    interaction: {
      severity: "moderada",
      mechanism: "Metabolismo hepático compartilhado pode alterar o efeito antitrombótico.",
      advice: "Monitorar sinais de sangramento (gengival, hematúria, equimoses).",
    },
  },
  {
    match: /metformina|losartana|enalapril|anlodipino|levotiroxina/i,
    interaction: {
      severity: "leve",
      mechanism: "Interação farmacocinética pouco relevante, com possível efeito hipotensor aditivo.",
      advice: "Aferir pressão arterial nas duas primeiras semanas de titulação.",
    },
  },
  {
    match: /morfina|codeina|codeína|tramadol|oxicodona|opioid/i,
    interaction: {
      severity: "moderada",
      mechanism: "Depressão aditiva do sistema nervoso central com THC.",
      advice: "Reduzir dose noturna e alertar sobre direção de veículos e quedas.",
    },
  },
];

const CANNABINOID = /cbd|canabidiol|thc|tetrahidrocanabinol|cannabis|canabin|epidiolex|epidyolex|full spectrum/i;

/** Avalia a lista de medicamentos e devolve as interações relevantes. */
export function evaluateInteractions(medications: string[]): {
  hasCannabinoid: boolean;
  interactions: DrugInteraction[];
} {
  const clean = medications.map((m) => (m ?? "").trim()).filter(Boolean);
  const hasCannabinoid = clean.some((m) => CANNABINOID.test(m));
  if (!hasCannabinoid) return { hasCannabinoid: false, interactions: [] };

  const interactions: DrugInteraction[] = [];
  for (const med of clean) {
    if (CANNABINOID.test(med)) continue;
    const rule = RULES.find((r) => r.match.test(med));
    if (rule) interactions.push({ drug: med, ...rule.interaction });
  }

  const order: Record<InteractionSeverity, number> = { grave: 0, moderada: 1, leve: 2 };
  return {
    hasCannabinoid,
    interactions: interactions.sort((a, b) => order[a.severity] - order[b.severity]),
  };
}

const STYLES: Record<InteractionSeverity, { badge: string; box: string; label: string }> = {
  grave: {
    badge: "bg-red-500/15 text-red-300 border-red-500/40",
    box: "border-red-500/40 bg-red-500/5",
    label: "Interação grave",
  },
  moderada: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    box: "border-amber-500/40 bg-amber-500/5",
    label: "Interação moderada",
  },
  leve: {
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    box: "border-sky-500/40 bg-sky-500/5",
    label: "Interação leve",
  },
};

interface DrugInteractionAlertCardProps {
  /** Lista de medicamentos selecionados (canabinoide + uso contínuo). */
  medications: string[];
  className?: string;
}

export function DrugInteractionAlertCard({ medications, className = "" }: DrugInteractionAlertCardProps) {
  const { hasCannabinoid, interactions } = evaluateInteractions(medications);

  if (!hasCannabinoid) return null;

  if (interactions.length === 0) {
    return (
      <div className={`rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 ${className}`}>
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
          <ShieldCheck size={16} /> Nenhuma interação relevante identificada
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Não foram encontradas interações conhecidas entre o canabinoide selecionado e os fármacos
          de uso contínuo informados. Reavalie a cada titulação de dose.
        </p>
      </div>
    );
  }

  const graves = interactions.filter((i) => i.severity === "grave").length;

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-foreground">
            <ShieldAlert size={16} className="text-amber-400" />
            Alerta de interação medicamentosa
          </p>
          <p className="text-[11px] text-muted-foreground">
            Metabolismo hepático CYP450 · apoio à decisão clínica
          </p>
        </div>
        <Badge variant="outline" className={STYLES[graves > 0 ? "grave" : "moderada"].badge}>
          {interactions.length} {interactions.length === 1 ? "alerta" : "alertas"}
        </Badge>
      </div>

      <div className="space-y-2">
        {interactions.map((i) => {
          const s = STYLES[i.severity];
          return (
            <div key={`${i.drug}-${i.severity}`} className={`rounded-xl border p-3 ${s.box}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-foreground">{i.drug}</p>
                <Badge variant="outline" className={`${s.badge} text-[10px]`}>
                  {s.label}
                </Badge>
              </div>
              <p className="mt-1.5 flex gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {i.mechanism}
              </p>
              <p className="mt-1 flex gap-1.5 text-xs font-semibold text-foreground">
                <Info size={13} className="mt-0.5 shrink-0 text-emerald-400" /> {i.advice}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Conteúdo informativo baseado em literatura de farmacocinética canabinoide. A decisão de
        prescrição, dose e monitorização é exclusiva do médico responsável.
      </p>
    </div>
  );
}

export default DrugInteractionAlertCard;
