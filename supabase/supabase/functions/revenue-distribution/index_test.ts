import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
await load({ export: true, allowEmptyValues: true, examplePath: null });
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { RevenuePoolRow } from "../_test/mock-supabase.ts";

const DISTRIBUTION_RATE = 0.10;

// --- Replica das fórmulas puras do handler (linhas 38-70 do index.ts) -----
function computePool(appointments: { amount: number }[]) {
  const totalRevenue = appointments.reduce((s, a) => s + (a.amount || 0), 0);
  return { totalRevenue, distributionPool: totalRevenue * DISTRIBUTION_RATE };
}

interface DoctorMetric {
  doctor_id: string;
  consultations_count: number;
  hours_online: number | string;
  average_rating: number | string;
  tier_multiplier: number | string;
  weighted_score: number | string;
}

function computeDistribution(metrics: DoctorMetric[], distributionPool: number) {
  const doctorScores = metrics.map((m) => ({
    doctor_id: m.doctor_id,
    consultations: m.consultations_count,
    hoursOnline: Number(m.hours_online),
    rating: Number(m.average_rating),
    tierMultiplier: Number(m.tier_multiplier),
    baseScore: m.consultations_count * 0.5 + Number(m.hours_online) * 0.3 + Number(m.average_rating) * 0.2,
    weightedScore: Number(m.weighted_score),
  }));
  const totalWeightedScore = doctorScores.reduce((s, d) => s + d.weightedScore, 0);

  return doctorScores
    .map((d) => {
      const share = totalWeightedScore > 0 ? d.weightedScore / totalWeightedScore : 0;
      return {
        ...d,
        sharePercentage: Math.round(share * 10000) / 100,
        estimatedAmount: Math.round(distributionPool * share * 100) / 100,
      };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

// --- Tests -----------------------------------------------------------------
Deno.test("revenue-distribution / pool = 10% da receita total", () => {
  const { totalRevenue, distributionPool } = computePool([
    { amount: 300 },
    { amount: 500 },
    { amount: 200 },
  ]);
  assertEquals(totalRevenue, 1000);
  assertEquals(distributionPool, 100);
});

Deno.test("revenue-distribution / pool zero quando não há consultas pagas", () => {
  const { totalRevenue, distributionPool } = computePool([]);
  assertEquals(totalRevenue, 0);
  assertEquals(distributionPool, 0);
});

Deno.test("revenue-distribution / share% soma ~100 entre médicos elegíveis", () => {
  const dist = computeDistribution(
    [
      { doctor_id: "d1", consultations_count: 10, hours_online: 20, average_rating: 5, tier_multiplier: 1.5, weighted_score: 30 },
      { doctor_id: "d2", consultations_count: 5,  hours_online: 10, average_rating: 4, tier_multiplier: 1.0, weighted_score: 10 },
      { doctor_id: "d3", consultations_count: 2,  hours_online: 4,  average_rating: 4.5, tier_multiplier: 1.2, weighted_score: 10 },
    ],
    100,
  );
  const totalShare = dist.reduce((s, d) => s + d.sharePercentage, 0);
  // Tolerância de arredondamento
  assert(Math.abs(totalShare - 100) < 0.05, `Soma de shares = ${totalShare}`);

  const totalAmount = dist.reduce((s, d) => s + d.estimatedAmount, 0);
  assert(Math.abs(totalAmount - 100) < 0.05);
});

Deno.test("revenue-distribution / ordenação top-down por weightedScore", () => {
  const dist = computeDistribution(
    [
      { doctor_id: "low",  consultations_count: 1, hours_online: 1, average_rating: 3, tier_multiplier: 1, weighted_score: 5 },
      { doctor_id: "high", consultations_count: 10, hours_online: 20, average_rating: 5, tier_multiplier: 2, weighted_score: 50 },
      { doctor_id: "mid",  consultations_count: 5, hours_online: 10, average_rating: 4, tier_multiplier: 1.2, weighted_score: 20 },
    ],
    100,
  );
  assertEquals(dist[0].doctor_id, "high");
  assertEquals(dist[2].doctor_id, "low");
});

Deno.test("revenue-distribution / sem médicos → array vazio sem div-by-zero", () => {
  const dist = computeDistribution([], 500);
  assertEquals(dist.length, 0);
});

Deno.test("revenue-distribution / RevenuePoolRow update tem shape correto", () => {
  // Compile-time guard
  const update: Pick<RevenuePoolRow, "total_pool"> = { total_pool: 100 };
  assertEquals(update.total_pool, 100);
});

Deno.test({
  name: "revenue-distribution / handler carrega sem erros de tipo",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const mod = await import("./index.ts");
    assert(mod !== null);
  },
});
