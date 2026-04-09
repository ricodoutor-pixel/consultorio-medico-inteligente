import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planId, doctorId } = await req.json();
    if (!planId || !doctorId) {
      return new Response(JSON.stringify({ error: "planId e doctorId são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-controlled pricing
    const plans: Record<string, { title: string; amount: number }> = {
      basic:        { title: "Plano Médico Básico",        amount: 99 },
      professional: { title: "Plano Médico Profissional",  amount: 299 },
      premium:      { title: "Plano Médico Premium",       amount: 599 },
    };

    const plan = plans[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: `Plano '${planId}' inválido` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://consultorio-medico-inteligente.lovable.app";

    const preference = {
      items: [{
        title: plan.title,
        quantity: 1,
        unit_price: plan.amount,
        currency_id: "BRL",
      }],
      payer: { email: user.email || undefined },
      back_urls: {
        success: `${siteUrl}/dashboard-medico?subscription=success&plan=${planId}`,
        failure: `${siteUrl}/dashboard-medico?subscription=failure`,
        pending: `${siteUrl}/dashboard-medico?subscription=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: `doctor-sub-${doctorId}-${planId}-${Date.now()}`,
      statement_descriptor: "PLANTA RAIZ MED",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      console.error("[create-doctor-subscription] MP error:", mpResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();

    // Insert subscription record
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await serviceClient.from("medical_subscriptions").upsert({
      doctor_id: doctorId,
      plan_tier: planId,
      amount: plan.amount,
      status: "pending",
      mercadopago_subscription_id: mpData.id,
    }, { onConflict: "doctor_id,plan_tier" }).select();

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      preference_id: mpData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-doctor-subscription] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
