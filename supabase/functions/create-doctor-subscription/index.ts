import { createClient } from "npm:@supabase/supabase-js@2";

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

    // Ownership check: authenticated user must own the doctor profile
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: doctorOwn } = await serviceClient
      .from("doctors")
      .select("id")
      .eq("id", doctorId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!doctorOwn) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-controlled pricing — VIP (basic) has 0% platform fee on consultations
    const plans: Record<string, { title: string; amount: number; feeRate: number }> = {
      basic:        { title: "Plano Médico VIP — Taxa Zero",  amount: 99,  feeRate: 0 },
      professional: { title: "Plano Médico Profissional",     amount: 299, feeRate: 0.05 },
      premium:      { title: "Plano Médico Premium",          amount: 599, feeRate: 0.03 },
    };

    const plan = plans[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: `Plano '${planId}' inválido` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://www.plantayraiz.com.br";

    // Assinatura recorrente: o Mercado Pago cobra automaticamente todo mês (preapproval).
    // external_reference começa com `plano_medico:` para o webhook ativar o plano a cada cobrança.
    const preference = {
      reason: plan.title,
      external_reference: `plano_medico:${user.id}:${Date.now()}:${planId}`,
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.amount,
        currency_id: "BRL",
      },
      back_url: `${siteUrl}/dashboard-medico?subscription=success&plan=${planId}`,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
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

    // Insert subscription record (serviceClient already created above)
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
