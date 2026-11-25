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
