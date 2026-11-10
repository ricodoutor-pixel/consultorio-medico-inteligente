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

async function sendOnce(text: string, to?: string): Promise<{ ok: boolean; http: number | null; error: string | null; ms: number; messageId?: string | null }> {
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
      body: JSON.stringify({ number: to || c.phone, text }),
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

/** Remove prefixos duplicados (Dr., Dra., Dr(a).) para exibir "Dr(a). [nome]". */
export function cleanDoctorDisplayName(rawName?: string | null): string {
  const cleaned = String(rawName ?? "")
    .trim()
    .replace(/^(dr\(a\)\.?|dra\.?|dr\.?)\s+/i, "")
    .trim();
  return cleaned || "Médico(a)";
}

/**
 * Texto oficial do aviso ao médico: consulta paga aguardando atendimento.
 * Regra estrita: SEM nome do paciente e SEM dado de saúde no texto.
 */
export function buildDoctorConsultationMessage(i: {
  doctorName?: string | null;
  patientFirstName?: string;
  modality?: string;
  amountBrl?: number;
}): string {
  const name = cleanDoctorDisplayName(i.doctorName);
  return `Dr(a). ${name}, o senhor(a) tem uma consulta agora na Planta y Raiz. Entre em Consultório Médico.`;
}

/** Texto oficial do aviso de repasse liberado após avaliação do paciente. */
export function buildDoctorPayoutAvailableMessage(): string {
  return "Pagamento disponível para saque na Planta y Raiz.";
}

/** Aviso único a um destinatário específico via WhatsApp (dedup pela chave). Nunca lança exceção. */
export async function notifyRecipientOnce(
  sb: Sb,
  input: { key: string; phone: string; text: string; service: string; simulateOnly?: boolean },
  trigger = "auto",
): Promise<boolean> {
  const phone = input.phone.replace(/\D/g, "");
  if (phone.length < 10) return false;
  const send = input.simulateOnly
    ? async () => ({ ok: true, http: 200, error: null, ms: 1, messageId: `sim-wa-${Date.now()}` })
    : (t: string) => sendOnce(t, phone);
  try {
    const { data: claim } = await sb.from("payment_notify_log").insert({
      external_reference: input.key, recipient: phone, channel: "whatsapp", status: "pending", service: input.service,
    }).select("id, attempts").maybeSingle();
    if (claim) return await deliverNotice(sb, claim.id, input.text, input.key, trigger, 0, send);
    const { data: retry } = await sb.from("payment_notify_log").update({ status: "pending" })
      .eq("external_reference", input.key).eq("status", "failed").select("id, attempts").maybeSingle();
    if (!retry) return false;
    return await deliverNotice(sb, retry.id, input.text, input.key, trigger, retry.attempts ?? 0, send);
  } catch (e) {
    console.error("[payment-notify] destinatário erro", (e as Error).message);
    return false;
  }
}

/** Aviso único por e-mail (Hostinger / transacional) com registro de tentativa e status em payment_notify_log/attempts. */
export async function notifyRecipientEmailOnce(
  sb: Sb,
  input: {
    key: string;
    email: string;
    doctorName?: string | null;
    service: string;
    consultorioUrl?: string;
    simulateOnly?: boolean;
    customSender?: (text: string) => Promise<{ ok: boolean; http: number | null; error: string | null; ms: number; messageId?: string | null }>;
  },
  trigger = "auto",
): Promise<boolean> {
  const recipient = String(input.email ?? "").trim().toLowerCase();
  if (!recipient.includes("@")) return false;
  const text = buildDoctorConsultationMessage({ doctorName: input.doctorName });
  const send = input.customSender
    ? input.customSender
    : input.simulateOnly
    ? async () => ({ ok: true, http: 200, error: null, ms: 1, messageId: `sim-email-${Date.now()}` })
    : async (bodyText: string) => {
        const t0 = Date.now();
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        if (!supabaseUrl || !serviceKey) {
          return { ok: false, http: 400, error: "email_not_configured", ms: 0 };
        }
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              templateName: "nova-consulta-medico",
              recipientEmail: recipient,
              templateData: {
                doctorName: cleanDoctorDisplayName(input.doctorName),
                message: bodyText,
                consultorioUrl: input.consultorioUrl || "https://www.plantayraiz.com.br/consultorio",
              },
            }),
          });
          return {
            ok: res.ok,
            http: res.status,
            error: res.ok ? null : `email_http_${res.status}`,
            ms: Date.now() - t0,
            messageId: res.ok ? `email-${Date.now()}` : null,
          };
        } catch (err) {
          return { ok: false, http: null, error: (err as Error).message.slice(0, 300), ms: Date.now() - t0 };
        }
      };

  try {
    const { data: claim } = await sb.from("payment_notify_log").insert({
      external_reference: input.key,
      recipient,
      channel: "email",
      status: "pending",
      service: input.service,
    }).select("id, attempts").maybeSingle();
    if (claim) return await deliverNotice(sb, claim.id, text, input.key, trigger, 0, send);
    const { data: retry } = await sb.from("payment_notify_log").update({ status: "pending" })
      .eq("external_reference", input.key).eq("status", "failed").select("id, attempts").maybeSingle();
    if (!retry) return false;
    return await deliverNotice(sb, retry.id, text, input.key, trigger, retry.attempts ?? 0, send);
  } catch (e) {
    console.error("[payment-notify] email destinatário erro", (e as Error).message);
    return false;
  }
}

