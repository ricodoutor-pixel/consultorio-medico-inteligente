import { XMLParser } from "npm:fast-xml-parser@5.12.0";

export interface PubMedArticle {
  title: string;
  authors: string;
  year: number | null;
  url: string;
  doi: string | null;
  abstract: string;
  publicationTypes: string[];
}
export interface PubMedSearchResult {
  query: string;
  total: number | null;
  checkedAt: string;
  status: "ok" | "unavailable" | "no_clinical_terms";
  articles: PubMedArticle[];
}

// Only these fixed clinical vocabulary strings may leave the platform.
// Never send a patient's original message, name, contact or medical record to NCBI.
const CLINICAL_TERMS: Array<[RegExp, string]> = [
  [/ansiedade|anxiety|p[aâ]nico/i, "anxiety"],
  [/ins[oô]nia|sono|sleep|insomnia/i, "sleep"],
  [/dor|pain|fibromialg/i, "pain"],
  [/epileps|convuls|seizure/i, "epilepsy"],
  [/autis|\btea\b/i, "autism"],
  [/parkinson/i, "parkinson"],
  [/alzheimer|dem[eê]ncia|dementia/i, "dementia"],
  [/c[aâ]ncer|oncolog|chemotherapy|quimioterap/i, "cancer"],
  [/depress/i, "depression"],
  [/esclerose|multiple sclerosis|espastic/i, "multiple sclerosis"],
  [/enxaqueca|migraine/i, "migraine"],
  [/artrit|arthritis/i, "arthritis"],
  [/endometrio/i, "endometriosis"],
  [/glaucoma/i, "glaucoma"],
  [/n[aá]usea|v[oô]mito|nausea/i, "nausea"],
  [/tdah|adhd/i, "adhd"],
  [/sertralina|sertraline/i, "sertraline"],
  [/intera[cç][aã]o|interactions|cyp2|cyp3/i, "drug interactions"],
];
const CANNABIS_QUERY = '("medical cannabis"[Title/Abstract] OR cannabinoids[Title/Abstract] OR cannabidiol[Title/Abstract] OR "therapeutic cannabis"[Title/Abstract])';

export function buildPrivatePubMedQuery(text: string): string | null {
  const terms = CLINICAL_TERMS.filter(([re]) => re.test(text)).map(([, term]) => term).slice(0, 4);
  if (!terms.length && !/cannabis|canabino|cannabino|canabidiol|cannabidiol|\bcbd\b|\bthc\b|pubmed/i.test(text)) return null;
  return terms.length
    ? `${CANNABIS_QUERY} AND (${terms.map(term => `"${term}"[Title/Abstract]`).join(" AND ")})`
    : CANNABIS_QUERY;
}

const env = (name: string): string => {
  const runtime = globalThis as typeof globalThis & { Deno?: { env: { get(key: string): string | undefined } } };
  return runtime.Deno?.env.get(name) || "";
};
const cache = new Map<string, { expires: number; result: PubMedSearchResult }>();
const list = (value: unknown): unknown[] => value == null ? [] : Array.isArray(value) ? value : [value];
const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
const textValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textValue).join(" ");
  return Object.entries(record(value)).filter(([key]) => !key.startsWith("@_")).map(([, item]) => textValue(item)).join(" ");
};

export function parsePubMedArticles(xml: string): PubMedArticle[] {
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: true }).parse(xml);
  return list(parsed?.PubmedArticleSet?.PubmedArticle).flatMap(item => {
    const row = record(item);
    const citation = record(row.MedlineCitation);
    const article = record(citation.Article);
    const pmid = textValue(citation.PMID);
    const title = textValue(article.ArticleTitle);
    if (!/^\d+$/.test(pmid) || !title) return [];
    const ids = list(record(row.PubmedData).ArticleIdList && record(record(row.PubmedData).ArticleIdList).ArticleId);
    const doi = ids.find(id => record(id)["@_IdType"] === "doi");
    const date = record(record(record(article.Journal).JournalIssue).PubDate);
    const yearMatch = textValue(date.Year || date.MedlineDate).match(/\b(19|20)\d{2}\b/);
    return [{
      title: title.slice(0, 350),
      authors: list(record(article.AuthorList).Author).map(author => {
        const a = record(author);
        return textValue(a.CollectiveName) || `${textValue(a.LastName)} ${textValue(a.Initials)}`.trim();
      }).filter(Boolean).join(", ").slice(0, 500),
      year: yearMatch ? Number(yearMatch[0]) : null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      doi: doi ? textValue(doi) : null,
      abstract: textValue(record(article.Abstract).AbstractText).slice(0, 2500),
      publicationTypes: list(record(article.PublicationTypeList).PublicationType).map(textValue),
    }];
  });
}

export async function searchLivePubMed(text: string, limit = 3): Promise<PubMedSearchResult> {
  const query = buildPrivatePubMedQuery(text);
  const checkedAt = new Date().toISOString();
  if (!query) return { query: "", total: null, checkedAt, status: "no_clinical_terms", articles: [] };
  const boundedLimit = Math.max(1, Math.min(5, Math.floor(limit) || 3));
  const cacheKey = `${query}:${boundedLimit}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.result;
  const request = async (path: string, fields: Record<string, string>) => {
    const params = new URLSearchParams({ db: "pubmed", tool: "PlantaYRaiz", ...fields });
    const apiKey = env("PUBMED_API_KEY");
    if (apiKey) params.set("api_key", apiKey);
    // POST keeps API keys out of request URLs and telemetry.
    const response = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/${path}`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params, signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error("pubmed_unavailable");
    return response;
  };
  try {
    const search = await (await request("esearch.fcgi", { term: query, retmode: "json", retmax: String(boundedLimit), sort: "relevance" })).json();
    const result = search.esearchresult;
    if (!result || result.errorlist || search.error) throw new Error("pubmed_invalid_search");
    const total = Number(result.count);
    if (!Number.isFinite(total) || total < 0) throw new Error("pubmed_invalid_count");
    const ids = list(result.idlist).map(String).filter(id => /^\d+$/.test(id)).slice(0, boundedLimit);
    const articles = ids.length ? parsePubMedArticles(await (await request("efetch.fcgi", { id: ids.join(","), retmode: "xml" })).text()) : [];
    if (ids.length && !articles.length) throw new Error("pubmed_invalid_records");
    const response: PubMedSearchResult = { query, total, checkedAt, status: "ok", articles };
    if (cache.size >= 100) cache.clear();
    cache.set(cacheKey, { expires: Date.now() + 300_000, result: response });
    return response;
  } catch {
    return { query, total: null, checkedAt, status: "unavailable", articles: [] };
  }
}