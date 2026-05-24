// Edge: saude-plus-webhook — Mercado Pago notifica pagamento → ativa assinatura OU credita carteira PIX
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const paymentId = body?.data?.id || new URL(req.url).searchParams.get("id");
    if (!paymentId) {
      return new Response(JSON.stringify({ received: true, ignored: "no_payment_id" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (kind === "saude_plus" && userId && ref) {
      // ativa assinatura
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
        .eq("card_number", ref);
      if (error) console.error("activation error", error);
    } else if (kind === "wallet_load" && userId) {
      // credita carteira
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
    console.error(e);
    return new Response(JSON.stringify({ received: true, error: "internal" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
