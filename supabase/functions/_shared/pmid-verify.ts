// Verificação obrigatória de PMIDs: título, primeiro autor, revista e ano
// são copiados do registro real do PubMed (EFetch), nunca do texto do modelo.
import { parsePubMedArticles, type PubMedArticle } from "./pubmed-live.ts";

export interface PmidLookup {
  status: "ok" | "unavailable";
  found: Map<string, PubMedArticle>;
  missing: string[];
}

/** Extrai PMIDs citados ("PMID 123", "PMID: 123", "pubmed.ncbi.nlm.nih.gov/123"). */
export function extractPmids(text: string): string[] {
  const ids = new Set<string>();
  for (const m of text.matchAll(/PMID\s*(?:n[ºo°.]*\s*)?[:#]?\s*(\d{1,9})\b/gi)) ids.add(String(Number(m[1])));
  for (const m of text.matchAll(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{1,9})/gi)) ids.add(String(Number(m[1])));
  return [...ids].filter((id) => id !== "0").slice(0, 10);
}

const env = (name: string): string => {
  const runtime = globalThis as typeof globalThis & { Deno?: { env: { get(key: string): string | undefined } } };
  return runtime.Deno?.env.get(name) || "";
};

/** Busca real no PubMed. Falha de rede/API => "unavailable" (nunca inventar). */
export async function lookupPmids(ids: string[]): Promise<PmidLookup> {
  const found = new Map<string, PubMedArticle>();
  if (!ids.length) return { status: "ok", found, missing: [] };
  try {
    const params = new URLSearchParams({ db: "pubmed", tool: "PlantaYRaiz", id: ids.join(","), retmode: "xml" });
    const apiKey = env("PUBMED_API_KEY");
    if (apiKey) params.set("api_key", apiKey);
    const res = await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params, signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) throw new Error("pubmed_unavailable");
    const xml = await res.text();
    if (!/PubmedArticleSet/.test(xml)) throw new Error("pubmed_invalid");
    for (const a of parsePubMedArticles(xml)) found.set(a.pmid, a);
    return { status: "ok", found, missing: ids.filter((id) => !found.has(id)) };
  } catch {
    return { status: "unavailable", found: new Map(), missing: [] };
  }
}

/** Bloco de contexto com os registros reais dos PMIDs citados pelo paciente. */
export function buildPatientPmidBlock(lookup: PmidLookup, ids: string[]): string {
  if (!ids.length) return "";
  const lines = ids.map((id) => {
    if (lookup.status !== "ok") return `PMID ${id}: NÃO CONFERIDO (PubMed indisponível agora). Diga "não consegui conferir este PMID agora". Não descreva o artigo.`;
    const a = lookup.found.get(id);
    if (!a) return `PMID ${id}: NÃO EXISTE no PubMed. Diga que esse PMID não existe.`;
    return `PMID ${id}: título "${a.title}"; primeiro autor ${a.firstAuthor || "não informado"}; revista ${a.journal || "não informada"}; ano ${a.year ?? "não informado"}.\nResumo: ${a.abstract.slice(0, 1200) || "não disponível"}`;
  });
  return `\n\n=== PMIDs PEDIDOS PELO PACIENTE — REGISTRO REAL CONSULTADO AGORA NO PUBMED ===\n${lines.join("\n")}\nUse SOMENTE estes dados. Se algo dito antes na conversa contradiz este registro, diga claramente que a informação anterior estava errada.\n=== FIM ===`;
}

const fmt = (a: PubMedArticle, inLibrary: boolean) =>
  `• PMID ${a.pmid} ${inLibrary ? "[Biblioteca interna]" : "[PubMed]"} — ${a.firstAuthor || "autor não informado"}${a.authors.includes(",") ? " et al." : ""}. ${a.title} ${a.journal || "revista não informada"}${a.year ? `, ${a.year}` : ""}. ${a.url}`;

/**
 * Remove metadados escritos pelo modelo ao lado de PMIDs e anexa a lista
 * conferida no registro real. Rótulos de origem vêm do banco/API.
 */
export function applyCitationVerification(text: string, lookup: PmidLookup, libraryPmids: Set<string>): string {
  const ids = extractPmids(text);
  if (!ids.length) return text;
  // Rótulos de origem escritos pelo modelo não são confiáveis.
  let body = text.replace(/\s*\[(?:Biblioteca interna|PubMed)\]/gi, "");
  if (lookup.status !== "ok") {
    body = body.replace(/segundo o pubmed|conforme o pubmed|link confirmado|confirmad[oa] no pubmed/gi, "(não conferido)");
    return `${body}\n\n⚠️ Não consegui conferir agora no PubMed os PMIDs citados (${ids.join(", ")}). Considere essas referências NÃO verificadas até nova conferência.`;
  }
  const refs: string[] = [];
  for (const id of ids) {
    const a = lookup.found.get(id);
    refs.push(a ? fmt(a, libraryPmids.has(id)) : `• PMID ${id}: não existe no PubMed — desconsidere esta citação.`);
  }
  return `${body}\n\n📚 Referências conferidas agora no registro do PubMed (título, autor, revista e ano copiados do registro):\n${refs.join("\n")}`;
}
