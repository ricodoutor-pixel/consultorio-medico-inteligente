// Aviso de pagamento confirmado ao celular administrativo (Dr. Edilson) via WhatsApp.
// Regras: dispara SOMENTE em pagamento confirmado; sem sintomas/diagnóstico/CPF;
// sem duplicidade (uma linha por external_reference em payment_notify_log);
// registra destinatário, tentativa, status e horário. "Envio aceito" não é "entregue".

interface NotifyInput {
  externalReference: string;
  patientName: string;
  amountBrl: number;
  service: string;
  paymentId?: string | null;
}

function saoPauloNow(): { data: string; hora: string } {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { data: `${get("day")}/${get("month")}/${get("year")}`, hora: `${get("hour")}:${get("minute")}` };
}

/**
 * Envia o aviso de pagamento confirmado uma única vez por pedido.
 * Retorna true quando o envio foi aceito pela API nesta chamada.
 * Nunca lança exceção: falhas ficam registradas em payment_notify_log.
 */
export async function notifyPaymentConfirmedOnce(
  sb: { from: (t: string) => any },
  input: NotifyInput,
): Promise<boolean> {
  try {
    // Dedup transacional: quem insere primeiro é o único que envia.
    const { data: claim, error: claimErr } = await sb
      .from("payment_notify_log")
      .insert({
        external_reference: input.externalReference,
        recipient: Deno.env.get("ADMIN_WHATSAPP") || "5511987131241",
        channel: "whatsapp",
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (claimErr || !claim) return false; // já avisado (unique) ou log indisponível

    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
    const adminPhone = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

    if (!evolutionUrl || !evolutionKey) {
      await sb.from("payment_notify_log").update({
        status: "failed", error: "evolution_not_configured",
      }).eq("id", claim.id);
      return false;
    }

    const { data, hora } = saoPauloNow();
    const text =
      `Planta y Raiz — pagamento confirmado.\n` +
      `Paciente: ${input.patientName}\n` +
      `Valor: R$ ${input.amountBrl.toFixed(2).replace(".", ",")}\n` +
      `Data: ${data}\n` +
      `Hora: ${hora} (São Paulo)\n` +
      `Serviço: ${input.service}\n` +
      `Pedido: ${input.externalReference}`;

    const res = await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evolutionKey },
      body: JSON.stringify({ number: adminPhone, text }),
    });
    const bodyText = await res.text();

    await sb.from("payment_notify_log").update({
      status: res.ok ? "sent" : "failed",
      error: res.ok ? null : `http_${res.status}: ${bodyText.slice(0, 300)}`,
      sent_at: res.ok ? new Date().toISOString() : null,
    }).eq("id", claim.id);

    return res.ok;
  } catch (e) {
    console.error("[payment-notify] erro", (e as Error).message);
    return false;
  }
}
