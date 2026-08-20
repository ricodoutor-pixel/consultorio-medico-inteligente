// Shared Evolution API helper for sending WhatsApp messages.
// Replaces former ManyChat integration. All outbound automations
// (recovery, revenue reports, social tracking) go through here.

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

function evolutionBaseUrl(): string {
  const raw = (EVOLUTION_API_URL || "").replace(/\/$/, "");
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/** Normalize Brazilian phone -> E.164 digits only. */
function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/\D/g, "");
  if (!p) return "";
  if (!p.startsWith("55") && p.length <= 11) p = "55" + p;
  return p;
}

export interface EvolutionSendResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/** Send a plain text WhatsApp message via Evolution API. */
export async function sendWhatsApp(
  phone: string,
  message: string,
): Promise<EvolutionSendResult> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return { ok: false, error: "EVOLUTION_API_URL/KEY not configured" };
  }
  const number = normalizePhone(phone);
  if (!number) return { ok: false, error: "invalid phone" };

  try {
    const base = evolutionBaseUrl();
    const res = await fetch(
      `${base}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ number, text: message }),
      },
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: txt.slice(0, 300) };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Predefined recovery message templates (formerly ManyChat flows). */
export const RECOVERY_MESSAGES: Record<string, string> = {
  recovery_lead_frio_24h:
    "🌿 Olá! Sua triagem na Planta y Raiz está pronta. Que tal finalizar sua consulta agora? https://plantayraiz.com.br/oferta-especial",
  recovery_carrinho_48h:
    "🎁 Cupom RAIZ200 liberado por 24h! Volte e finalize sua consulta com R$200 OFF: https://plantayraiz.com.br/oferta-especial?cupom=RAIZ200",
  recovery_escassez_72h:
    "🔥 Últimas vagas hoje! Cupom RAIZ300 expira em 12h: https://plantayraiz.com.br/oferta-especial?cupom=RAIZ300",
  recovery_renovacao_10d:
    "📋 Sua receita expira em 10 dias. Renove agora em 3 minutos: https://plantayraiz.com.br/consulta-rapida",
  affiliate_lead_cold_alert:
    "🔔 Um dos seus indicados esfriou. Faça um follow-up: https://plantayraiz.com.br/afiliados",
};
