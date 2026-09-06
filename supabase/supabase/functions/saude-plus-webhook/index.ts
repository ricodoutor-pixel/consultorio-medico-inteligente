// Edge: saude-plus-webhook — Mercado Pago notifica pagamento → ativa assinatura OU credita carteira PIX
// HARDENED: HMAC verify + idempotência via webhook_idempotency
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function verifyMpSignature(req: Request, rawBody: string, paymentId: string): Promise<boolean> {
  const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[saude-plus-webhook] MERCADO_PAGO_WEBHOOK_SECRET not configured — refusing request");
    return false;
  }
  const sigHeader = req.headers.get("x-signature") || "";
  const reqId = req.headers.get("x-request-id") || "";
  if (!sigHeader || !reqId) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => {
    const [k, v] = p.split("=");
    return [k?.trim(), v?.trim()];
  }));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const manifest = `id:${paymentId};request-id:${reqId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === v1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const paymentId = body?.data?.id || new URL(req.url).searchParams.get("id");
    if (!paymentId) {
      return new Response(JSON.stringify({ received: true, ignored: "no_payment_id" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HMAC verify
    const valid = await verifyMpSignature(req, rawBody, String(paymentId));
    if (!valid) {
      console.warn("[saude-plus-webhook] invalid signature");
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotência — bloqueia reprocessamento do mesmo payment_id
    const { error: idemErr } = await admin
      .from("webhook_idempotency")
      .insert({ provider: "mercado_pago", message_id: String(paymentId), channel: "saude_plus", sender: "mp" });
    if (idemErr) {
      // unique_violation → já processado
      if ((idemErr as any).code === "23505") {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("idempotency insert error", idemErr);
    }

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) {
      console.error("MP token missing");
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${mpToken}` },
    });
    const payment = await mpRes.json();

    if (payment.status !== "approved") {
      return new Response(JSON.stringify({ received: true, status: payment.status }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = String(payment.external_reference || "");
    const [kind, userId, ref] = ext.split(":");

    if (kind === "saude_plus" && userId && ref) {
      // Só ativa se ainda estiver pending (evita renovação acidental)
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error } = await admin
        .from("health_card_subscriptions")
        .update({
          status: "active",
          activated_at: now.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          next_billing_date: periodEnd.toISOString(),
        })
        .eq("user_id", userId)
        .eq("card_number", ref)
        .eq("status", "pending");
      if (error) console.error("activation error", error);
    } else if (kind === "wallet_load" && userId) {
      const { error } = await admin.rpc("credit_health_card_wallet", {
        _user_id: userId,
        _amount: Number(payment.transaction_amount),
        _mp_payment_id: String(paymentId),
      });
      if (error) console.error("wallet credit error", error);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[saude-plus-webhook]", (e as Error).message);
    return new Response(JSON.stringify({ received: true, error: "internal" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
