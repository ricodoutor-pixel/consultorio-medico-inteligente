/**
 * Verificador de Interações Medicamentosas Especializado em Terapias Canabinoides
 * Base científica: Sistema Citocromo P450 (CYP3A4, CYP2C19, CYP2C9, CYP1A2) e Farmacodinâmica
 * Conformidade: Resoluções CFM nº 2.314/2022 e Anvisa RDC nº 660/2022
 */

export type SeverityLevel = "contraindicated" | "high" | "moderate" | "low" | "none";

export interface DrugInteraction {
  id: string;
  cannabinoid: string;
  medication: string;
  medicationClass: string;
  severity: SeverityLevel;
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
  evidenceLevel: "established" | "probable" | "theoretical";
  references: string[];
}

export interface InteractionCheckResult {
  interactions: DrugInteraction[];
  maxSeverity: SeverityLevel;
  hasHighRisk: boolean;
  summaryText: string;
}

interface InteractionRule {
  medicationMatches: string[];
  medicationClass: string;
  cannabinoidMatches: string[];
  severity: SeverityLevel;
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
  evidenceLevel: "established" | "probable" | "theoretical";
  references: string[];
}

const INTERACTION_DATABASE: InteractionRule[] = [
  // 1. Anticoagulantes Cumarínicos (Varfarina)
  {
    medicationMatches: ["varfarina", "warfarin", "marevan", "coumadin"],
    medicationClass: "Anticoagulantes Antagonistas da Vitamina K",
    cannabinoidMatches: ["cbd", "canabidiol", "thc", "full spectrum", "broad spectrum"],
    severity: "high",
    mechanism: "Inibição competitiva das isoenzimas CYP2C9 e CYP3A4 pelo CBD, reduzindo a depuração da S-varfarina.",
    clinicalEffect: "Elevação expressiva do INR (tempo de protrombina) e risco acentuado de hemorragias maiores e hematomas.",
    recommendation: "Monitoramento obrigatório do RNI/INR a cada 3 a 5 dias na introdução ou alteração de dose do canabinoide. Ajuste redutor na dose de varfarina (geralmente de 20% a 30%) pode ser mandatório.",
    evidenceLevel: "established",
    references: ["Grayson et al., Epilepsy & Behavior 2018", "FDA Epidiolex Prescribing Information 2020"],
  },
  // 2. Novos Anticoagulantes Orais (NOACs / DOACs)
  {
    medicationMatches: ["rivaroxabana", "xarelto", "apixabana", "eliquis", "dabigatrana", "pradaxa", "edoxabana"],
    medicationClass: "Anticoagulantes Orais Diretos (DOACs)",
    cannabinoidMatches: ["cbd", "canabidiol", "full spectrum"],
    severity: "moderate",
    mechanism: "Inibição concomitante do CYP3A4 e da Glicoproteína-P (P-gp) intestinal/renal pelo CBD.",
    clinicalEffect: "Aumento potencial da biodisponibilidade e meia-vida do anticoagulante, favorecendo sangramentos ocultos.",
    recommendation: "Acompanhar hemograma seriado, ferritina e orientar o paciente a comunicar imediatamente episódios de epistaxe, hematúria ou melena.",
    evidenceLevel: "probable",
    references: ["Alsherbiny & Li, Medicines 2019"],
  },
  // 3. Clobazam (Frisium)
  {
    medicationMatches: ["clobazam", "frisium", "urbanil"],
    medicationClass: "Benzodiazepínicos Antiepilépticos",
    cannabinoidMatches: ["cbd", "canabidiol", "full spectrum", "broad spectrum"],
    severity: "high",
    mechanism: "O CBD atua como potente inibidor da CYP2C19, bloqueando a conversão do N-desmetilclobazam em metabólitos inativos.",
    clinicalEffect: "Aumento de até 300% a 500% nos níveis séricos do metabólito ativo N-desmetilclobazam, causando sonolência intensa, letargia, ataxia e hipotonia.",
    recommendation: "Reduzir profilaticamente a dose do Clobazam em 25% a 50% caso surja sedação excessiva nas primeiras duas semanas.",
    evidenceLevel: "established",
    references: ["Geffrey et al., Epilepsia 2015", "Devinsky et al., Lancet 2016"],
  },
  // 4. Valproato de Sódio / Ácido Valproico
  {
    medicationMatches: ["valproato", "acido valproico", "depakene", "depakote", "divalproato"],
    medicationClass: "Anticonvulsivantes / Estabilizadores de Humor",
    cannabinoidMatches: ["cbd", "canabidiol", "full spectrum"],
    severity: "high",
    mechanism: "Mecanismo hepático cumulativo de sobrecarga mitocondrial entre canabidiol em doses elevadas e valproato.",
    clinicalEffect: "Risco de elevação de transaminases hepáticas (ALT/AST > 3x o limite superior da normalidade) e hepatotoxicidade.",
    recommendation: "Solicitar painel de função hepática (TGO, TGP, Gama-GT e Bilirrubinas) pré-tratamento, em 1 mês, 3 meses e a cada 6 meses.",
    evidenceLevel: "established",
    references: ["Thiele et al., NEJM 2018", "FDA Drug Safety Communication 2019"],
  },
  // 5. Benzodiazepínicos e Sedativos Gerais
  {
    medicationMatches: ["clonazepam", "rivotril", "diazepam", "valium", "alprazolam", "frontin", "lorazepam", "zolpidem", "estilnoct"],
    medicationClass: "Sedativos / Hipnóticos / Agonistas GABA",
    cannabinoidMatches: ["cbd", "thc", "cbn", "canabinol", "full spectrum"],
    severity: "moderate",
    mechanism: "Potencialização farmacodinâmica de sedação no SNC e modulação alostérica positiva dos receptores GABA-A.",
    clinicalEffect: "Depressão sinérgica do SNC, sonolência diurna, redução do tempo de reação reflexa e relaxamento muscular excessivo.",
    recommendation: "Recomendar administração noturna dos canabinoides e vedar condução de veículos automotores nas primeiras 72 horas.",
    evidenceLevel: "established",
    references: ["WHO Expert Committee on Drug Dependence 2018"],
  },
  // 6. Imunossupressores de Estreita Margem Terapêutica
  {
    medicationMatches: ["tacrolimo", "prograf", "ciclosporina", "sandimmun", "sirolimo", "rapamune", "everolimo"],
    medicationClass: "Inibidores de Calcineurina e mTOR (Imunossupressores)",
    cannabinoidMatches: ["cbd", "canabidiol", "full spectrum"],
    severity: "high",
    mechanism: "Inibição de primeira passagem intestinal e hepática de CYP3A4 mediada por canabidiol.",
    clinicalEffect: "Elevação crítica dos níveis de vale (trough level) com risco elevado de nefrotoxicidade e imunossupressão excessiva.",
    recommendation: "Monitoramento estrito da dosagem sérica do imunossupressor nos primeiros 7 e 14 dias após introdução do CBD.",
    evidenceLevel: "established",
    references: ["Leino et al., Am J Transplant 2019"],
  },
  // 7. Anti-hipertensivos e Bloqueadores de Canais de Cálcio
  {
    medicationMatches: ["amlodipino", "norvasc", "nifedipino", "adala", "losartana", "atenolol", "propranolol"],
    medicationClass: "Anti-hipertensivos / Vasodilatadores",
    cannabinoidMatches: ["thc", "tetrahidrocanabinol", "full spectrum"],
    severity: "moderate",
    mechanism: "Vasodilatação periférica mediada por receptores CB1 e modulação do tônus simpático pelo THC.",
    clinicalEffect: "Risco de hipotensão ortostática postural, tontura pré-síncope e taquicardia reflexa compensatória.",
    recommendation: "Orientar aferição pressórica antes de levantar; hidratação generosa; iniciar THC com microdoses (start low, go slow).",
    evidenceLevel: "probable",
    references: ["Page et al., Circulation 2020"],
  },
  // 8. Inibidores da Recaptação de Serotonina (ISRS)
  {
    medicationMatches: ["fluoxetina", "sertralina", "escitalopram", "paroxetina", "citalopram", "venlafaxina"],
    medicationClass: "Antidepressivos ISRS / IRSN",
    cannabinoidMatches: ["cbd", "thc", "full spectrum"],
    severity: "low",
    mechanism: "Inibição leve/moderada de CYP2D6 e CYP2C19 pelo CBD; interação sinérgica sobre receptor 5-HT1A.",
    clinicalEffect: "Geralmente bem tolerado com potenciais sinergismos ansiolíticos; raramente leve aumento de náusea ou sonolência.",
    recommendation: "Acompanhar resposta clínica; manter doses habituais dos antidepressivos sem interrupção abrupta.",
    evidenceLevel: "probable",
    references: ["Rong et al., J Clin Psychopharmacol 2021"],
  },
];

