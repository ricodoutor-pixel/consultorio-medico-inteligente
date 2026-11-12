/**
 * Kit do Assinante: planos, limites diários das ferramentas de IA do médico e dia de Brasília.
 * Funções puras (sem Deno) para serem testadas pelo vitest e reaproveitadas no frontend.
 */
export type DoctorAiTool = "copiloto" | "juridico" | "escriba";

/** Plano pago = qualquer plano diferente de free (VIP R$ 99 em diante). Só admin/sistema altera o plano. */
export function isPaidPlan(planTier: string | null | undefined): boolean {
  const tier = String(planTier ?? "").trim().toLowerCase();
  return tier !== "" && tier !== "free";
}

export const DOCTOR_AI_DAILY_LIMITS: Record<DoctorAiTool, { free: number; paid: number; admin: number }> = {
  copiloto: { free: 10, paid: 100, admin: 200 },
  juridico: { free: 0, paid: 10, admin: 50 },
  /** Cada trecho de áudio transcrito (até 5 min) e cada SOAP gerado contam 1. */
  escriba: { free: 6, paid: 150, admin: 300 },
};

export function dailyLimit(tool: DoctorAiTool, access: { paid: boolean; admin: boolean }): number {
  const l = DOCTOR_AI_DAILY_LIMITS[tool];
  return access.admin ? l.admin : access.paid ? l.paid : l.free;
}

/** Início do dia em Brasília (UTC-3, sem horário de verão desde 2019), em ISO UTC. */
export function brasiliaDayStartIso(now: Date): string {
  const shifted = new Date(now.getTime() - 3 * 3_600_000);
  const startShifted = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return new Date(startShifted + 3 * 3_600_000).toISOString();
}

export const LEGAL_ASSISTANT_DISCLAIMER =
  "Orientação informativa gerada por IA; não substitui parecer de advogado. Para um caso concreto, consulte um advogado inscrito na OAB.";
