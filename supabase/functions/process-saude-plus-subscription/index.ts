// Edge: process-saude-plus-subscription
// Cria assinatura no Mercado Pago (preapproval) + linha pending em health_card_subscriptions.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLANS = {
  individual: { monthly: 24.9, annual: 24.9 * 12 },
  familiar: { monthly: 34.9, annual: 29.9 * 12 },
} as const;

function generateCardNumber(): string {
  const n = Math.floor(10000000 + Math.random() * 89999999);
  return `PYR-${n}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supaUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { plan_type, billing_cycle, payer_email } = await req.json();
    if (!["individual", "familiar"].includes(plan_type) || !["monthly", "annual"].includes(billing_cycle)) {
      return new Response(JSON.stringify({ error: "invalid_plan" }), { status: 400, headers: corsHeaders });
    }

    const amount = PLANS[plan_type as "individual" | "familiar"][billing_cycle as "monthly" | "annual"];
    const card_number = generateCardNumber();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Cria PIX no MP (1ª cobrança). Recorrência via preapproval pode ser ativada depois.
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    let mp_payment_id: string | null = null;
    let qr_code: string | null = null;
    let qr_base64: string | null = null;

    if (mpToken) {
      const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `saude-plus-${user.id}-${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: `Cartão Saúde Plus ${plan_type} (${billing_cycle})`,
          payment_method_id: "pix",
          payer: { email: payer_email || user.email },
          external_reference: `saude_plus:${user.id}:${card_number}`,
          notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/saude-plus-webhook`,
        }),
      });
      const mpData = await mpRes.json();
      if (mpRes.ok) {
        mp_payment_id = String(mpData.id);
        qr_code = mpData.point_of_interaction?.transaction_data?.qr_code || null;
        qr_base64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null;
      } else {
        console.error("MP error", mpData);
      }
    }

    const { data: sub, error } = await admin
      .from("health_card_subscriptions")
      .insert({
        user_id: user.id,
        card_number,
        plan_type,
        billing_cycle,
        amount,
        status: "pending",
        mp_subscription_id: mp_payment_id,
        metadata: { mp_payment_id, qr_code },
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: "db_error", details: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: sub,
        payment: { mp_payment_id, qr_code, qr_base64 },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
