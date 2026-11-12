/**
 * Lê a triagem gravada nas notas da consulta (formato de ConsultaMedica.submitTriage) para o prontuário:
 * alertas fixos no topo (medicamentos/alergias, queixa) e o gráfico de evolução da intensidade (0 a 10).
 */
export interface TriageSummary {
  redFlags: string | null;
  complaint: string | null;
  duration: string | null;
  intensity: number | null;
  medsAllergies: string | null;
  goal: string | null;
}

function field(notes: string, label: RegExp): string | null {
  const line = notes.split(/\r?\n/).find((l) => label.test(l));
  if (!line) return null;
  const value = line.slice(line.indexOf(":") + 1).trim();
  return value || null;
}

export function parseTriageNotes(notes: string | null | undefined): TriageSummary {
  const text = notes ?? "";
  const complaintRaw = field(text, /^\s*2\.\s*Queixa principal/i);
  const durationMatch = complaintRaw?.match(/\(Tempo:\s*([^)]*)\)\s*$/i);
  const intensityRaw = field(text, /^\s*3\.\s*Intensidade/i);
  const intensityNum = intensityRaw ? Number(intensityRaw.match(/(\d+(?:[.,]\d+)?)/)?.[1]?.replace(",", ".")) : NaN;
  return {
    redFlags: field(text, /^\s*1\.\s*Sinais de alerta/i),
    complaint: complaintRaw ? complaintRaw.replace(/\s*\(Tempo:[^)]*\)\s*$/i, "").trim() || null : null,
    duration: durationMatch?.[1]?.trim() || null,
    intensity: Number.isFinite(intensityNum) && intensityNum >= 0 && intensityNum <= 10 ? intensityNum : null,
    medsAllergies: field(text, /^\s*4\.\s*Medicamentos/i),
    goal: field(text, /^\s*5\.\s*Objetivo/i),
  };
}

export interface IntensityPoint {
  at: string;
  label: string;
  intensity: number;
}

/** Pontos do gráfico em ordem cronológica, só de consultas com intensidade registrada. */
export function intensitySeries(rows: { created_at: string; notes: string | null }[]): IntensityPoint[] {
  return rows
    .map((r) => ({ at: r.created_at, intensity: parseTriageNotes(r.notes).intensity }))
    .filter((p): p is { at: string; intensity: number } => p.intensity !== null && Number.isFinite(Date.parse(p.at)))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .map((p) => ({
      ...p,
      label: new Date(p.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }),
    }));
}