const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  contraindicated: 4,
  high: 3,
  moderate: 2,
  low: 1,
  none: 0,
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Cruza a lista de canabinoides pretendidos com os medicamentos de uso contínuo do paciente.
 */
export function checkDrugInteractions(
  cannabinoids: string[],
  currentMedications: string[]
): InteractionCheckResult {
  const normCannabinoids = cannabinoids.map(normalizeString).filter(Boolean);
  const normMeds = currentMedications.map(normalizeString).filter(Boolean);

  const matchedInteractions: DrugInteraction[] = [];

  for (const rule of INTERACTION_DATABASE) {
    // Verifica se algum canabinoide prescrito coincide com a regra
    const hasCannabinoid = normCannabinoids.some((c) =>
      rule.cannabinoidMatches.some((match) => c.includes(match) || match.includes(c))
    );

    if (!hasCannabinoid && normCannabinoids.length > 0) {
      continue;
    }

    // Verifica se algum medicamento do paciente coincide com a regra
    for (const med of normMeds) {
      const matchFound = rule.medicationMatches.some((match) =>
        med.includes(match) || match.includes(med)
      );

      if (matchFound) {
        matchedInteractions.push({
          id: `inter-${rule.medicationMatches[0]}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          cannabinoid: cannabinoids.join(", ") || "Canabinoides Gerais",
          medication: med,
          medicationClass: rule.medicationClass,
          severity: rule.severity,
          mechanism: rule.mechanism,
          clinicalEffect: rule.clinicalEffect,
          recommendation: rule.recommendation,
          evidenceLevel: rule.evidenceLevel,
          references: rule.references,
        });
        break;
      }
    }
  }

  // Determina gravidade máxima
  let maxSeverity: SeverityLevel = "none";
  let maxWeight = 0;

  for (const inter of matchedInteractions) {
    const w = SEVERITY_WEIGHTS[inter.severity] || 0;
    if (w > maxWeight) {
      maxWeight = w;
      maxSeverity = inter.severity;
    }
  }

  const hasHighRisk = maxWeight >= SEVERITY_WEIGHTS.high;

  let summaryText = "Nenhuma interação medicamentosa de risco relevante detectada com os canabinoides informados.";
  if (hasHighRisk) {
    summaryText = `⚠️ ATENÇÃO CLÍNICA: Detectadas ${matchedInteractions.length} interações de ALTO RISCO com a terapia canabinoide. Requer monitoramento laboratorial ou ajuste de dose.`;
  } else if (matchedInteractions.length > 0) {
    summaryText = `ℹ️ Detectadas ${matchedInteractions.length} interações de manejo clínico moderado/baixo com a terapia canabinoide.`;
  }

  return {
    interactions: matchedInteractions,
    maxSeverity,
    hasHighRisk,
    summaryText,
  };
}
