// Edge function: send-nurse-brisa-alert
// Cria alerta na tabela public.nurse_brisa_alerts e (opcional) dispara WhatsApp
// via Evolution para o médico.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AlertPayload {
  doctorId: string;
  appointmentId?: string;
  patientId?: string;
  alertType: "new_appointment" | "urgent" | "follow_up" | "document_ready";
  title: string;
  message: string;
  actionUrl?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const EVOLUTION_INSTANCE =
  Deno.env.get("EVOLUTION_INSTANCE_NAME") ?? "Enf Brisa Bot whats";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function notifyDoctorWhatsApp(doctorId: string, title: string, message: string, actionUrl?: string) {
  try {
    const { data: doctor } = await supabase
      .from("doctors")
      .select("whatsapp_number, phone, user_id")
      .eq("id", doctorId)
      .maybeSingle();

    let phone = doctor?.whatsapp_number || doctor?.phone;
    if (!phone && doctor?.user_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", doctor.user_id)
        .maybeSingle();
      phone = prof?.phone ?? null;
    }
    if (!phone) return { skipped: true, reason: "no_phone" };

    const digits = String(phone).replace(/\D/g, "");
    const jid = digits.startsWith("55") ? digits : `55${digits}`;

    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
      return { skipped: true, reason: "evolution_not_configured" };
    }

    const text = `🔔 *${title}*\n\n${message}${
      actionUrl ? `\n\n👉 Abrir consulta:\n${actionUrl}` : ""
    }`;

    const url = `${EVOLUTION_URL.replace(/\/+$/, "")}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY,
      },
      body: JSON.stringify({ number: jid, text }),
    });
    return { sent: res.ok, status: res.status };
  } catch (e) {
    console.error("[send-nurse-brisa-alert] whatsapp error", e);
    return { sent: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as AlertPayload;

    if (!payload?.doctorId || !payload?.alertType || !payload?.title || !payload?.message) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("nurse_brisa_alerts")
      .insert([
        {
          doctor_id: payload.doctorId,
          appointment_id: payload.appointmentId ?? null,
          patient_id: payload.patientId ?? null,
          alert_type: payload.alertType,
          title: payload.title,
          message: payload.message,
          action_url: payload.actionUrl ?? null,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Notifica médico via WhatsApp (best-effort)
    const wa = await notifyDoctorWhatsApp(
      payload.doctorId,
      payload.title,
      payload.message,
      payload.actionUrl
    );

    return new Response(
      JSON.stringify({ success: true, alert: data, whatsapp: wa }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-nurse-brisa-alert] error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
