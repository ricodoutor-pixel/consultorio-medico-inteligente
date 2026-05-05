import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Brisa Prescription Dispatch
 * Webhook: triggered when a doctor signs a digital prescription.
 * Sends the prescription PDF link to the patient via WhatsApp.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { patient_phone, patient_name, doctor_name, prescription_url, appointment_id } = body;

    if (!patient_phone || !prescription_url) {
      return new Response(JSON.stringify({ error: "patient_phone and prescription_url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing API keys" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patientFirst = (patient_name || "paciente").split(" ")[0];
    const doctorDisplay = doctor_name || "Dr. Edilson";

    const message = `Olá ${patientFirst}! Aqui é a Brisa 🌿

Sua consulta com o ${doctorDisplay} foi finalizada com sucesso! ✅

📋 Segue sua prescrição digital:
${prescription_url}

📦 Guia de importação ANVISA:
https://plantayraiz.com.br/como-funciona

Qualquer dúvida sobre o tratamento, estou aqui! 💚`;

    const phoneClean = patient_phone.replace(/\D/g, "");

    // Send via Twilio
    const twilioResp = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `whatsapp:+${phoneClean}`,
        From: "whatsapp:+5511991363154",
        Body: message,
      }),
    });

    const twilioData = await twilioResp.json();
    console.log(`[Brisa Rx] Prescription sent to ${phoneClean.substring(0, 6)}*** | SID: ${twilioData.sid || "N/A"}`);

    // Log the dispatch
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("ai_events").insert({
      ai_name: "brisa_coo",
      event_type: "prescription_dispatch",
      status: twilioResp.ok ? "completed" : "failed",
      input_data: { appointment_id, patient_phone: `${phoneClean.substring(0, 4)}****` },
      output_data: { twilio_sid: twilioData.sid, twilio_status: twilioData.status },
    });

    return new Response(JSON.stringify({
      success: twilioResp.ok,
      sid: twilioData.sid,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Brisa Rx] Error:", e);
    return new Response(JSON.stringify({ error: "Dispatch failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
