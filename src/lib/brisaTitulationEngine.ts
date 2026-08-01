export interface TitulationLog {
  date: string;
  drops: number;
  symptomScore: number; // 1 to 10 (10 = worst)
  sleepQuality: "good" | "regular" | "bad";
  sideEffects: "none" | "mild" | "moderate" | "severe";
  sideEffectDescription?: string;
}

export interface TitulationAnalysis {
  status: "ON_TRACK" | "NEEDS_ADJUSTMENT" | "ALERT_DOCTOR_REVISION";
  message: string;
  doctorSuggestion?: string;
}

export function analyzeTitulationLogs(logs: TitulationLog[]): TitulationAnalysis {
  if (!logs || logs.length === 0) {
    return {
      status: "ON_TRACK",
      message: "Aguardando o primeiro check-in do paciente."
    };
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentLogs = sortedLogs.slice(0, 3); // Look at last 3 days
  const lastLog = recentLogs[0];

  // 1. Red Flag: Efeitos colaterais graves ou moderados consecutivos
  let severeSideEffectsCount = 0;
  for (const log of recentLogs.slice(0, 2)) {
    if (log.sideEffects === "moderate" || log.sideEffects === "severe") {
      severeSideEffectsCount++;
    }
  }

  if (severeSideEffectsCount >= 2 || lastLog.sideEffects === "severe") {
    return {
      status: "ALERT_DOCTOR_REVISION",
      message: "Red Flag: Efeitos colaterais persistentes.",
      doctorSuggestion: "O paciente relatou efeitos colaterais moderados/graves repetidamente. Sugere-se redução imediata da dose (Step down) em 50% ou pausa de 48h, seguida de reintrodução gradual."
    };
  }

  // 2. Red Flag: Piora nos sintomas
  if (recentLogs.length >= 2) {
    const previousLog = recentLogs[1];
    if (lastLog.symptomScore > previousLog.symptomScore + 2 && lastLog.symptomScore >= 7) {
      return {
        status: "ALERT_DOCTOR_REVISION",
        message: "Red Flag: Piora aguda no quadro clínico.",
        doctorSuggestion: "O escore de sintomas piorou agudamente. Recomenda-se contato ativo via WhatsApp para entender se há fatores externos ou necessidade de intervenção imediata."
      };
    }
  }

  // 3. Needs Adjustment: Sintomas estagnados ou sono ruim
  if (recentLogs.length >= 3) {
    const allBadSleep = recentLogs.every(log => log.sleepQuality === "bad");
    const noSymptomImprovement = recentLogs.every(log => log.symptomScore >= 6);
    
    if (allBadSleep || noSymptomImprovement) {
      return {
        status: "NEEDS_ADJUSTMENT",
        message: "Titulação sub-terapêutica. Necessidade de ajuste.",
        doctorSuggestion: "O paciente não apresenta melhora clínica há 3 dias. Sugere-se aumento (Step up) de 1 gota na dosagem atual."
      };
    }
  }

  // 4. On Track
  return {
    status: "ON_TRACK",
    message: "Titulação avançando conforme o esperado.",
    doctorSuggestion: "Manter a posologia atual. O paciente relata boa tolerância e eficácia."
  };
}
