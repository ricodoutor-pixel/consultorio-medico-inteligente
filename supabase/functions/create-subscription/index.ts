import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
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

    const userEmail = user.email as string;

    const { planId } = await req.json();

    // Validate planId
    if (!planId || typeof planId !== "string") {
      return new Response(JSON.stringify({ error: "planId é obrigatório" }), {
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

    // Server-controlled plan pricing — user cannot override amounts
    const plans: Record<string, { title: string; amount: number; frequency: number; frequency_type: string }> = {
      "consultorio-virtual": { title: "Consultório Virtual - Plano Médico", amount: 150, frequency: 1, frequency_type: "months" },
      "essencial": { title: "Plano Essencial", amount: 50, frequency: 1, frequency_type: "months" },
      "acesso": { title: "Plano Acesso", amount: 100, frequency: 1, frequency_type: "months" },
      "familia": { title: "Plano Família", amount: 250, frequency: 1, frequency_type: "months" },
      "empresas": { title: "Plano Empresas & Parceiros", amount: 300, frequency: 1, frequency_type: "months" },
    };

    const plan = plans[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://consultorio-medico-inteligente.lovable.app";

    const preference = {
      items: [
        {
          title: plan.title,
          quantity: 1,
          unit_price: plan.amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: userEmail,
      },
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
        excluded_payment_types: [],
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
      const errText = await mpResponse.text();
      console.error("[create-subscription] Mercado Pago error:", mpResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento no Mercado Pago" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      preference_id: mpData.id,
      plan: planId,
      amount: plan.amount,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-subscription] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
