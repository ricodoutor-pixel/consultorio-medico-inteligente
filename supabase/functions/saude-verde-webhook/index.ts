// Webhook MercadoPago para ativação automática de assinaturas Saúde Verde
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sendWhatsApp(phone: string, message: string) {
  try {
    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE") || "Brisa_CEO";
    if (!evolutionUrl || !evolutionKey) return;
    await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evolutionKey },
      body: JSON.stringify({ number: phone, text: message }),
    });
  } catch (e) {
    console.error("[saude-verde-webhook] WhatsApp:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const dataId = body?.data?.id;
    const type = body?.type || body?.action;

    if (!dataId || (type && !String(type).includes("payment"))) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency
    const idempotencyKey = `sv-mp-${dataId}`;
    const { data: existing } = await supabase
      .from("webhook_idempotency")
      .select("id")
      .eq("key", idempotencyKey)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    const payment = await mpResp.json();

    if (payment.status !== "approved") {
      return new Response(JSON.stringify({ ok: true, status: payment.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = payment.metadata || {};
    if (meta.module !== "saude_verde" || !meta.user_id) {
      return new Response(JSON.stringify({ ok: true, not_saude_verde: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ativa subscription
    const { data: sub } = await supabase
      .from("saude_verde_subscriptions")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", meta.user_id)
      .eq("card_number", meta.card_number)
      .select("card_number, plan_id")
      .maybeSingle();

    // Salva idempotência
    await supabase.from("webhook_idempotency").insert({
      key: idempotencyKey,
      provider: "mercado_pago",
      payload: { saude_verde: true, payment_id: dataId },
    });

    // Notifica via WhatsApp
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, whatsapp")
      .eq("id", meta.user_id)
      .maybeSingle();

    if (profile?.whatsapp && sub) {
      await sendWhatsApp(
        profile.whatsapp,
        `🌿 *Cartão Saúde Verde ATIVADO!*\n\nOlá ${profile.full_name || ""}! Seu cartão *${sub.card_number}* já está ativo.\n\n✅ Até 80% de desconto em consultas, exames e farmácias\n✅ Válido por 30 dias\n\nAcesse: https://plantayraiz.com.br/saude-verde/cartao`
      );
    }

    return new Response(JSON.stringify({ ok: true, activated: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[saude-verde-webhook]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
