/**
 * Projeção de crescimento 2026–2030 a partir dos números REAIS da plataforma (RPC public_platform_stats)
 * e do mercado brasileiro de cannabis medicinal (Anuário Kaya Mind). Nada aqui é sorteado ou fixo da
 * plataforma: o ponto de partida é o total real de hoje e o ritmo real dos últimos 3 meses completos.
 */

export interface MonthlyStat {
  month: string; // YYYY-MM
  signups: number;
  services: number;
  revenue_brl: number;
}

export interface PlatformStats {
  generated_at: string;
  users_total: number;
  doctors_total: number;
  consultations_paid: number;
  orientations_paid: number;
  revenue_brl: number;
  monthly: MonthlyStat[];
}

/** Anuário Kaya Mind: mercado (R$ milhões) e pacientes; projeção do setor de ~15% ao ano. */
export const MARKET_SOURCE = {
  name: "Kaya Mind — Anuário da Cannabis Medicinal",
  url: "https://kayamind.com/numero-pacientes-cannabis-brasil-2025/",
  growthPerYear: 0.15,
  history: [
    { year: 2024, revenueMi: 852.6, patients: 672_000 },
    { year: 2025, revenueMi: 970.9, patients: 873_000 },
  ],
} as const;

export const PROJECTION_END_YEAR = 2030;

export interface MarketPoint {
  year: number;
  revenueMi: number;
  patients: number;
  projected: boolean;
}

export function marketSeries(endYear = PROJECTION_END_YEAR): MarketPoint[] {
  const out: MarketPoint[] = MARKET_SOURCE.history.map((h) => ({ ...h, projected: false }));
  const last = MARKET_SOURCE.history[MARKET_SOURCE.history.length - 1];
  for (let y = last.year + 1; y <= endYear; y++) {
    const k = Math.pow(1 + MARKET_SOURCE.growthPerYear, y - last.year);
    out.push({ year: y, revenueMi: round1(last.revenueMi * k), patients: Math.round(last.patients * k), projected: true });
  }
  return out;
}

export interface PlatformPoint {
  year: number;
  users: number;
  revenueBrl: number;
  services: number;
  marketSharePct: number;
  /** true no ano corrente quando ainda há meses projetados; false para anos já fechados */
  projected: boolean;
}

/** Média mensal dos últimos `n` meses COMPLETOS (o mês corrente, parcial, fica de fora). */
export function recentMonthlyRate(monthly: MonthlyStat[], key: keyof Omit<MonthlyStat, "month">, n = 3): number {
  const complete = monthly.slice(0, -1);
  const window = complete.slice(-n);
  if (window.length === 0) return 0;
  return window.reduce((s, m) => s + Number(m[key] || 0), 0) / window.length;
}

/**
 * Projeta usuários, atendimentos e faturamento por ano até 2030: total real de hoje + ritmo mensal real dos
 * últimos 3 meses, crescendo junto com o mercado (15% a.a.). Faturamento do ano corrente = real do ano + meses
 * restantes no ritmo atual.
 */
export function platformProjection(stats: PlatformStats, now = new Date(), endYear = PROJECTION_END_YEAR): PlatformPoint[] {
  const g = MARKET_SOURCE.growthPerYear;
  const market = new Map(marketSeries(endYear).map((m) => [m.year, m.patients]));
  const year = now.getFullYear();
  const monthsLeft = 11 - now.getMonth(); // meses inteiros após o mês corrente
  const signupRate = recentMonthlyRate(stats.monthly, "signups");
  const serviceRate = recentMonthlyRate(stats.monthly, "services");
  const revenueRate = recentMonthlyRate(stats.monthly, "revenue_brl");

  const ytd = (key: "services" | "revenue_brl") =>
    stats.monthly.filter((m) => m.month.startsWith(`${year}-`)).reduce((s, m) => s + Number(m[key] || 0), 0);

  const out: PlatformPoint[] = [];
  let users = stats.users_total + signupRate * monthsLeft;
  for (let y = year; y <= endYear; y++) {
    const k = Math.pow(1 + g, y - year);
    let services: number;
    let revenue: number;
    if (y === year) {
      services = ytd("services") + serviceRate * monthsLeft;
      revenue = ytd("revenue_brl") + revenueRate * monthsLeft;
    } else {
      users += signupRate * 12 * k;
      services = serviceRate * 12 * k;
      revenue = revenueRate * 12 * k;
    }
    const patients = market.get(y) ?? 0;
    out.push({
      year: y,
      users: Math.round(users),
      services: Math.round(services),
      revenueBrl: Math.round(revenue),
      marketSharePct: patients > 0 ? round2((users / patients) * 100) : 0,
      projected: y > year || monthsLeft > 0,
    });
  }
  return out;
}

export function formatBrlCompact(v: number): string {
  if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi`;
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}
