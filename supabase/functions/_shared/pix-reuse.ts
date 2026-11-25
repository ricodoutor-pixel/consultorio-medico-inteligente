// Regra única de reaproveitamento de Pix: só reaproveita um Pix "pending" no
// Mercado Pago, criado há no máximo 30 min e com vencimento a pelo menos 10 min.
export const PIX_MAX_REUSE_AGE_MS = 30 * 60_000;
export const PIX_MIN_REMAINING_MS = 10 * 60_000;
export const PIX_EXPIRATION_MS = 30 * 60_000;

export type PixReuseDecision = "reuse" | "approved" | "dead" | "unknown";

export function decidePixReuse(
  p: { status?: string; date_of_expiration?: string | null } | null,
  createdAt: string | null | undefined,
  now = Date.now(),
): PixReuseDecision {
  if (!p) return "unknown";
  if (p.status === "approved") return "approved";
  if (p.status !== "pending") return "dead";
  if (!createdAt || now - new Date(createdAt).getTime() > PIX_MAX_REUSE_AGE_MS) return "dead";
  const exp = p.date_of_expiration ? new Date(p.date_of_expiration).getTime() : NaN;
  if (!Number.isFinite(exp) || exp - now < PIX_MIN_REMAINING_MS) return "dead";
  return "reuse";
}

export async function fetchMpPayment(id: string, token: string): Promise<any | null> {
  if (!/^\d+$/.test(id)) return null;
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) { await r.text(); return null; }
  return r.json();
}

/** Data de vencimento no formato exigido pelo MP (com fuso -03:00). */
export function pixExpirationIso(now = Date.now()): string {
  const d = new Date(now + PIX_EXPIRATION_MS - 3 * 3600_000);
  return d.toISOString().replace("Z", "-03:00");
}
