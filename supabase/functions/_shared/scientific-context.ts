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
  abstract: string;
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
    return rows.map((a) => ({
      title: String(a.title ?? "").slice(0, 220),
      year: a.year ? Number(a.year) : null,
      url: a.url ? String(a.url) : null,
      doi: a.doi ? String(a.doi) : null,
      abstract: String(a.abstract ?? "").slice(0, 400),
    }));
  } catch {
    return [];
  }
}

/** Bloco de texto pronto para injetar no system prompt do agente. */
export async function buildScientificContextBlock(text: string, limit = 3): Promise<string> {
  const evidence = await fetchScientificEvidence(text, limit);
  if (evidence.length === 0) return "";
  const list = evidence
    .map(
      (e, i) =>
        `[${i + 1}] ${e.title}${e.year ? ` (${e.year})` : ""}${e.doi ? ` — DOI ${e.doi}` : ""}\n${e.abstract}`,
    )
    .join("\n\n");
  return `

=== BASE CIENTÍFICA INTERNA (uso obrigatório quando pertinente) ===
Estes são estudos reais da biblioteca científica da Planta y Raiz.
Cite-os de forma simples ("estudos recentes indicam..."), sem prometer cura,
sem diagnosticar e sem prescrever. Nunca invente referências.

${list}
=== FIM DA BASE CIENTÍFICA ===`;
}
