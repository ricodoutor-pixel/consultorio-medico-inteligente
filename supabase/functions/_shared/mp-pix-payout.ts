/**
 * Saque Pix via Mercado Pago Payouts (POST /v1/transaction-intents/process).
 * Funções puras (sem Deno) para serem testadas pelo vitest.
 */
export const MP_PIX_PAYOUT_URL = "https://api.mercadopago.com/v1/transaction-intents/process";

export type MpPixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "PIX_CODE";

/** Classifica a chave Pix cadastrada; chave aleatória (EVP) segue como PIX_CODE. */
export function mpPixKey(raw: string): { type: MpPixKeyType; value: string } | null {
  const key = raw.trim();
  if (!key) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return { type: "EMAIL", value: key.toLowerCase() };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
    return { type: "PIX_CODE", value: key.toLowerCase() };
  }
  const digits = key.replace(/\D/g, "");
  if (key.startsWith("+")) return digits.length >= 12 ? { type: "PHONE", value: `+${digits}` } : null;
  if (/^[\d.\-/\s()]+$/.test(key)) {
    if (digits.length === 14) return { type: "CNPJ", value: digits };
    if (digits.length === 11) return { type: "CPF", value: digits };
    if (digits.length === 10 || digits.length === 13) return { type: "PHONE", value: `+${digits.length === 10 ? "55" : ""}${digits}` };
  }
  return null;
}

export function mpPixPayoutBody(input: { withdrawalId: string; net: number; pixKey: string; notificationUrl?: string }) {
  const key = mpPixKey(input.pixKey);
  if (!key) throw new Error("Chave Pix cadastrada em formato não reconhecido");
  const amount = Math.round(input.net * 100) / 100;
  if (!(amount > 0)) throw new Error("Valor líquido inválido");
  return {
    external_reference: `pyr-saque-${input.withdrawalId}`.slice(0, 64),
    point_of_interaction: { type: "PSP_TRANSFER" },
    ...(input.notificationUrl
      ? { seller_configuration: { notification_info: { notification_url: input.notificationUrl } } }
      : {}),
    transaction: {
      from: { accounts: [{ amount }] },
      to: { accounts: [{ type: "current", amount, chave: key }] },
      total_amount: amount,
    },
  };
}

/** Status do Mercado Pago → status do saque. "processing" fica pendente de conciliação, nunca vira pago sozinho. */
export function mpPayoutOutcome(status: unknown): "paid" | "processing" | "failed" {
  switch (String(status ?? "")) {
    case "success":
    case "processed":
      return "paid";
    case "approved":
    case "transaction_in_process":
      return "processing";
    default:
      return "failed";
  }
}
