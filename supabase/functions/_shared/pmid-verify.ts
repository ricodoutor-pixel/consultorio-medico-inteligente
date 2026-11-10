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
 * Extrai população e desfecho do título (prioridade) e do resumo real do PubMed.
 * Nunca usa um desfecho genérico: sem medida identificável, manda conferir o artigo.
 */
const POPULATION_RULES: Array<[RegExp, string]> = [
  [/generali[sz]ed anxiety disorder|ansiedade generalizada/i, "pacientes com transtorno de ansiedade generalizada (TAG)"],
  [/breast cancer|c[âa]ncer de mama/i, "mulheres com câncer de mama avançado e ansiedade antes de exame de imagem"],
  [/social anxiety|social phobia|fobia social/i, "indivíduos com transtorno de ansiedade social (fobia social)"],
  [/test anxiety|ansiedade de prova/i, "estudantes universitários com ansiedade de prova"],
  [/college students?|university students?|undergraduates?/i, "estudantes universitários"],
  [/public speaking|\bspst\b/i, "voluntários sob teste de estresse de falar em público"],
  [/mild to moderate anxiety|moderate anxiety/i, "adultos com transtorno de ansiedade leve a moderado"],
  [/worr(?:y|iers?)/i, "adultos com preocupação elevada (traço de preocupação)"],
  [/healthy (?:volunteers?|subjects?|participants?|controls?|adults?)/i, "voluntários saudáveis"],
];

const OUTCOME_RULES: Array<[RegExp, string]> = [
  [/\bGAD-7\b/i, "escala GAD-7"],
  [/\bHAM-A\b|hamilton anxiety/i, "escala de Hamilton para ansiedade (HAM-A)"],
  [/\bVAMS\b|visual analog(?:ue)? mood scale/i, "escala analógica visual de humor (VAMS)"],
  [/\bSTAI\b|state-trait anxiety/i, "inventário de ansiedade traço-estado (STAI)"],
  [/worry severity|\bPSWQ\b/i, "gravidade da preocupação"],
  [/test anxiety/i, "ansiedade de prova autorrelatada"],
  [/emotional faces|functional magnetic resonance|\bfMRI\b/i, "respostas cerebrais a faces emocionais (ressonância magnética funcional)"],
  [/cerebral blood flow|\bSPECT\b/i, "fluxo sanguíneo cerebral regional (SPECT)"],
  [/anxiety symptoms|general anxiety|induced anxiety|anxiety (?:levels|scores)/i, "sintomas de ansiedade"],
  [/\bPSQI\b|sleep quality/i, "qualidade do sono (PSQI)"],
];

function pickPopulation(a: PubMedArticle): string {
  for (const source of [a.title, a.abstract]) {
    for (const [re, label] of POPULATION_RULES) if (re.test(source || "")) return label;
  }
  return "população não detalhada no resumo do PubMed — conferir o artigo";
}

function measuresIn(text: string): string[] {
  return OUTCOME_RULES.filter(([re]) => re.test(text)).map(([, label]) => label);
}

export function isGeneralizedAnxietyStudy(a: PubMedArticle): boolean {
  return pickPopulation(a).includes("(TAG)");
}

export function extractStudyPopulationAndOutcome(a: PubMedArticle): string {
  const population = pickPopulation(a);
  const abstract = a.abstract || "";
  const primary = abstract.match(/primary\s*(?:outcomes?|end\s*-?\s*points?|\()([\s\S]{0,260})/i);
  if (primary) {
    const segment = primary[1].split(/secondary|exploratory/i)[0];
    const found = measuresIn(segment);
    if (found.length) return `população: ${population}; desfecho primário: ${found.join("; ")}`;
  }
  const found = measuresIn(`${a.title} ${abstract}`);
  if (found.length) return `população: ${population}; desfechos avaliados: ${found.join("; ")}`;
  return `população: ${population}; desfecho: não detalhado no resumo do PubMed — conferir o artigo`;
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

  // Descarta parágrafos com citações escritos pelo modelo para evitar alucinação.
  // Parágrafo que anuncia uma lista (termina em ":") cuja lista foi descartada
  // recebe a lista conferida logo abaixo, para o corpo nunca ficar vazio.
  const LIST_SLOT = "\u0000LISTA_CONFERIDA\u0000";
  const paragraphs = sanitizedText.split(/\n\s*\n/);
  const isCitationParagraph = (p: string) => extractPmids(p).length > 0 || /\blink confirmado\b|\bet al\.?\s*\(?\d{4}/i.test(p);
  const kept: string[] = [];
  let slotPlaced = false;
  paragraphs.forEach((paragraph, i) => {
    if (isCitationParagraph(paragraph)) return;
    const dangling = /:\s*$/.test(paragraph.trim()) && i + 1 < paragraphs.length && isCitationParagraph(paragraphs[i + 1]);
    if (dangling && !slotPlaced) {
      kept.push(paragraph.trim().replace(/:\s*$/, " (estudos conferidos no PubMed):"));
      kept.push(LIST_SLOT);
      slotPlaced = true;
    } else if (dangling) {
      kept.push(paragraph.trim().replace(/:\s*$/, "."));
    } else {
      kept.push(paragraph);
    }
  });
  let body = kept.join("\n\n").replace(/\s*\[(?:Biblioteca interna|PubMed)\]/gi, "").trim();

  // Remove qualquer frase introdutória que prometa lista ('destaco os seguintes:', 'a seguir:', etc.)
  body = body
    .replace(/(?:destaco\s+(?:os\s+seguintes|as\s+seguintes)[^:\n]*:|a\s+seguir:|os\s+seguintes\s+(?:ensaios|estudos)[^:\n]*:|abaixo\s+est[aã]o[^:\n]*:|veja\s+os\s+estudos[^:\n]*:)\s*$/gi, "")
    .trim();

  if (lookup.status !== "ok") {
    body = body.replace(LIST_SLOT, "").replace(/\(estudos conferidos no PubMed\):/, ":").replace(/\n{3,}/g, "\n\n").trim();
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
    // Escalas como GAD-7 no resumo não tornam o estudo específico de TAG: decide pela população.
    const hasTagTrial = foundArticles.some(isGeneralizedAnxietyStudy);
    if (!hasTagTrial) {
      tagNotice = "⚠️ Observação clínica: nenhum destes ensaios clínicos é específico de Transtorno de Ansiedade Generalizada (TAG); as populações avaliadas foram outras (veja a população de cada estudo na lista).";
    }
  }

  const refsBlock = refs.length
    ? `📚 Referências conferidas agora no registro do PubMed (título, autor, revista e ano copiados do registro):\n${refs.join("\n")}`
    : "";
  const listBlock = [tagNotice, refsBlock].filter(Boolean).join("\n\n");

  if (noEvidence) return [noEvidence, listBlock].filter(Boolean).join("\n\n");
  if (body.includes(LIST_SLOT)) {
    return listBlock
      ? body.replace(LIST_SLOT, listBlock)
      : body.replace(LIST_SLOT, "").replace(/\(estudos conferidos no PubMed\):/, ".").replace(/\n{3,}/g, "\n\n").trim();
  }
  return [body, listBlock].filter(Boolean).join("\n\n");
}
