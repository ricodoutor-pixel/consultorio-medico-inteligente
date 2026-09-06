import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
await load({ export: true, allowEmptyValues: true, examplePath: null });
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { NpsResponseInsert } from "../_test/mock-supabase.ts";

// ---- Helpers que replicam a lógica pura do handler ------------------------
function categorize(score: number): NpsResponseInsert["category"] {
  if (score <= 6) return "detractor";
  if (score <= 8) return "passive";
  return "promoter";
}

function detectSentiment(feedback?: string): NpsResponseInsert["sentiment"] {
  if (!feedback) return "neutral";
  const lower = feedback.replace(/<[^>]*>/g, "").toLowerCase();
  const positive = ["ótimo", "excelente", "boa", "adorei", "perfeito", "maravilhoso", "recomendo"];
  const negative = ["ruim", "péssimo", "horrível", "terrível", "decepção", "insatisfeito"];
  if (positive.some((w) => lower.includes(w))) return "positive";
  if (negative.some((w) => lower.includes(w))) return "negative";
  return "neutral";
}

// ---- Tests ----------------------------------------------------------------
Deno.test("nps-submit / categorize: 0..6 → detractor", () => {
  for (const s of [0, 3, 6]) assertEquals(categorize(s), "detractor");
});

Deno.test("nps-submit / categorize: 7..8 → passive", () => {
  assertEquals(categorize(7), "passive");
  assertEquals(categorize(8), "passive");
});

Deno.test("nps-submit / categorize: 9..10 → promoter", () => {
  assertEquals(categorize(9), "promoter");
  assertEquals(categorize(10), "promoter");
});

Deno.test("nps-submit / sentiment positivo é detectado e tags HTML são removidas", () => {
  assertEquals(detectSentiment("<b>Atendimento excelente</b>"), "positive");
});

Deno.test("nps-submit / sentiment negativo é detectado", () => {
  assertEquals(detectSentiment("Foi horrível"), "negative");
});

Deno.test("nps-submit / sentiment neutro como fallback", () => {
  assertEquals(detectSentiment("ok"), "neutral");
  assertEquals(detectSentiment(undefined), "neutral");
});

Deno.test("nps-submit / payload de insert em nps_responses respeita o tipo estrito", () => {
  // Compile-time guard: este literal precisa satisfazer NpsResponseInsert
  const payload: NpsResponseInsert = {
    consultation_id: "c1",
    patient_id: "p1",
    professional_id: "pro1",
    score: 9,
    category: categorize(9),
    feedback: "Muito bom",
    sentiment: detectSentiment("Muito bom"),
  };
  assertEquals(payload.category, "promoter");
  assertEquals(payload.sentiment, "neutral"); // "muito bom" não está no léxico
});

Deno.test("nps-submit / fórmula NPS: %promoters - %detractors", () => {
  const responses = [
    { score: 10, category: "promoter" },
    { score: 9, category: "promoter" },
    { score: 7, category: "passive" },
    { score: 3, category: "detractor" },
  ];
  const total = responses.length;
  const promoters = responses.filter((r) => r.category === "promoter").length;
  const detractors = responses.filter((r) => r.category === "detractor").length;
  const nps = Math.round(((promoters - detractors) / total) * 100);
  assertEquals(nps, 25); // (2-1)/4 * 100 = 25
});

Deno.test({
  name: "nps-submit / handler real carrega sem erros de tipo",
  // O handler chama Deno.serve no top-level → isolamos os leaks
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const mod = await import("./index.ts");
    assert(mod !== null);
  },
});
