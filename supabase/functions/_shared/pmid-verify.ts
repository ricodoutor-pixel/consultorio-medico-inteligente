// Verificação obrigatória de PMIDs: título, primeiro autor, revista e ano
// são copiados do registro real do PubMed (EFetch), nunca do texto do modelo.
import { parsePubMedArticles, formatCheckedAtPtBR, type PubMedArticle } from "./pubmed-live.ts";
import { matchesRequestedEvidence, requestsRandomizedTrial } from "./citation-relevance.ts";

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

/**
 * Extrai população e desfecho fielmente do título e do resumo do PubMed.
 */
export function extractStudyPopulationAndOutcome(a: PubMedArticle): string {
  const combined = `${a.title} ${a.abstract}`.toLowerCase();
  let population = "";
  let outcome = "";

  // 1. População
  if (combined.includes("breast cancer") || combined.includes("mammograph") || combined.includes("biopsy")) {
    population = "mulheres antes de biópsia ou exame de imagem em câncer de mama";
  } else if (combined.includes("social anxiety disorder") || combined.includes("social phobia") || combined.includes("sad")) {
    population = "indivíduos com transtorno de ansiedade social (fobia social)";
  } else if (combined.includes("public speaking") || combined.includes("spst") || combined.includes("speech")) {
    population = "voluntários sob teste de estresse de falar em público";
  } else if (combined.includes("mild to moderate anxiety") || combined.includes("moderate anxiety")) {
    population = "adultos com ansiedade leve a moderada";
  } else if (combined.includes("worry") || combined.includes("non-clinical")) {
    population = "adultos com preocupação excessiva e ansiedade não clínica";
  } else if (combined.includes("healthy volunteer") || combined.includes("healthy subject") || combined.includes("healthy participant")) {
    population = "voluntários saudáveis sob modelo experimental de estresse";
  } else if (combined.includes("generalized anxiety") || combined.includes("ansiedade generalizada")) {
    population = "pacientes com transtorno de ansiedade generalizada (TAG)";
  } else {
    population = "participantes adultos avaliados no ensaio clínico";
  }

  // 2. Desfecho
  if (combined.includes("brain") || combined.includes("fmri") || combined.includes("spect") || combined.includes("cerebral blood flow") || combined.includes("neural")) {
    outcome = "fluxo sanguíneo cerebral regional e escores de ansiedade";
  } else if (combined.includes("vams") || combined.includes("visual analogue mood scale")) {
    outcome = "escala analógica visual de humor (VAMS)";
  } else if (combined.includes("stai") || combined.includes("state-trait")) {
    outcome = "inventário de ansiedade traço-estado (STAI)";
  } else if (combined.includes("ham-a") || combined.includes("hamilton")) {
    outcome = "escala de ansiedade de Hamilton (HAM-A)";
  } else {
    outcome = "escala de ansiedade e sintomas clínicos";
  }

  return `população: ${population}; desfecho primário: ${outcome}`;
}

const fmt = (a: PubMedArticle, inLibrary: boolean) =>
  `• PMID ${a.pmid} ${inLibrary ? "[Biblioteca interna]" : "[PubMed]"} — ${a.firstAuthor || "autor não informado"}${a.authors.includes(",") ? " et al" : ""}. ${a.title} ${a.journal || "revista não informada"}${a.year ? `, ${a.year}` : ""}. ${a.url}\n  População e desfecho: ${extractStudyPopulationAndOutcome(a)}.`;

/**
 * Remove metadados escritos pelo modelo ao lado de PMIDs e anexa a lista
 * conferida no registro real com população, desfecho e data em pt-BR.
 */
export function applyCitationVerification(text: string, lookup: PmidLookup, libraryPmids: Set<string>, question = ""): string {
  // Converte qualquer data residual ISO UTC (com T e Z) para formato legível em português São Paulo
  let sanitizedText = text.replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, (iso) => {
    try {
      return formatCheckedAtPtBR(new Date(iso));
    } catch {
      return iso;
    }
  });

  const ids = extractPmids(sanitizedText);
  if (!ids.length) return sanitizedText;

  // Descarta parágrafos com citações escritos pelo modelo para evitar alucinação
  let body = sanitizedText.split(/\n\s*\n/).filter(paragraph =>
    !extractPmids(paragraph).length &&
    !/\blink confirmado\b|\bet al\.?\s*\(?\d{4}/i.test(paragraph)
  ).join("\n\n").replace(/\s*\[(?:Biblioteca interna|PubMed)\]/gi, "").trim();

  // Remove qualquer frase introdutória que prometa lista ('destaco os seguintes:', 'a seguir:', etc.)
  body = body
    .replace(/(?:destaco\s+(?:os\s+seguintes|as\s+seguintes)[^:\n]*:|a\s+seguir:|os\s+seguintes\s+(?:ensaios|estudos)[^:\n]*:|abaixo\s+est[aã]o[^:\n]*:|veja\s+os\s+estudos[^:\n]*:)\s*$/gi, "")
    .trim();

  if (lookup.status !== "ok") {
    return `${body}\n\n⚠️ Não consegui conferir agora no PubMed os PMIDs citados (${ids.join(", ")}). Considere essas referências NÃO verificadas até nova conferência.`;
  }

  const refs: string[] = [];
  const foundArticles: PubMedArticle[] = [];
  for (const id of ids) {
    const a = lookup.found.get(id);
    if (a && matchesRequestedEvidence(a, question)) {
      refs.push(fmt(a, libraryPmids.has(id)));
      foundArticles.push(a);
    } else if (!a) {
      refs.push(`• PMID ${id}: não existe no PubMed — desconsidere esta citação.`);
    }
  }

  const relevant = ids.some(id => {
    const article = lookup.found.get(id);
    return article && matchesRequestedEvidence(article, question);
  });

  const noEvidence = question && !relevant
    ? requestsRandomizedTrial(question) ? "Não encontrei ensaio randomizado sobre isso nos registros conferidos." : "Não encontrei estudo confiável sobre isso nos registros conferidos."
    : "";

  // Verificação de Transtorno de Ansiedade Generalizada (TAG)
  let tagNotice = "";
  const isAnxietyQuery = /ansiedade|anxiety|transtorno\s+de\s+ansiedade|\btag\b|gad\b/i.test(question);
  if (isAnxietyQuery && foundArticles.length > 0) {
    const hasTagTrial = foundArticles.some(a =>
      /generalized\s+anxiety|ansiedade\s+generalizada|\btag\b|\bgad\b/i.test(`${a.title} ${a.abstract}`)
    );
    if (!hasTagTrial) {
      tagNotice = "⚠️ Observação clínica: nenhum destes ensaios clínicos é específico de Transtorno de Ansiedade Generalizada (TAG); as populações avaliadas foram outras formas de ansiedade situacional, teste de fala pública, fobia social ou ansiedade leve a moderada.";
    }
  }

  return [
    noEvidence || body,
    tagNotice,
    refs.length ? `📚 Referências conferidas agora no registro do PubMed (título, autor, revista e ano copiados do registro):\n${refs.join("\n")}` : ""
  ].filter(Boolean).join("\n\n");
}
