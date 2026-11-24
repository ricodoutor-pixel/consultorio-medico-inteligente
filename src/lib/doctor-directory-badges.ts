export type DirectoryBadge = "premium" | "vip" | null;

export interface DirectoryFacts {
  badge?: string | null;
  directory_rank?: number;
  paid_until?: string | null;
  registration_complete?: boolean;
  documents_count?: number;
}

export function directoryBadge(facts?: DirectoryFacts, now = Date.now()): DirectoryBadge {
  if (facts && "badge" in facts) return facts.badge === "premium" || facts.badge === "vip" ? facts.badge : null;
  if (facts?.paid_until && Date.parse(facts.paid_until) > now) return "premium";
  return facts?.registration_complete === true ? "vip" : null;
}

export function compareDirectoryDoctors(
  a: { name: string; directoryBadge?: DirectoryBadge; documentsCount?: number; directoryRank?: number },
  b: { name: string; directoryBadge?: DirectoryBadge; documentsCount?: number; directoryRank?: number },
): number {
  const rank = (badge?: DirectoryBadge) => badge === "premium" ? 0 : badge === "vip" ? 1 : 2;
  return rank(a.directoryBadge) - rank(b.directoryBadge)
    || (a.directoryRank != null || b.directoryRank != null
      ? (a.directoryRank ?? Number.MAX_SAFE_INTEGER) - (b.directoryRank ?? Number.MAX_SAFE_INTEGER)
      : (b.documentsCount ?? 0) - (a.documentsCount ?? 0))
    || a.name.localeCompare(b.name, "pt-BR");
}