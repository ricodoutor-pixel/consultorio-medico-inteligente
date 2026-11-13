import { describe, expect, it } from "vitest";
import { marketSeries, platformProjection, recentMonthlyRate, type PlatformStats } from "./growth-projection";

const stats: PlatformStats = {
  generated_at: "2026-11-13T12:00:00Z",
  users_total: 1000,
  doctors_total: 20,
  consultations_paid: 40,
  orientations_paid: 60,
  revenue_brl: 9000,
  monthly: [
    { month: "2026-08", signups: 100, services: 10, revenue_brl: 1000 },
    { month: "2026-09", signups: 100, services: 10, revenue_brl: 1000 },
    { month: "2026-10", signups: 100, services: 10, revenue_brl: 1000 },
    { month: "2026-11", signups: 999, services: 999, revenue_brl: 500 }, // mês corrente (parcial) não entra no ritmo
  ],
};

describe("Projeção de crescimento com dados reais", () => {
  it("mercado parte dos números da Kaya Mind e cresce 15% ao ano", () => {
    const m = marketSeries();
    expect(m[0]).toMatchObject({ year: 2024, revenueMi: 852.6, projected: false });
    expect(m[1]).toMatchObject({ year: 2025, patients: 873_000, projected: false });
    expect(m.at(-1)!.year).toBe(2030);
    expect(m.at(-1)!.revenueMi).toBeCloseTo(970.9 * Math.pow(1.15, 5), 0);
  });

  it("ritmo usa só meses completos", () => {
    expect(recentMonthlyRate(stats.monthly, "signups")).toBe(100);
  });

  it("parte do total real de hoje e segue o ritmo real", () => {
    const p = platformProjection(stats, new Date("2026-11-13T12:00:00-03:00"));
    expect(p[0].year).toBe(2026);
    expect(p[0].users).toBe(1100); // 1000 hoje + 1 mês (dezembro) a 100/mês
    expect(p[0].revenueBrl).toBe(3500 + 1000); // real do ano + dezembro no ritmo atual
    expect(p[1].users).toBe(Math.round(1100 + 1200 * 1.15));
    expect(p.at(-1)!.year).toBe(2030);
    expect(p.at(-1)!.marketSharePct).toBeGreaterThan(0);
  });

  it("sem histórico, não inventa crescimento", () => {
    const p = platformProjection({ ...stats, monthly: [] }, new Date("2026-11-13T12:00:00-03:00"));
    expect(p.every((x) => x.users === 1000)).toBe(true);
    expect(p.every((x) => x.revenueBrl === 0)).toBe(true);
  });

  it("primeiras vendas no mês atual: projeta pelo ritmo do mês, não zero até 2030 (dados reais de 13/11/2026)", () => {
    const real: PlatformStats = {
      users_total: 74, doctors_total: 46, consultations_paid: 0, orientations_paid: 13, revenue_brl: 390,
      monthly: [
        { month: "2026-08", signups: 23, services: 0, revenue_brl: 0 },
        { month: "2026-09", signups: 10, services: 0, revenue_brl: 0 },
        { month: "2026-10", signups: 23, services: 0, revenue_brl: 0 },
        { month: "2026-11", signups: 8, services: 13, revenue_brl: 390 },
      ],
    } as PlatformStats;
    const p = platformProjection(real, new Date("2026-11-13T12:00:00-03:00"));
    // 390 em 13 dias → 900/mês; fim de 2026 = 390 + 900 (dezembro)
    expect(p[0].revenueBrl).toBe(1290);
    expect(p[1].revenueBrl).toBe(Math.round(900 * 12 * 1.15));
    expect(p[p.length - 1].revenueBrl).toBeGreaterThan(0);
  });
});
