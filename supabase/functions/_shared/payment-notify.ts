// Aviso de pagamento confirmado ao celular administrativo (Dr. Edilson) via WhatsApp/Evolution.
// Regras: dispara SOMENTE em pagamento confirmado; sem sintomas/diagnóstico/CPF;
// uma linha por external_reference em payment_notify_log; cada tentativa fica em
// payment_notify_attempts com status, código HTTP, erro e duração.
import { orientationCode } from "./orientation-code.ts";
import { deliverNotice } from "./notice-delivery.ts";

interface NotifyInput {
  externalReference: string;
  patientName: string;
  amountBrl: number;
  service: string;
  paymentId?: string | null;
  attendanceCode?: string | null;
}

/** Avisos de início/encerramento da Orientação Técnica (sem dados de saúde). */
export interface OrientationEventInput {
  externalReference: string;
  patientName: string;
  event: "inicio" | "fim";
  rating?: number | null;
  durationMin?: number | null;
  attendanceCode?: string | null;
}

type Sb = { from: (t: string) => any };

function saoPauloNow(): { data: string; hora: string } {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { data: `${get("day")}/${get("month")}/${get("year")}`, hora: `${get("hour")}:${get("minute")}` };
}

function evolutionConfig() {
  let url = (Deno.env.get("EVOLUTION_API_URL") || "").trim().replace(/\/+$/, "");
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  return {
    url,
    key: (Deno.env.get("EVOLUTION_API_KEY") || "").trim(),
    instance: (Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz").trim(),
    phone: (Deno.env.get("ADMIN_WHATSAPP") || "5511987131241").replace(/\D/g, ""),
  };
}

export function buildPaymentMessage(input: NotifyInput): string {
  const { data, hora } = saoPauloNow();
  return `Planta y Raiz — pagamento confirmado.\n` +
    `Paciente: ${input.patientName}\n` +
    `Valor: R$ ${input.amountBrl.toFixed(2).replace(".", ",")}\n` +
    `Data: ${data}\n` +
    `Hora: ${hora} (São Paulo)\n` +
    `Serviço: ${input.service}\n` +
    `Pedido: ${input.externalReference}` + (input.attendanceCode ? `\nCódigo: ${input.attendanceCode}` : "");
}

async function sendOnce(text: string): Promise<{ ok: boolean; http: number | null; error: string | null; ms: number; messageId?: string | null }> {
  const c = evolutionConfig();
  const t0 = Date.now();
  if (!c.url || !c.key) {
    return { ok: false, http: null, error: "evolution_not_configured: EVOLUTION_API_URL/EVOLUTION_API_KEY ausentes", ms: 0 };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${c.url}/message/sendText/${encodeURIComponent(c.instance)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: c.key },
      body: JSON.stringify({ number: c.phone, text }),
      signal: ctrl.signal,
    });
    const body = await res.text().catch(() => "");
    let messageId: string | null = null;
    try { const payload = JSON.parse(body); messageId = typeof payload?.key?.id === "string" ? payload.key.id : null; } catch { /* no provider id */ }
    return { ok: res.ok, http: res.status, error: res.ok ? null : `provider_http_${res.status}`, ms: Date.now() - t0, messageId };
  } catch (e) {
    return { ok: false, http: null, error: (e as Error).message.slice(0, 300), ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

/** Retries only explicit rate-limit rejections; ambiguous results stay claimed. */
async function deliver(sb: Sb, logId: string, text: string, logKey: string, trigger: string, startNo: number): Promise<boolean> {
  return deliverNotice(sb, logId, text, logKey, trigger, startNo, sendOnce);
}

/**
 * Envia o aviso uma única vez por pedido. Pedido já registrado como falho é
 * retomado (nova rodada de tentativas). Nunca lança exceção.
 */
export async function notifyPaymentConfirmedOnce(sb: Sb, input: NotifyInput, trigger = "auto"): Promise<boolean> {
  try {
    const c = evolutionConfig();
    if (!input.attendanceCode && input.externalReference.startsWith("orientacao_tecnica:")) {
      const { data: order } = await sb.from("orientacao_tecnica_orders").select("id").eq("external_reference", input.externalReference).maybeSingle();
      if (order?.id) input.attendanceCode = orientationCode(order.id);
    }
    const text = buildPaymentMessage(input);
    const { data: claim } = await sb.from("payment_notify_log").insert({
      external_reference: input.externalReference, recipient: c.phone, channel: "whatsapp",
      status: "pending", payment_id: input.paymentId ?? null, amount_brl: input.amountBrl, service: input.service,
    }).select("id, attempts").maybeSingle();
    if (claim) return await deliver(sb, claim.id, text, input.externalReference, trigger, 0);

    // Já existe: só retoma se a última rodada falhou (claim atômico failed -> pending).
    const { data: retry } = await sb.from("payment_notify_log")
      .update({ status: "pending" })
      .eq("external_reference", input.externalReference).eq("status", "failed")
      .select("id, attempts").maybeSingle();
    if (!retry) return false; // já enviado ou em envio
    return await deliver(sb, retry.id, text, input.externalReference, trigger, retry.attempts ?? 0);
  } catch (e) {
    console.error("[payment-notify] erro", (e as Error).message);
    return false;
  }
}

/** Texto do aviso de início/fim da Orientação Técnica (sem sintomas nem dados de saúde). */
export function buildOrientationEventMessage(input: OrientationEventInput): string {
  const { data, hora } = saoPauloNow();
  if (input.event === "inicio") {
    return `Planta y Raiz — Orientação Técnica em andamento.\n` +
      `Paciente: ${input.patientName}\n` +
      `Início: ${hora} de ${data} (São Paulo)\n` +
      `Pedido: ${input.externalReference}` + (input.attendanceCode ? `\nCódigo: ${input.attendanceCode}` : "");
  }
  const nota = input.rating ? `${input.rating}/3` : "não avaliou";
  const dur = input.durationMin != null ? `${input.durationMin} min` : "—";
  return `Planta y Raiz — Orientação Técnica encerrada.\n` +
    `Paciente: ${input.patientName}\n` +
    `Fim: ${hora} de ${data} (São Paulo)\n` +
    `Duração: ${dur} · Avaliação: ${nota}\n` +
    `Pedido: ${input.externalReference}` + (input.attendanceCode ? `\nCódigo: ${input.attendanceCode}` : "");
}

/**
 * Aviso de início ou encerramento da Orientação, uma única vez por evento
 * (dedup por "<external_reference>:<evento>"). Falhas são retomadas na próxima chamada.
 */
export async function notifyOrientationEvent(sb: Sb, input: OrientationEventInput, trigger = "auto"): Promise<boolean> {
  const logKey = `${input.externalReference}:${input.event}`;
  try {
    const c = evolutionConfig();
    const text = buildOrientationEventMessage(input);
    const { data: claim } = await sb.from("payment_notify_log").insert({
      external_reference: logKey, recipient: c.phone, channel: "whatsapp",
      status: "pending", service: `Orientação Técnica (${input.event})`,
    }).select("id, attempts").maybeSingle();
    if (claim) return await deliver(sb, claim.id, text, logKey, trigger, 0);

    const { data: retry } = await sb.from("payment_notify_log")
      .update({ status: "pending" })
      .eq("external_reference", logKey).eq("status", "failed")
      .select("id, attempts").maybeSingle();
    if (!retry) return false;
    return await deliver(sb, retry.id, text, logKey, trigger, retry.attempts ?? 0);
  } catch (e) {
    console.error("[payment-notify] evento erro", (e as Error).message);
    return false;
  }
}
