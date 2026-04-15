/**
 * 🧠 Brisa IA 2.0 — Análise de Sentimento & Detecção de Urgência Médica
 * 
 * Detecta sinais de urgência médica no chat para acionar CTA de agendamento imediato.
 */

export type SentimentLevel = "normal" | "concern" | "urgent" | "emergency";

interface SentimentResult {
  level: SentimentLevel;
  score: number; // 0-100
  triggers: string[];
  suggestedAction: "none" | "highlight_booking" | "immediate_booking" | "emergency_contact";
}

// Palavras-chave de urgência médica classificadas por gravidade
const EMERGENCY_KEYWORDS = [
  "convulsão", "convulsões", "convulsando",
  "suicídio", "suicida", "me matar", "quero morrer", "não aguento mais viver",
  "overdose", "intoxicação",
  "desmaio", "desmaiando", "desmaiei",
  "sangramento", "sangrando muito",
  "paralisia", "não consigo mexer",
  "falta de ar grave", "não consigo respirar",
];

const URGENT_KEYWORDS = [
  "dor forte", "dor intensa", "dor insuportável", "dor aguda",
  "crise", "crise de ansiedade", "crise de pânico", "ataque de pânico",
  "não consigo dormir há dias", "insônia severa",
  "vomitando", "vômito constante",
  "febre alta", "febre muito alta",
  "tremores", "tremendo muito",
  "alucinação", "alucinações", "vendo coisas",
  "depressão grave", "depressão severa",
  "efeito colateral", "reação adversa", "reação alérgica",
  "pressão alta", "pressão muito alta", "taquicardia",
  "emergência", "urgente", "urgência",
  "socorro", "me ajuda", "preciso de ajuda agora",
  "piora", "piorando", "piorou muito",
];

const CONCERN_KEYWORDS = [
  "dor", "doendo", "machucado",
  "ansiedade", "ansioso", "ansiosa",
  "insônia", "não durmo", "não consigo dormir",
  "depressão", "deprimido", "deprimida", "triste",
  "estresse", "estressado",
  "enjoo", "náusea",
  "tontura", "tonto",
  "medo", "com medo",
  "preocupado", "preocupada",
  "piorou", "não melhora",
  "efeito", "colateral",
  "dosagem", "dose errada",
];

export function analyzeSentiment(text: string): SentimentResult {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const originalLower = text.toLowerCase();
  
  const triggers: string[] = [];
  let maxLevel: SentimentLevel = "normal";
  let score = 0;

  // Check emergency keywords
  for (const kw of EMERGENCY_KEYWORDS) {
    if (originalLower.includes(kw)) {
      triggers.push(kw);
      maxLevel = "emergency";
      score = Math.max(score, 95);
    }
  }

  // Check urgent keywords
  for (const kw of URGENT_KEYWORDS) {
    if (originalLower.includes(kw)) {
      triggers.push(kw);
      if (maxLevel !== "emergency") maxLevel = "urgent";
      score = Math.max(score, 70);
    }
  }

  // Check concern keywords
  for (const kw of CONCERN_KEYWORDS) {
    if (originalLower.includes(kw)) {
      triggers.push(kw);
      if (maxLevel === "normal") maxLevel = "concern";
      score = Math.max(score, 40);
    }
  }

  // Intensity amplifiers
  const amplifiers = ["muito", "demais", "grave", "severo", "forte", "intenso", "insuportável", "não aguento"];
  const hasAmplifier = amplifiers.some(a => originalLower.includes(a));
  if (hasAmplifier && maxLevel === "concern") {
    maxLevel = "urgent";
    score = Math.min(score + 20, 90);
  }

  // Multiple symptoms = higher urgency
  if (triggers.length >= 3 && maxLevel === "concern") {
    maxLevel = "urgent";
    score = Math.min(score + 15, 85);
  }

  const actionMap: Record<SentimentLevel, SentimentResult["suggestedAction"]> = {
    normal: "none",
    concern: "highlight_booking",
    urgent: "immediate_booking",
    emergency: "emergency_contact",
  };

  return {
    level: maxLevel,
    score,
    triggers: [...new Set(triggers)],
    suggestedAction: actionMap[maxLevel],
  };
}

export function getUrgencyColor(level: SentimentLevel): string {
  switch (level) {
    case "emergency": return "text-red-500";
    case "urgent": return "text-amber-500";
    case "concern": return "text-yellow-500";
    default: return "text-primary";
  }
}

export function getUrgencyBorderColor(level: SentimentLevel): string {
  switch (level) {
    case "emergency": return "border-red-500/50 bg-red-500/10";
    case "urgent": return "border-amber-500/50 bg-amber-500/10";
    case "concern": return "border-yellow-500/30 bg-yellow-500/5";
    default: return "";
  }
}
