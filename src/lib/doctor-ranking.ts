/**
 * Ordem oficial de exibição dos médicos.
 *
 * Regra de negócio:
 * 1. Dr. Edilson Bezerra, Dra. Suelen Naves e Dr. Daniel Kobayashi ficam fixos
 *    nas 3 primeiras posições (nesta ordem).
 * 2. Depois deles, quem tem MAIS documentos anexados no cadastro (KYC) aparece
 *    primeiro — conforme o médico anexa documentos, ele sobe de nível.
 * 3. Empate é resolvido por ordem alfabética, garantindo lista estável.
 */

const PINNED: Array<{ names: string[]; registrations: string[] }> = [
  { names: ["edilson"], registrations: ["10963"] },
  { names: ["suelen"], registrations: ["49354"] },
  { names: ["daniel kobayashi", "kobayashi"], registrations: ["5460", "10346"] },
];

function normalize(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** 0, 1, 2 para os médicos fixos; 99 para os demais. */
export function pinnedDoctorRank(name: string | null | undefined, registration?: string | null): number {
  const n = normalize(name);
  const r = normalize(registration);
  for (let i = 0; i < PINNED.length; i += 1) {
    const entry = PINNED[i];
    if (entry.names.some((key) => n.includes(key))) return i;
    if (r && entry.registrations.some((key) => r.includes(key))) return i;
  }
  return 99;
}

export interface DoctorRankInput {
  name: string | null | undefined;
  registration?: string | null;
  /** Quantidade real de documentos anexados no cadastro KYC */
  docsCount: number;
}

/** Comparador único usado na vitrine pública e no painel de aprovações. */
export function compareDoctorsByCompleteness(a: DoctorRankInput, b: DoctorRankInput): number {
  const pinnedA = pinnedDoctorRank(a.name, a.registration);
  const pinnedB = pinnedDoctorRank(b.name, b.registration);
  if (pinnedA !== pinnedB) return pinnedA - pinnedB;
  if (a.docsCount !== b.docsCount) return b.docsCount - a.docsCount;
  return normalize(a.name).localeCompare(normalize(b.name));
}

/** Nível de destaque conquistado pelo médico conforme a documentação enviada. */
export type DoctorTier = "vip" | "avancado" | "intermediario" | "inicial";

export function doctorTierFromDocs(docsCount: number): DoctorTier {
  if (docsCount >= 6) return "vip";
  if (docsCount >= 4) return "avancado";
  if (docsCount >= 2) return "intermediario";
  return "inicial";
}

export const DOCTOR_TIER_LABEL: Record<DoctorTier, string> = {
  vip: "VIP · Dossiê completo",
  avancado: "Avançado",
  intermediario: "Intermediário",
  inicial: "Inicial",
};
