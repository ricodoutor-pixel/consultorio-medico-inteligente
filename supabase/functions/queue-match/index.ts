/**
 * queue-match — Uber-style doctor matching for consultation queue
 * 
 * Monitors the consultation_queue table and matches waiting patients
 * with the first available online doctor. Notifies via Twilio.
 */
import { createClient } from "npm:@supabase/supabase-js@2.42.0@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";

async function notifyDoctor(phone: string, patientName: string, queueId: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !phone) return false;
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const message = `🩺 Nova consulta na fila!\n\nPaciente: ${patientName}\nAceite agora no painel médico.\n\nPlanta y Raiz - Telemedicina`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: "whatsapp:+5511991363154",
        To: `whatsapp:${phone}`,
        Body: message,
      }),
    });
    return resp.ok;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "match";

    if (action === "join") {
      // Patient joins queue
      const { patient_id, specialty, amount, payment_id } = body;
      if (!patient_id) throw new Error("patient_id required");

      const jitsiRoom = `plr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const { data: entry, error } = await supabase
        .from("consultation_queue")
        .insert({
          patient_id,
          specialty: specialty || "Cannabis Medicinal",
          amount: amount || 30,
          payment_id: payment_id || null,
          payment_confirmed: !!payment_id,
          jitsi_room: jitsiRoom,
        })
        .select("id, jitsi_room")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ status: "ok", queue_id: entry.id, jitsi_room: entry.jitsi_room }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "accept") {
      // Doctor accepts a queue entry
      const { queue_id, doctor_id } = body;
      if (!queue_id || !doctor_id) throw new Error("queue_id and doctor_id required");

      const { data: entry, error } = await supabase
        .from("consultation_queue")
        .update({
          matched_doctor_id: doctor_id,
          status: "matched",
          matched_at: new Date().toISOString(),
        })
        .eq("id", queue_id)
        .eq("status", "waiting")
        .select("id, jitsi_room, patient_id")
        .single();

      if (error) throw error;

      // Create notification for patient
      if (entry) {
        await supabase.from("notifications").insert({
          user_id: entry.patient_id,
          title: "Médico encontrado!",
          message: "Um médico aceitou sua consulta. Clique para entrar na sala.",
          type: "consultation",
          action_url: `/sala-espera?room=${entry.jitsi_room}`,
        });
      }

      return new Response(JSON.stringify({ status: "ok", entry }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: match waiting patients with online doctors
    const { data: waiting } = await supabase
      .from("consultation_queue")
      .select("id, patient_id, specialty, priority")
      .eq("status", "waiting")
      .eq("payment_confirmed", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (!waiting?.length) {
      return new Response(JSON.stringify({ status: "ok", matched: 0, waiting: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find online doctors
    const { data: onlineDoctors } = await supabase
      .from("doctors")
      .select("id, user_id, specialty")
      .eq("is_online", true)
      .eq("is_verified", true);

    if (!onlineDoctors?.length) {
      // Notify all doctors that patients are waiting
      const { data: allDoctors } = await supabase
        .from("doctors")
        .select("user_id")
        .eq("is_verified", true)
        .limit(5);

      for (const doc of allDoctors || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", doc.user_id)
          .single();

        if (profile?.phone) {
          await notifyDoctor(profile.phone, `${waiting.length} paciente(s)`, "");
        }
      }

      return new Response(JSON.stringify({ status: "ok", matched: 0, waiting: waiting.length, doctors_notified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match patients to doctors
    let matched = 0;
    for (const patient of waiting) {
      const doctor = onlineDoctors.find(d => d.specialty === patient.specialty) || onlineDoctors[0];
      if (!doctor) continue;

      // Notify doctor
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("id", doctor.user_id)
        .single();

      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", patient.patient_id)
        .single();

      if (profile?.phone) {
        await notifyDoctor(profile.phone, patientProfile?.full_name || "Paciente", patient.id);
      }

      // Send in-app notification
      await supabase.from("notifications").insert({
        user_id: doctor.user_id,
        title: "Paciente na fila!",
        message: `${patientProfile?.full_name || "Paciente"} aguarda consulta. Aceite agora!`,
        type: "queue_match",
        action_url: `/painel-medico?queue=${patient.id}`,
      });

      matched++;
    }

    return new Response(JSON.stringify({ status: "ok", matched, waiting: waiting.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[QUEUE-MATCH]", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
