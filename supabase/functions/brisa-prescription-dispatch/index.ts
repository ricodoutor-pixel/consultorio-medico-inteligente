import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Brisa Prescription Dispatch (Evolution API only — Twilio removido)
 *
 * Triggered after a prescription is digitally signed (gov.br ou ClickSign).
 * Envia o link do PDF assinado + guia ANVISA RDC 660/2023 via WhatsApp
 * usando a Evolution API (Enfª Brisa +55 11 99136-3154).
 *
 * Auditoria: grava `whatsapp_delivered` em public.ai_events.
 */
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
const INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE") || "Enf_Brisa";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const {
      patient_phone,
      patient_name,
      doctor_name,
      prescription_url,
      appointment_id,
      prescription_id,
    } = body;

    if (!patient_phone || !prescription_url) {
      return new Response(
        JSON.stringify({ error: "patient_phone and prescription_url required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Evolution API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const patientFirst = (patient_name || "paciente").split(" ")[0];
    const doctorDisplay = doctor_name || "Dr. Edilson";
    const phoneClean = patient_phone.replace(/\D/g, "");

    const message = `Olá ${patientFirst}! Aqui é a Brisa 🌿

Sua consulta com o ${doctorDisplay} foi finalizada com sucesso! ✅

📋 Segue sua prescrição digital assinada:
${prescription_url}

📦 Guia de importação ANVISA (RDC 660/2023):
https://plantayraiz.com.br/como-funciona

Qualquer dúvida sobre o tratamento, estou aqui! 💚`;

    const evoUrl = `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`;
    const evoResp = await fetch(evoUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({
        number: phoneClean,
        options: { delay: 1200, presence: "composing", linkPreview: true },
        textMessage: { text: message },
      }),
    });

    const evoData = await evoResp.json().catch(() => ({}));
    const ok = evoResp.ok;

    console.log(
      `[Brisa Rx] Evolution dispatch to ${phoneClean.substring(0, 6)}*** | status=${evoResp.status}`
    );

    await supabase.from("ai_events").insert({
      ai_name: "brisa_coo",
      event_type: "whatsapp_delivered",
      status: ok ? "completed" : "failed",
      input_data: {
        appointment_id,
        prescription_id,
        patient_phone: `${phoneClean.substring(0, 4)}****`,
      },
      output_data: { provider: "evolution", evolution_response: evoData },
    });

    return new Response(
      JSON.stringify({ success: ok, provider: "evolution", result: evoData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Dispatch failed";
    console.error("[Brisa Rx] Error:", msg);
    await supabase.from("ai_events").insert({
      ai_name: "brisa_coo",
      event_type: "whatsapp_delivered",
      status: "failed",
      output_data: { error: msg },
    }).then(() => {}, () => {});
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
