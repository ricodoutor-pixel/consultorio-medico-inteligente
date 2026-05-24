import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace("Bearer ", "") || "");
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { planSlug, currency = "BRL", beneficiaries = [], referralCode } = await req.json();

    // Resolve affiliate referrer from referralCode (if provided)
    let affiliateReferrer: string | null = null;
    if (referralCode && typeof referralCode === "string") {
      const { data: ref } = await supabase
        .from("referral_links")
        .select("user_id")
        .eq("code", referralCode.toUpperCase())
        .maybeSingle();
      if (ref?.user_id && ref.user_id !== user.id) affiliateReferrer = ref.user_id;
    }

    const { data: plan, error: planError } = await supabase
      .from("saude_verde_plans")
      .select("*")
      .eq("slug", planSlug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: existing } = await supabase
      .from("saude_verde_subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Você já possui um Cartão Saúde Verde ativo." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const cardNumber = `SV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MercadoPago não configurado");

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `sv-${user.id}-${planSlug}-${Date.now()}`,
      },
      body: JSON.stringify({
        items: [{
          title: `Cartão Saúde Verde — ${plan.name}`,
          description: `Assinatura mensal com até 80% de desconto em saúde`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(plan.price_brl),
        }],
        payer: { email: user.email },
        back_urls: {
          success: `https://plantayraiz.com.br/saude-verde/cartao?status=success`,
          failure: `https://plantayraiz.com.br/saude-verde?status=error`,
          pending: `https://plantayraiz.com.br/saude-verde/cartao?status=pending`,
        },
        auto_return: "approved",
        external_reference: `sv-sub-${user.id}-${planSlug}`,
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
          plan_slug: planSlug,
          card_number: cardNumber,
          module: "saude_verde",
        },
      }),
    });

    const mpData = await mpResponse.json();
    if (!mpData.init_point) throw new Error("Falha ao gerar link de pagamento");

    await supabase.from("saude_verde_subscriptions").insert({
      user_id: user.id,
      plan_id: plan.id,
      status: "pending",
      card_number: cardNumber,
      currency,
      beneficiaries,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      mp_subscription_id: mpData.id,
      affiliate_referrer: affiliateReferrer,
      auto_renew: true,
    });

    return new Response(JSON.stringify({
      success: true,
      init_point: mpData.init_point,
      card_number: cardNumber,
      plan_name: plan.name,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("[saude-verde-subscribe]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
