export const TRIAGE_KEYS = ["nome", "idade", "queixa", "tempo", "intensidade", "medicamentos", "canabinoides", "comorbidades", "objetivo", "red_flags"] as const;
export const RED_FLAG_OPTIONS = [
  { value: "nenhum", label: "Nenhum desses" },
  { value: "dor_peito_falta_ar", label: "Dor no peito / falta de ar" },
  { value: "desmaio_confusao", label: "Desmaio ou confusão" },
  { value: "sangramento_ativo", label: "Sangramento ativo" },
  { value: "autoagressao", label: "Pensamentos de me machucar" },
];
export function hasEmergency(triage: Record<string, unknown>): boolean {
  if (triage.emergency === true) return true;
  const normalize = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[\s_]+/g, "");
  const none = (v: unknown) => /^(nenhum.*|nao|no|none|false|0|-|\[\])?$/.test(normalize(v));
  const value = triage.red_flags;
  return Array.isArray(value) ? value.some(v => !none(v)) : value === true || (typeof value === "string" && !none(value));
}
export function invalidTriageFields(triage: Record<string, unknown>, complete = true): string[] {
  const fields: string[] = [];
  for (const key of TRIAGE_KEYS) {
    const value = triage[key];
    if (!complete && value === undefined) continue;
    if (typeof value !== "string" || !value.trim() || value.length > 4000) { fields.push(key); continue; }
    if (key === "idade" && (!/^\d{1,3}$/.test(value.trim()) || Number(value) > 120)) fields.push(key);
    if (key === "nome" && value.trim().length < 2) fields.push(key);
    if (key === "queixa" && value.trim().length < 3) fields.push(key);
  }
  return fields;
}
export function canEnterOrientation(order: { status?: string; flow_status?: string }, triage: Record<string, unknown>) {
  return ["approved", "completed", "dispatched"].includes(order.status ?? "") && invalidTriageFields(triage).length === 0 && !hasEmergency(triage);
}