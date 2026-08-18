import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const toolPrices: Record<string, { title: string; amount: number }> = {
  "cardiaco": { title: "Módulo Monitor Cardíaco", amount: 29.90 },
  "fundoscopia": { title: "Módulo Fundoscopia IA", amount: 29.90 },
  "oximetria": { title: "Módulo Oximetria", amount: 29.90 },
  "dermatoscopia": { title: "Módulo Dermatoscopia IA", amount: 29.90 },
  "mobilidade": { title: "Módulo Mobilidade Articular", amount: 29.90 },
  "estetoscopio": { title: "Módulo Estetoscópio Digital", amount: 29.90 },
  "pulmonar": { title: "Módulo Ausculta Pulmonar", amount: 29.90 },
  "tremor": { title: "Módulo Tremorometria", amount: 29.90 },
  "urine": { title: "Módulo Urinálise", amount: 29.90 },
  "acuity": { title: "Módulo Acuidade Visual", amount: 29.90 },
  "gps": { title: "Módulo Rastreador GPS", amount: 29.90 },
  "combo_tools": { title: "Combo 11 Ferramentas Diagnósticas", amount: 97.00 },
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

    const { toolId } = await req.json();

    if (!toolId || typeof toolId !== "string" || !toolPrices[toolId]) {
      return new Response(JSON.stringify({ error: "toolId inválido ou não fornecido" }), {
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

    const tool = toolPrices[toolId];
    const siteUrl = "https://plantayraiz.com.br"; // Always use main domain for production apps
    const userEmail = user.email || "";

    const preference = {
      items: [{
        title: tool.title,
        quantity: 1,
        unit_price: tool.amount,
        currency_id: "BRL",
      }],
      payer: { email: userEmail || undefined },
      back_urls: {
        success: `${siteUrl}/meus-exames?payment=success&tool=${toolId}`,
        failure: `${siteUrl}/planos?payment=failure`,
        pending: `${siteUrl}/planos?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook-tools`,
      external_reference: `tool-${toolId}-${user.id}-${Date.now()}`,
      statement_descriptor: "PLANTA E RAIZ",
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }], // Prefer fast payments like PIX and CC
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
      console.error("[create-tool-checkout] MP preference error:", mpResponse.status, mpErr);
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento no Mercado Pago" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      preference_id: mpData.id,
      toolId,
      amount: tool.amount,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-tool-checkout] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
