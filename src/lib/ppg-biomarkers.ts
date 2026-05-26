/**
 * Biomarcadores derivados de BPM + HRV (SDNN ms).
 * Estimativas educativas baseadas em literatura de variabilidade cardíaca:
 *  - Shaffer & Ginsberg (2017) "An Overview of HRV Metrics and Norms"
 *  - Umetani et al. (1998) — declínio de SDNN com a idade
 *  - Tanaka et al. (2001) — FC máx = 208 − 0.7 × idade
 * NÃO é diagnóstico clínico.
 */

export type StressLevel = "baixo" | "moderado" | "alto" | "muito_alto";
export type RecoveryLevel = "excelente" | "boa" | "regular" | "baixa";
export type AutonomicBalance = "parassimpatico" | "equilibrado" | "simpatico";

export interface Biomarkers {
  stressScore: number;          // 0–100 (quanto maior, mais estresse)
  stressLevel: StressLevel;
  metabolicAge: number | null;  // anos estimados (null se HRV indisponível)
  recoveryLevel: RecoveryLevel;
  autonomicBalance: AutonomicBalance;
  cardiacEfficiency: number;    // 0–100 (quanto maior, melhor)
  vo2maxEstimate: number | null; // ml/kg/min estimado (Uth-Sørensen simplificado)
}

/** Score de estresse 0–100 derivado de HRV (SDNN) e BPM em repouso. */
function computeStressScore(bpm: number, hrv: number | null): number {
  // HRV mais baixo + BPM mais alto => mais estresse.
  const hrvComp = hrv == null ? 60 : Math.max(0, Math.min(100, 100 - (hrv - 10) * 1.6));
  const bpmComp = Math.max(0, Math.min(100, (bpm - 55) * 2.2));
  const score = Math.round(hrvComp * 0.65 + bpmComp * 0.35);
  return Math.max(0, Math.min(100, score));
}

function stressLevelFrom(score: number): StressLevel {
  if (score < 25) return "baixo";
  if (score < 50) return "moderado";
  if (score < 75) return "alto";
  return "muito_alto";
}

/**
 * Idade metabólica estimada a partir do SDNN.
 * Aproximação linear inversa: SDNN típico cai ~0.4 ms/ano após os 20 anos.
 * SDNN 50ms ≈ 30a; SDNN 30ms ≈ 50a; SDNN 15ms ≈ 70a. Ajustado por BPM repouso.
 */
function computeMetabolicAge(bpm: number, hrv: number | null): number | null {
  if (hrv == null || hrv < 5) return null;
  // base: idade ≈ 70 − SDNN (clamp 18–80)
  let age = 70 - hrv * 0.9;
  // ajuste BPM: cada BPM acima de 65 soma ~0.4 ano metabólico
  age += Math.max(0, bpm - 65) * 0.4;
  // jovens muito ativos
  age -= Math.max(0, 55 - bpm) * 0.3;
  return Math.max(18, Math.min(80, Math.round(age)));
}

function recoveryFrom(hrv: number | null): RecoveryLevel {
  if (hrv == null) return "regular";
  if (hrv >= 60) return "excelente";
  if (hrv >= 40) return "boa";
  if (hrv >= 20) return "regular";
  return "baixa";
}

function autonomicFrom(bpm: number, hrv: number | null): AutonomicBalance {
  if (hrv != null && hrv >= 50 && bpm < 70) return "parassimpatico";
  if ((hrv != null && hrv < 25) || bpm > 90) return "simpatico";
  return "equilibrado";
}

/** 0–100 — combinação inversa de BPM repouso e direta de HRV. */
function cardiacEfficiencyFrom(bpm: number, hrv: number | null): number {
  const bpmComp = Math.max(0, Math.min(100, 100 - (bpm - 50) * 1.8));
  const hrvComp = hrv == null ? 50 : Math.max(0, Math.min(100, hrv * 1.5));
  return Math.round(bpmComp * 0.55 + hrvComp * 0.45);
}

/** Uth-Sørensen: VO2max ≈ 15 × (FCmax/FCrepouso). Requer estimar FCmax ~ 195. */
function vo2maxFrom(bpm: number): number | null {
  if (bpm < 35 || bpm > 140) return null;
  const fcMax = 195;
  return Math.round(15 * (fcMax / bpm));
}

export function computeBiomarkers(bpm: number, hrv: number | null): Biomarkers {
  const stressScore = computeStressScore(bpm, hrv);
  return {
    stressScore,
    stressLevel: stressLevelFrom(stressScore),
    metabolicAge: computeMetabolicAge(bpm, hrv),
    recoveryLevel: recoveryFrom(hrv),
    autonomicBalance: autonomicFrom(bpm, hrv),
    cardiacEfficiency: cardiacEfficiencyFrom(bpm, hrv),
    vo2maxEstimate: vo2maxFrom(bpm),
  };
}

export const stressLabel: Record<StressLevel, string> = {
  baixo: "Baixo",
  moderado: "Moderado",
  alto: "Alto",
  muito_alto: "Muito alto",
};

export const recoveryLabel: Record<RecoveryLevel, string> = {
  excelente: "Excelente",
  boa: "Boa",
  regular: "Regular",
  baixa: "Baixa",
};

export const autonomicLabel: Record<AutonomicBalance, string> = {
  parassimpatico: "Parassimpático (descanso)",
  equilibrado: "Equilibrado",
  simpatico: "Simpático (ativado)",
};
