export type DirectoryBadge = "premium" | "vip" | null;

export interface DirectoryFacts {
  paid_until?: string | null;
  registration_complete?: boolean;
  documents_count?: number;
}

export function directoryBadge(facts?: DirectoryFacts, now = Date.now()): DirectoryBadge {
  if (facts?.paid_until && Date.parse(facts.paid_until) > now) return "premium";
  return facts?.registration_complete === true ? "vip" : null;
}

export function compareDirectoryDoctors(
  a: { name: string; directoryBadge?: DirectoryBadge; documentsCount?: number },
  b: { name: string; directoryBadge?: DirectoryBadge; documentsCount?: number },
): number {
  const rank = (badge?: DirectoryBadge) => badge === "premium" ? 0 : badge === "vip" ? 1 : 2;
  return rank(a.directoryBadge) - rank(b.directoryBadge)
    || (b.documentsCount ?? 0) - (a.documentsCount ?? 0)
    || a.name.localeCompare(b.name, "pt-BR");
}