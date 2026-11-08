import { extractPmids, lookupPmids, type PmidLookup } from "./pmid-verify.ts";

/** Buffer the complete response; never expose model-written bibliographic metadata. */
export async function verifyCopilotResponse(
  generated: string,
  lookup: (ids: string[]) => Promise<PmidLookup> = lookupPmids,
): Promise<{ success: true; result: string; source: string }> {
  const ids = extractPmids(generated);
  if (!ids.length) return { success: true, result: generated, source: "google/gemini-3.8-flash" };
  const records = await lookup(ids);
  // Replace the entire citation-bearing line, including any invented author/title.
  // Additional IDs beyond the bounded lookup are omitted, never marked verified.
  const body = generated.split("\n").map(line => {
    if (!/PMID\s*(?:n[ºo°.]*\s*)?[:#]?\s*\d|pubmed\.ncbi\.nlm\.nih\.gov\/\d/i.test(line)) return line;
    return extractPmids(line).map(id => {
      if (records.status !== "ok") return `Referência PMID ${id}: não consegui conferir no PubMed; citação omitida.`;
      const article = records.found.get(id);
      if (!article || !ids.includes(id)) return `Referência PMID ${id}: não confirmada no PubMed; citação omitida.`;
      return `Referência PMID ${id}: ${article.firstAuthor || "autoria não informada no registro"}. ${article.title} ${article.journal || "revista não informada"}${article.year ? `, ${article.year}` : ""}. ${article.url}`;
    }).join("\n");
  }).join("\n");
  return { success: true, result: body, source: "google/gemini-3.8-flash" };
}