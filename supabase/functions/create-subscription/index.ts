import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Server-controlled plan pricing — single source of truth
const plans: Record<string, { title: string; amount: number }> = {
  "usuario":            { title: "Plano Usuário - Paciente",          amount: 29 },
  "lojista-pro":        { title: "Plano Lojista Pro - Vendedor",      amount: 49 },
  "medico-vip":         { title: "Plano Médico VIP",                  amount: 99 },
  "empresa-parceiros":  { title: "Plano Empresa & Parceiros",         amount: 149 },
  "clinica-familia":    { title: "Plano Clínica Família - Premium",   amount: 195 },
  // Wellness plans
  "wellness-basic":     { title: "Bem-Estar Básico",                  amount: 99 },
  "wellness-pro":       { title: "Bem-Estar Pro",                     amount: 149 },
  "wellness-premium":   { title: "Bem-Estar Premium",                 amount: 199 },
  // Legacy IDs
  "consultorio-virtual": { title: "Consultório Virtual - Plano Médico", amount: 150 },
  "essencial":           { title: "Plano Essencial",                    amount: 50 },
  "acesso":              { title: "Plano Acesso",                       amount: 100 },
  "familia":             { title: "Plano Família",                      amount: 250 },
  "empresas":            { title: "Plano Empresas & Parceiros",         amount: 300 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado. Faça login primeiro." }), {
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
      return new Response(JSON.stringify({ error: "Não autorizado. Faça login primeiro." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planId } = await req.json();

    if (!planId || typeof planId !== "string") {
      return new Response(JSON.stringify({ error: "planId é obrigatório" }), {
        status: 400,
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

    const plan = plans[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: `Plano '${planId}' não encontrado` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://consultorio-medico-inteligente.lovable.app";
    const userEmail = user.email || "";

    // ========== Try Mercado Pago Preapproval (Real Recurring) ==========
    const preapprovalPayload = {
      reason: plan.title,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.amount,
        currency_id: "BRL",
      },
      payer_email: userEmail,
      back_url: `${siteUrl}/dashboard?payment=success&plan=${planId}`,
      external_reference: `sub-${planId}-${user.id}-${Date.now()}`,
      status: "pending",
    };

    console.log("[create-subscription] Creating preapproval for:", planId, plan.amount);

    const preapprovalResp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalPayload),
    });

    if (preapprovalResp.ok) {
      const preapprovalData = await preapprovalResp.json();
      console.log("[create-subscription] Preapproval created:", preapprovalData.id);

      return new Response(JSON.stringify({
        init_point: preapprovalData.init_point,
        preapproval_id: preapprovalData.id,
        plan: planId,
        amount: plan.amount,
        type: "recurring",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== Fallback: Checkout Preference (one-time) ==========
    const errText = await preapprovalResp.text();
    console.warn("[create-subscription] Preapproval failed, falling back to preference:", preapprovalResp.status, errText);

    const preference = {
      items: [{
        title: plan.title,
        quantity: 1,
        unit_price: plan.amount,
        currency_id: "BRL",
      }],
      payer: { email: userEmail || undefined },
      back_urls: {
        success: `${siteUrl}/dashboard?payment=success&plan=${planId}`,
        failure: `${siteUrl}/planos?status=failure`,
        pending: `${siteUrl}/planos?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: `subscription-${planId}-${Date.now()}`,
      statement_descriptor: "PLANTA E RAIZ",
      payment_methods: {
        excluded_payment_types: [] as { id: string }[],
        installments: 1,
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const mpErr = await mpResponse.text();
      console.error("[create-subscription] MP preference error:", mpResponse.status, mpErr);
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento no Mercado Pago" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      preference_id: mpData.id,
      plan: planId,
      amount: plan.amount,
      type: "one-time",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-subscription] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
