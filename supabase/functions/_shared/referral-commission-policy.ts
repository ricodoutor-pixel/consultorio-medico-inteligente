// Regra única de comissão por indicação (decisão do Dr. Edilson, 26/11/2026):
// - acabou a comissão em níveis (2º e 3º nível = modelo de pirâmide): só o indicador direto pode receber;
// - paciente nunca recebe por trazer outro paciente (CFM proíbe pagar por captação de pacientes);
// - conta sem tipo conhecido também não recebe (na dúvida, não paga).
// Usada por process-affiliate-commissions e process-payout.

export const MAX_COMMISSION_LEVELS = 1;

/** Tipos de conta que nunca recebem comissão por indicação. */
const NEVER_PAID = new Set(["patient", "paciente", ""]);

export function referrerMayEarn(userType: string | null | undefined): boolean {
  return !NEVER_PAID.has(String(userType ?? "").trim().toLowerCase());
}

/**
 * Recebe a cadeia de indicadores (1º, 2º, 3º nível) e devolve só quem pode receber:
 * no máximo o indicador direto, e só se ele não for paciente.
 */
export async function eligibleReferrers(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  upline: Array<string | null | undefined>,
): Promise<string[]> {
  const direct = upline.find(Boolean) as string | undefined;
  if (!direct) return [];
  const { data } = await supabase.from("profiles").select("user_type").eq("id", direct).maybeSingle();
  return referrerMayEarn(data?.user_type) ? [direct].slice(0, MAX_COMMISSION_LEVELS) : [];
}
