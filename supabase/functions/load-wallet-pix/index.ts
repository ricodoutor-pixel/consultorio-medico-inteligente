// Edge: load-wallet-pix — gera PIX para carga de saldo na carteira do Cartão Saúde Plus
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supaUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const { amount } = await req.json();
    const value = Number(amount);
    if (!value || value < 10 || value > 5000) {
      return new Response(JSON.stringify({ error: "invalid_amount", min: 10, max: 5000 }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) {
      return new Response(JSON.stringify({ error: "mp_not_configured" }), { status: 500, headers: corsHeaders });
    }

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `wallet-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: value,
        description: `Carga Carteira Saúde Plus — R$ ${value.toFixed(2)}`,
        payment_method_id: "pix",
        payer: { email: user.email },
        external_reference: `wallet_load:${user.id}:${Date.now()}`,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/saude-plus-webhook`,
      }),
    });
    const mp = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP error", mp);
      return new Response(JSON.stringify({ error: "mp_error", details: mp }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: mp.id,
        qr_code: mp.point_of_interaction?.transaction_data?.qr_code,
        qr_base64: mp.point_of_interaction?.transaction_data?.qr_code_base64,
        amount: value,
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
