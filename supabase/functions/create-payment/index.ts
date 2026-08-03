import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- JWT Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } = await anonClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;

    const { appointmentId, doctorName, patientEmail, description, amount: passedAmount } = await req.json();

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Server-side amount lookup ---
    let amount = passedAmount ? Number(passedAmount) : 49.90; // default for non-appointment payments
    if (appointmentId) {
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .select("amount, patient_id")
        .eq("id", appointmentId)
        .single();

      if (apptError || !appt) {
        return new Response(JSON.stringify({ error: "Consulta não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the caller is the patient
      if (appt.patient_id !== userId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      amount = Number(appt.amount) || 49.90;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const siteUrl = "https://consultorio-medico-inteligente.lovable.app";

    const preference = {
      items: [
        {
          title: description || `Consulta com ${doctorName || "Especialista"}`,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: patientEmail || authData.user.email || "paciente@plantaeraiz.com",
      },
      back_urls: {
        success: `${siteUrl}/dashboard?payment=success`,
        failure: `${siteUrl}/pagamento?status=failure`,
        pending: `${siteUrl}/pagamento?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: appointmentId || `planta-raiz-${Date.now()}`,
      statement_descriptor: "PLANTA E RAIZ",
      metadata: {
        type: "consultation",
        patient_id: userId,
        appointment_id: appointmentId || null,
      },
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

    if (appointmentId) {
      await supabase
        .from("appointments")
        .update({
          payment_status: "awaiting_payment",
          payment_id: mpData.id,
        })
        .eq("id", appointmentId);
    }

    // Only return production init_point
    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      preference_id: mpData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-payment error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
