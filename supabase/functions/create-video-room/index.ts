// Edge Function: create-video-room
// Cria (ou retorna) uma sala Jitsi para uma consulta, garantindo que
// apenas o paciente ou o médico da consulta possam gerar/entrar na sala.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function safeRoomName(consultationId: string): string {
  // Nome único, difícil de adivinhar, mas determinístico por consulta.
  const salt = Deno.env.get("JITSI_ROOM_SALT") ?? "plr-jitsi";
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${consultationId}`);
  // hash sync via SubtleCrypto (async wrapper abaixo)
  return `plr-${consultationId}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
}

async function hashedRoomName(consultationId: string): Promise<string> {
  const salt = Deno.env.get("JITSI_ROOM_SALT") ?? "plr-jitsi";
  const buf = new TextEncoder().encode(`${salt}:${consultationId}`);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `plr-${hex.slice(0, 32)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client no contexto do usuário (para checar identidade via RLS)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const consultationId: string | undefined = body?.consultation_id;
    if (!consultationId) {
      return new Response(JSON.stringify({ error: "consultation_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Verifica se o solicitante é paciente OU médico da consulta
    const { data: appt, error: apptErr } = await admin
      .from("appointments")
      .select("id, patient_id, doctor_id")
      .eq("id", consultationId)
      .maybeSingle();

    if (apptErr || !appt) {
      return new Response(JSON.stringify({ error: "Consultation not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPatient = appt.patient_id === userId;
    let isDoctor = false;
    if (!isPatient) {
      const { data: doctor } = await admin
        .from("doctors")
        .select("id, user_id")
        .eq("id", appt.doctor_id)
        .maybeSingle();
      isDoctor = doctor?.user_id === userId;
    }

    if (!isPatient && !isDoctor) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sala existente?
    const { data: existing } = await admin
      .from("video_rooms")
      .select("*")
      .eq("consultation_id", consultationId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        room_name: existing.room_name,
        consultation_id: existing.consultation_id,
        role: isDoctor ? "doctor" : "patient",
        reused: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const roomName = await hashedRoomName(consultationId);

    const { data: inserted, error: insErr } = await admin
      .from("video_rooms")
      .insert({
        consultation_id: consultationId,
        room_name: roomName,
        patient_id: appt.patient_id,
        doctor_id: appt.doctor_id,
        status: "pending",
      })
      .select()
      .single();

    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      room_name: inserted.room_name,
      consultation_id: inserted.consultation_id,
      role: isDoctor ? "doctor" : "patient",
      reused: false,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
