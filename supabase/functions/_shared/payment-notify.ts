// Aviso de pagamento confirmado ao celular administrativo (Dr. Edilson) via WhatsApp/Evolution.
// Regras: dispara SOMENTE em pagamento confirmado; sem sintomas/diagnóstico/CPF;
// uma linha por external_reference em payment_notify_log; cada tentativa fica em
// payment_notify_attempts com status, código HTTP, erro e duração.

interface NotifyInput {
  externalReference: string;
  patientName: string;
  amountBrl: number;
  service: string;
  paymentId?: string | null;
}

/** Avisos de início/encerramento da Orientação Técnica (sem dados de saúde). */
export interface OrientationEventInput {
  externalReference: string;
  patientName: string;
  event: "inicio" | "fim";
  rating?: number | null;
  durationMin?: number | null;
}

type Sb = { from: (t: string) => any };

const MAX_ATTEMPTS = 3;

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
    `Pedido: ${input.externalReference}`;
}

async function sendOnce(text: string): Promise<{ ok: boolean; http: number | null; error: string | null; ms: number }> {
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
    return { ok: res.ok, http: res.status, error: res.ok ? null : body.slice(0, 300), ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, http: null, error: (e as Error).message.slice(0, 300), ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

/** Tenta enviar até 3 vezes, registrando cada tentativa. */
async function deliver(sb: Sb, logId: string, text: string, logKey: string, trigger: string, startNo: number): Promise<boolean> {
  let n = startNo;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    n += 1;
    const r = await sendOnce(text);
    await sb.from("payment_notify_attempts").insert({
      log_id: logId, external_reference: logKey, attempt_no: n, trigger,
      status: r.ok ? "sent" : "failed", http_status: r.http, error: r.error, duration_ms: r.ms,
    });
    await sb.from("payment_notify_log").update({
      status: r.ok ? "sent" : "failed", error: r.error, http_status: r.http,
      attempts: n, last_attempt_at: new Date().toISOString(),
      sent_at: r.ok ? new Date().toISOString() : null,
    }).eq("id", logId);
    if (r.ok) return true;
    if (r.error?.startsWith("evolution_not_configured")) return false; // não adianta repetir
    if (r.http && r.http >= 400 && r.http < 500 && r.http !== 429) return false;
    await new Promise((s) => setTimeout(s, 1500 * (i + 1)));
  }
  return false;
}

/**
 * Envia o aviso uma única vez por pedido. Pedido já registrado como falho é
 * retomado (nova rodada de tentativas). Nunca lança exceção.
 */
export async function notifyPaymentConfirmedOnce(sb: Sb, input: NotifyInput, trigger = "auto"): Promise<boolean> {
  try {
    const c = evolutionConfig();
    const { data: claim } = await sb.from("payment_notify_log").insert({
      external_reference: input.externalReference, recipient: c.phone, channel: "whatsapp",
      status: "pending", payment_id: input.paymentId ?? null, amount_brl: input.amountBrl, service: input.service,
    }).select("id, attempts").maybeSingle();
    if (claim) return await deliver(sb, claim.id, input, trigger, 0);

    // Já existe: só retoma se a última rodada falhou (claim atômico failed -> pending).
    const { data: retry } = await sb.from("payment_notify_log")
      .update({ status: "pending" })
      .eq("external_reference", input.externalReference).eq("status", "failed")
      .select("id, attempts").maybeSingle();
    if (!retry) return false; // já enviado ou em envio
    return await deliver(sb, retry.id, input, trigger, retry.attempts ?? 0);
  } catch (e) {
    console.error("[payment-notify] erro", (e as Error).message);
    return false;
  }
}
