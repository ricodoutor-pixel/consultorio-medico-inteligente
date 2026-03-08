import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { appointmentId, doctorName, amount, patientEmail, description } = await req.json();

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Create Mercado Pago preference
    const preference = {
      items: [
        {
          title: description || `Consulta com ${doctorName || "Especialista"}`,
          quantity: 1,
          unit_price: Number(amount) || 49.90,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: patientEmail || "paciente@plantaeraiz.com",
      },
      back_urls: {
        success: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/dashboard?payment=success`,
        failure: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/pagamento?status=failure`,
        pending: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/pagamento?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: appointmentId || `planta-raiz-${Date.now()}`,
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
      console.error("Mercado Pago error:", mpResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento no Mercado Pago" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();

    // Update appointment with payment preference if appointmentId exists
    if (appointmentId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase
        .from("appointments")
        .update({
          payment_status: "awaiting_payment",
          payment_id: mpData.id,
        })
        .eq("id", appointmentId);
    }

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      preference_id: mpData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-payment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
