import { describe, expect, it } from "vitest";
import {
  DOCTOR_PLANS, canUseProTool, doctorPlan, doctorPlanBySku, normalizeDoctorPlan, planRank, proToolsForPlan,
} from "../../supabase/functions/_shared/doctor-plans";
import { dailyLimit } from "../../supabase/functions/_shared/doctor-kit";
import { sortSubscribers, isSubscriberCandidate } from "../../supabase/functions/_shared/consultation-queue";
import { FALLBACK_SERVICES } from "../../supabase/functions/_shared/payment-catalog";

describe("Planos do médico", () => {
  it("Premium R$ 99 e mais 5 planos até R$ 1.500, em ordem crescente", () => {
    expect(DOCTOR_PLANS.map((p) => [p.key, p.priceBrl])).toEqual([
      ["free", 0], ["premium", 99], ["ouro", 199], ["platina", 349], ["diamante", 599], ["elite", 999], ["black", 1500],
    ]);
  });

  it("cada plano pago tem SKU com o mesmo preço no catálogo de cobrança", () => {
    for (const p of DOCTOR_PLANS.filter((x) => x.sku)) {
      expect(FALLBACK_SERVICES[p.sku!]?.amount_brl).toBe(p.priceBrl);
      expect(FALLBACK_SERVICES[p.sku!]?.recurring).toBe(true);
      expect(doctorPlanBySku(p.sku)).toBe(p);
    }
  });

  it("cada plano superior tem limites maiores ou iguais em todas as ferramentas", () => {
    for (let i = 1; i < DOCTOR_PLANS.length; i++) {
      const a = DOCTOR_PLANS[i - 1].limits;
      const b = DOCTOR_PLANS[i].limits;
      for (const k of Object.keys(a) as (keyof typeof a)[]) expect(b[k]).toBeGreaterThanOrEqual(a[k]);
    }
  });

  it("nomes antigos gravados no banco continuam valendo como Premium", () => {
    for (const t of ["vip", "vip_prescritor", "premium", "basic", "plano_medico"]) expect(normalizeDoctorPlan(t)).toBe("premium");
    expect(normalizeDoctorPlan(null)).toBe("free");
    expect(normalizeDoctorPlan("qualquer")).toBe("free");
  });

  it("ferramentas exclusivas: cada plano libera uma nova e mantém as anteriores", () => {
    expect(proToolsForPlan("premium")).toEqual([]);
    expect(proToolsForPlan("ouro")).toEqual(["interacoes"]);
    expect(proToolsForPlan("platina")).toEqual(["interacoes", "laudo_anvisa"]);
    expect(proToolsForPlan("black")).toHaveLength(5);
    expect(canUseProTool("diamante", "conteudo_etico")).toBe(false);
    expect(canUseProTool("elite", "conteudo_etico")).toBe(true);
  });

  it("limite diário vem do plano do médico", () => {
    expect(dailyLimit("copiloto", { paid: true, admin: false, planTier: "black" })).toBe(1000);
    expect(dailyLimit("copiloto", { paid: true, admin: false, planTier: "vip" })).toBe(100);
    expect(dailyLimit("pro", { paid: true, admin: false, planTier: "premium" })).toBe(0);
    expect(dailyLimit("pro", { paid: true, admin: false, planTier: "ouro" })).toBe(20);
    expect(dailyLimit("juridico", { paid: false, admin: false, planTier: "black" })).toBe(0); // sem pagamento = gratuito
  });

  it("na fila, planos maiores recebem a oferta antes", () => {
    const docs = [
      { id: "a", user_id: "a", is_online: true, plan_tier: "premium", full_name: "A" },
      { id: "b", user_id: "b", is_online: true, plan_tier: "black", full_name: "B" },
      { id: "c", user_id: "c", is_online: true, plan_tier: "ouro", full_name: "C" },
    ];
    expect(docs.every((d) => isSubscriberCandidate(d as never))).toBe(true);
    expect(sortSubscribers(docs as never).map((d) => d.user_id)).toEqual(["b", "c", "a"]);
    expect(planRank("black")).toBeGreaterThan(planRank("elite"));
  });

  it("doctorPlan devolve sempre um plano válido", () => {
    expect(doctorPlan(undefined).key).toBe("free");
  });
});
