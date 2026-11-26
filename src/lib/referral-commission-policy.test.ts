import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  eligibleReferrers,
  MAX_COMMISSION_LEVELS,
  referrerMayEarn,
} from "../../supabase/functions/_shared/referral-commission-policy";

const fakeDb = (userType: string | null) => ({
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: userType === null ? null : { user_type: userType } }) }) }) }),
});

describe("Comissão por indicação (decisão de 26/11/2026)", () => {
  it("só o indicador direto recebe; 2º e 3º nível não existem", async () => {
    expect(MAX_COMMISSION_LEVELS).toBe(1);
    expect(await eligibleReferrers(fakeDb("doctor"), ["direto", "nivel2", "nivel3"])).toEqual(["direto"]);
  });
  it("paciente nunca recebe por indicar paciente; conta sem tipo também não", async () => {
    expect(referrerMayEarn("patient")).toBe(false);
    expect(await eligibleReferrers(fakeDb("patient"), ["paciente-indicador", "x"])).toEqual([]);
    expect(await eligibleReferrers(fakeDb(null), ["sem-perfil"])).toEqual([]);
    expect(await eligibleReferrers(fakeDb("doctor"), [])).toEqual([]);
  });
  it("as duas funções que pagam comissão usam a regra única e não têm taxas de 2º/3º nível", () => {
    for (const f of ["supabase/functions/process-affiliate-commissions/index.ts", "supabase/functions/process-payout/index.ts"]) {
      const src = fs.readFileSync(f, "utf8");
      expect(src, f).toContain("eligibleReferrers(");
      expect(src, f).not.toMatch(/\[0\.25, 0\.15, 0\.10\]|\[0\.50, 0\.05, 0\.02\]/);
    }
  });
  it("telas públicas não anunciam comissão em 3 níveis nem simulador de rede", () => {
    for (const f of ["src/pages/Precos.tsx", "src/pages/Indicacoes.tsx", "src/pages/AfiliadosGamificado.tsx", "src/pages/AffiliateDashboard.tsx", "src/components/doctor/DoctorTeamDashboard.tsx", "src/pages/ManualPlataforma.tsx", "src/pages/MedSocio.tsx"]) {
      expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/3 n[ií]veis de indica|em 3 n[ií]veis|3 Gera[cç][oõ]es|Nível 3 \(2,5%\)|AffiliateEarningsSimulator|<AffiliateTree/);
    }
  });
  it("/medsocio só compartilha o código permanente do servidor, nunca um código gerado no navegador", () => {
    const src = fs.readFileSync("src/pages/MedSocio.tsx", "utf8");
    expect(src).toContain("loadPermanentReferralCode(");
    expect(src).not.toMatch(/Math\.random|CONVIDADO_|DR_\$\{/);
  });
});

describe("Migração dos aceites do checkout aceita pelo Lovable", () => {
  it("sem referência a auth.users e com GRANT para service_role", () => {
    const sql = fs.readFileSync("drizzle/migrations/0063_checkout_consents.sql", "utf8");
    expect(sql).not.toMatch(/auth\.users/);
    expect(sql).toContain("GRANT ALL ON public.checkout_consents TO service_role;");
  });
});
