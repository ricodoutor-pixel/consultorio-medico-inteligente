// 🌿 Planta y Raiz — Contexto científico (RAG) para a Enfª Brisa / Dr. Edilson On
// Busca full-text na base `scientific_articles` via RPC `search_scientific_articles`
// e devolve um bloco compacto de evidências para injetar no prompt do agente.
// A base é indexada em inglês; traduzimos os termos clínicos mais comuns em PT-BR.

const PT_EN: Array<[RegExp, string]> = [
  [/epileps|convuls|crise convulsiva/i, "epilepsy seizures"],
  [/autis|tea\b/i, "autism spectrum disorder"],
  [/ansiedade|panico|pânico/i, "anxiety"],
  [/insonia|insônia|dormir|sono/i, "insomnia sleep"],
  [/dor cronica|dor crônica|fibromialgi/i, "chronic pain fibromyalgia"],
  [/parkinson/i, "parkinson disease"],
  [/alzheimer|demenci|demênci/i, "alzheimer dementia"],
  [/cancer|câncer|oncolog|quimioterap/i, "cancer chemotherapy"],
  [/enxaqueca|migran/i, "migraine"],
  [/depress/i, "depression"],
  [/artrit|artros|inflama/i, "arthritis inflammation"],
  [/esclerose multipla|esclerose múltipla/i, "multiple sclerosis spasticity"],
  [/tdah/i, "adhd"],
  [/endometrios/i, "endometriosis"],
  [/glaucoma/i, "glaucoma"],
  [/nausea|náusea|vomito|vômito/i, "nausea vomiting"],
  [/apetite|caquexi/i, "appetite cachexia"],
  [/avc|derrame/i, "stroke"],
  [/diabet/i, "diabetes"],
  [/cbd|canabidiol/i, "cannabidiol"],
  [/thc|tetrahidro/i, "thc tetrahydrocannabinol"],
  [/cbg/i, "cannabigerol"],
  [/dose|posologi|titula/i, "cannabidiol dosing titration"],
];

export interface ScientificEvidence {
  title: string;
  year: number | null;
  url: string | null;
  doi: string | null;
  doiVerified: boolean;
  abstract: string;
}

/** Valida um DOI no Crossref antes de liberá-lo como link ao paciente. */
export async function validateDoi(doi: string): Promise<boolean> {
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!/^10\.\d{4,9}\/\S+$/.test(clean)) return false;
  try {
    const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(clean)}`, {
      headers: { "User-Agent": "PlantaYRaiz-Orientacao/1.0 (mailto:contato@plantayraiz.com.br)" },
      signal: AbortSignal.timeout(4_000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Converte a fala do paciente em uma consulta útil para o índice em inglês. */
export function buildSearchQuery(text: string): string {
  const terms = new Set<string>();
  for (const [re, en] of PT_EN) {
    if (re.test(text)) en.split(/\s+/).forEach((t) => terms.add(t));
  }
  if (terms.size === 0) {
    // fallback: palavras significativas da própria mensagem
    text
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5)
      .forEach((w) => terms.add(w));
    terms.add("cannabinoid");
  }
  return Array.from(terms).slice(0, 8).join(" ");
}

/** Busca evidências científicas reais na base da plataforma. */
export async function fetchScientificEvidence(
  text: string,
  limit = 3,
): Promise<ScientificEvidence[]> {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key || !text) return [];

  const query = buildSearchQuery(text);
  if (!query) return [];

  try {
    const r = await fetch(`${url}/rest/v1/rpc/search_scientific_articles`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query_text: query, limit_count: Math.min(limit, 5) }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) return [];
    const rows = (await r.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows)) return [];
    const mapped = rows.map((a) => ({
      title: String(a.title ?? "").slice(0, 220),
      year: a.year ? Number(a.year) : null,
      url: a.url ? String(a.url) : null,
      doi: a.doi ? String(a.doi) : null,
      doiVerified: false,
      abstract: String(a.abstract ?? "").slice(0, 400),
    }));
    // Valida cada DOI no Crossref em paralelo: só DOI confirmado vira link ao paciente.
    await Promise.all(
      mapped.map(async (e) => {
        if (e.doi) e.doiVerified = await validateDoi(e.doi);
      }),
    );
    return mapped;
  } catch {
    return [];
  }
}

/** Lê a contagem real de estudos da base (fonte única para qualquer número citado). */
export async function fetchScientificCount(): Promise<number | null> {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) return null;
  try {
    const r = await fetch(`${url}/rest/v1/scientific_articles?select=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!r.ok) return null;
    const range = r.headers.get("content-range") || "";
    const total = Number(range.split("/")[1]);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}

/** Bloco de texto pronto para injetar no system prompt do agente. */
export async function buildScientificContextBlock(text: string, limit = 3): Promise<string> {
  const [evidence, count] = await Promise.all([
    fetchScientificEvidence(text, limit),
    fetchScientificCount(),
  ]);
  const countLine = count !== null
    ? `A biblioteca científica da Planta y Raiz tem ${count.toLocaleString("pt-BR")} registros neste momento. Se perguntarem o tamanho da base, responda com a frase "registros na nossa biblioteca" usando este número, SEM a palavra "exatamente" e sem afirmar que são todos estudos únicos. NUNCA afirme outro número (ex.: "centenas", "40 mil").`
    : `Não foi possível medir o tamanho da biblioteca agora. Se perguntarem quantos registros existem, diga que não tem o número neste momento — nunca invente.`;

  const linkRules = `REGRAS DE LINK (obrigatórias):
- Se o paciente pedir "o link" de um estudo, entregue SOMENTE um link marcado abaixo como "link confirmado" (https://doi.org/... ou a URL listada), clicável e completo.
- Se o estudo não tiver link confirmado, diga com honestidade: "não consegui confirmar o link deste estudo" — NUNCA entregue um DOI solto como se fosse link nem monte um link por conta própria.`;

  if (evidence.length === 0) {
    return `

=== BASE CIENTÍFICA INTERNA ===
${countLine}
A busca para esta pergunta NÃO retornou estudos. Diga com honestidade: "Não encontrei estudo na nossa base sobre isso." Nunca cite estudo, DOI, revista ou ano que não esteja listado aqui.
${linkRules}
=== FIM DA BASE CIENTÍFICA ===`;
  }

  const list = evidence
    .map((e, i) => {
      const link = e.doiVerified && e.doi
        ? ` — link confirmado: https://doi.org/${e.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`
        : e.url
          ? ` — link confirmado: ${e.url}`
          : e.doi
            ? ` — DOI ${e.doi} (link NÃO confirmado: não entregue ao paciente)`
            : " — sem link confirmado (não entregue link ao paciente)";
      return `[${i + 1}] ${e.title}${e.year ? ` (${e.year})` : ""}${link}\n${e.abstract}`;
    })
    .join("\n\n");
  return `

=== BASE CIENTÍFICA INTERNA (uso obrigatório quando pertinente) ===
${countLine}
Estes são estudos reais da biblioteca científica da Planta y Raiz, recuperados por busca nesta pergunta.
Cite SOMENTE o que está listado aqui, com título e ano; ao mencionar no relatório, inclua apenas link confirmado.
Nunca invente referências, DOI, revistas ou anos. Sem prometer cura, sem diagnosticar e sem prescrever.
${linkRules}

${list}
=== FIM DA BASE CIENTÍFICA ===`;
}
