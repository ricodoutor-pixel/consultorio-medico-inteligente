/**
 * Áreas de atuação exibidas nos cartões dos médicos.
 * "Medicina Canabinoide" não é especialidade com RQE no CFM: só aparece se o próprio item citar RQE.
 */
const NEEDS_RQE = /canabin/i;

export function publicPracticeAreas(tags?: string[] | null): string[] {
  return (tags || []).filter((t) => !NEEDS_RQE.test(t) || /RQE/i.test(t));
}

export function primaryPracticeArea(p: { specialty?: string | null; tags?: string[] | null; category: string }): string {
  if (p.specialty && (!NEEDS_RQE.test(p.specialty) || /RQE/i.test(p.specialty))) return p.specialty;
  return publicPracticeAreas(p.tags)[0] || p.category;
}

/**
 * Título curto do médico em telas de pagamento: texto livre do perfil só vira
 * especialidade com RQE; sem RQE aparece como "Áreas de atuação" e sem itens canabinoides.
 */
export function doctorAreaLabel(specialty?: string | null): string | null {
  const text = (specialty || "").trim();
  if (!text) return null;
  if (/RQE/i.test(text)) return text;
  const areas = text.split(/\s*[,;·|]\s*|\s+e\s+/).map((s) => s.trim()).filter((s) => s && !NEEDS_RQE.test(s));
  return areas.length ? `Áreas de atuação: ${areas.join(", ")}` : null;
}
