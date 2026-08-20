import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_FEE_CONSULTATION = 0.07; // 7% consultas
const PLATFORM_FEE_MARKETPLACE = 0.05; // 5% marketplace

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const body = await req.json();
    const { appointmentId, type = "consultation" } = body;

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch appointment details
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select("amount, patient_id, doctor_id")
      .eq("id", appointmentId)
      .single();

    if (apptErr || !appt) {
      return new Response(JSON.stringify({ error: "Consulta não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (appt.patient_id !== authData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalAmount = Number(appt.amount);
    const feeRate = type === "marketplace" ? PLATFORM_FEE_MARKETPLACE : PLATFORM_FEE_CONSULTATION;
    const platformFee = Math.round(totalAmount * feeRate * 100) / 100;
    const doctorPayout = Math.round((totalAmount - platformFee) * 100) / 100;

    // Fetch doctor info for the payment description
    const { data: doctor } = await supabase
      .from("doctors")
      .select("crm, specialty")
      .eq("id", appt.doctor_id)
      .single();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Create Mercado Pago preference with marketplace split info in metadata
    const preference = {
      items: [
        {
          title: `Consulta Cannabis Medicinal - ${doctor?.specialty || "Especialista"}`,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: "BRL",
        },
      ],
      marketplace_fee: platformFee,
      back_urls: {
        success: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/dashboard?payment=success`,
        failure: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/pagamento?status=failure`,
        pending: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/pagamento?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: appointmentId,
      statement_descriptor: "PLANTA E RAIZ",
      metadata: {
        appointment_id: appointmentId,
        doctor_id: appt.doctor_id,
        patient_id: appt.patient_id,
        platform_fee: platformFee,
        doctor_payout: doctorPayout,
        fee_rate: feeRate,
        type,
      },
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
      console.error("MP error:", mpResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();

    // Update appointment with payment info
    await supabase
      .from("appointments")
      .update({
        payment_status: "awaiting_payment",
        payment_id: mpData.id,
      })
      .eq("id", appointmentId);

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      preference_id: mpData.id,
      split: {
        total: totalAmount,
        platform_fee: platformFee,
        doctor_payout: doctorPayout,
        fee_rate: `${feeRate * 100}%`,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-payment-split error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
