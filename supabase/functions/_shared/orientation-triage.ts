// Triagem curta da Orientação Técnica — 5 perguntas (v3, 07/11/2026).
// Nome e idade vêm do cadastro (não perguntar). Ordem das telas:
// 1) red_flags (emergência primeiro) · 2) queixa + tempo (mesma tela) ·
// 3) intensidade 0–10 · 4) medicamentos/alergias/condições (com "Nenhum") ·
// 5) objetivo (opcional). `objetivo` não é obrigatório para liberar a sala.
export const TRIAGE_KEYS = ["red_flags", "queixa", "tempo", "intensidade", "medicamentos", "objetivo"] as const;

// Chaves obrigatórias para liberar a sala (objetivo é opcional).
export const REQUIRED_TRIAGE_KEYS = ["red_flags", "queixa", "tempo", "intensidade", "medicamentos"] as const;

export const RED_FLAG_OPTIONS = [
  { value: "nenhum", label: "Não, nenhum destes sinais" },
  { value: "sim_emergencia", label: "Sim, estou com um destes sinais" },
];

export function hasEmergency(triage: Record<string, unknown>): boolean {
  if (triage.emergency === true) return true;
  const normalize = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[\s_]+/g, "");

  const none = (v: unknown) => /^(nenhum.*|nao.*|no|none|false|0|-|\[\])?$/.test(normalize(v));
  const value = triage.red_flags;
  return Array.isArray(value) ? value.some(v => !none(v)) : value === true || (typeof value === "string" && !none(value));
}

export function invalidTriageFields(triage: Record<string, unknown>, complete = true): string[] {
  const fields: string[] = [];
  for (const key of REQUIRED_TRIAGE_KEYS) {
    const value = triage[key];
    if (!complete && value === undefined) continue;
    if (typeof value !== "string" || !value.trim() || value.length > 4000) { fields.push(key); continue; }
    if (key === "queixa" && value.trim().length < 3) fields.push(key);
  }
  const objetivo = triage.objetivo;
  if (objetivo !== undefined && (typeof objetivo !== "string" || objetivo.length > 4000)) fields.push("objetivo");
  return fields;
}

export function canEnterOrientation(order: { status?: string; flow_status?: string }, triage: Record<string, unknown>) {
  return ["approved", "completed", "dispatched"].includes(order.status ?? "") && invalidTriageFields(triage).length === 0 && !hasEmergency(triage);
}
