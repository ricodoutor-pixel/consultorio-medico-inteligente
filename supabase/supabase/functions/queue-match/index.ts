/**
 * queue-match — Uber-style doctor matching for consultation queue
 *
 * Auth model:
 *  - action="join"   → requires patient JWT; patient_id forced to auth.uid()
 *  - action="accept" → requires doctor JWT; caller must own a verified doctor row
 *  - default match    → service-role only (cron)
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const EVO_URL = Deno.env.get("EVOLUTION_API_URL") || "";
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getUserFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  // Service-role bypass not applicable for join/accept (they must be a real user)
  try {
    const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await c.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (error || !data?.claims?.sub) return null;
    return data.claims.sub as string;
  } catch {
    return null;
  }
}

async function notifyDoctor(phone: string, patientName: string): Promise<boolean> {
  if (!EVO_URL || !EVO_KEY || !phone) return false;
  try {
    const digits = phone.replace(/\D/g, "");
    const jid = digits.startsWith("55") ? digits : `55${digits}`;
    const message = `🩺 Nova consulta na fila!\n\nPaciente: ${patientName}\nAceite agora no painel médico.\n\nPlanta y Raiz - Telemedicina`;
    const resp = await fetch(`${EVO_URL}/message/sendText/${encodeURIComponent(EVO_INSTANCE)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({ number: jid, text: message, delay: 1200 }),
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

    // ── action: join ──────────────────────────────────────────
    if (action === "join") {
      const uid = await getUserFromAuth(req);
      if (!uid) return jsonRes({ error: "Unauthorized" }, 401);

      const { specialty, amount } = body;
      const consultationId = crypto.randomUUID();

      // SECURITY: payment_confirmed MUST be set only by mercadopago-webhook after
      // HMAC-verified payment. Client-supplied payment_id is ignored here to
      // prevent free-consultation bypass.
      const { data: entry, error } = await supabase
        .from("consultation_queue")
        .insert({
          id: consultationId,
          patient_id: uid, // forced to authenticated user
          specialty: specialty || "Cannabis Medicinal",
          amount: amount || 30,
          payment_id: null,
          payment_confirmed: false,
          jitsi_room: null, // Room is generated at accept phase
        })
        .select("id")
        .single();

      if (error) throw error;
      return jsonRes({ status: "ok", queue_id: entry.id });
    }

    // ── action: accept ────────────────────────────────────────
    if (action === "accept") {
      const uid = await getUserFromAuth(req);
      if (!uid) return jsonRes({ error: "Unauthorized" }, 401);

      const { queue_id } = body;
      if (!queue_id) return jsonRes({ error: "queue_id required" }, 400);

      // Caller must be a verified doctor; doctor_id is derived from auth, never trusted from body
      const { data: doctor } = await supabase
        .from("doctors")
        .select("id, is_verified")
        .eq("user_id", uid)
        .maybeSingle();

      if (!doctor || !doctor.is_verified) {
        return jsonRes({ error: "Forbidden: caller is not a verified doctor" }, 403);
      }

      // Chamar create-video-room para gerar o token JWT e a sala oficial
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
      
      const createRoomResp = await supabase.functions.invoke("create-video-room", {
        body: {
          consultation_id: queue_id,
          patient_name: "Paciente",
          doctor_name: profile?.full_name || "Médico Plantão",
          is_doctor: true
        }
      });
      
      if (createRoomResp.error) throw createRoomResp.error;
      const roomUrl = createRoomResp.data?.room_url;
      const jitsiRoomName = createRoomResp.data?.room_name;

      const { data: entry, error } = await supabase
        .from("consultation_queue")
        .update({
          matched_doctor_id: doctor.id,
          status: "matched",
          matched_at: new Date().toISOString(),
          jitsi_room: jitsiRoomName
        })
        .eq("id", queue_id)
        .eq("status", "waiting")
        .select("id, jitsi_room, patient_id")
        .single();

      if (error) throw error;

      if (entry) {
        // Enviar notificação pro paciente. No frontend, useConsultationQueue vai reagir a "matched" e usar o token.
        await supabase.from("notifications").insert({
          user_id: entry.patient_id,
          title: "Médico encontrado!",
          message: "Um médico aceitou sua consulta. Clique para entrar na sala.",
          type: "consultation",
          action_url: `/orientacao-video?consultation=${queue_id}`,
        });
      }

      return jsonRes({ status: "ok", entry, createRoomData: createRoomResp.data });
    }

    // ── default action: match (service-role only) ─────────────
    const guard = requireServiceAuth(req, corsHeaders);
    if (guard) return guard;

    const { data: waiting } = await supabase
      .from("consultation_queue")
      .select("id, patient_id, specialty, priority")
      .eq("status", "waiting")
      .eq("payment_confirmed", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (!waiting?.length) return jsonRes({ status: "ok", matched: 0, waiting: 0 });

    const { data: onlineDoctors } = await supabase
      .from("doctors")
      .select("id, user_id, specialty")
      .eq("is_online", true)
      .eq("is_verified", true);

    if (!onlineDoctors?.length) {
      const { data: allDoctors } = await supabase
        .from("doctors").select("user_id").eq("is_verified", true).limit(5);
      for (const doc of allDoctors || []) {
        const { data: profile } = await supabase
          .from("profiles").select("phone").eq("id", doc.user_id).single();
        if (profile?.phone) await notifyDoctor(profile.phone, `${waiting.length} paciente(s)`);
      }
      return jsonRes({ status: "ok", matched: 0, waiting: waiting.length, doctors_notified: true });
    }

    let matched = 0;
    for (const patient of waiting) {
      const doctor = onlineDoctors.find(d => d.specialty === patient.specialty) || onlineDoctors[0];
      if (!doctor) continue;
      const { data: profile } = await supabase
        .from("profiles").select("phone, full_name").eq("id", doctor.user_id).single();
      const { data: patientProfile } = await supabase
        .from("profiles").select("full_name").eq("id", patient.patient_id).single();
      if (profile?.phone) await notifyDoctor(profile.phone, patientProfile?.full_name || "Paciente");
      await supabase.from("notifications").insert({
        user_id: doctor.user_id,
        title: "Paciente na fila!",
        message: `${patientProfile?.full_name || "Paciente"} aguarda consulta. Aceite agora!`,
        type: "queue_match",
        action_url: `/painel-medico?queue=${patient.id}`,
      });
      matched++;
    }

    return jsonRes({ status: "ok", matched, waiting: waiting.length });
  } catch (err) {
    console.error("[QUEUE-MATCH]", err);
    return jsonRes({ status: "error", message: "Internal error" }, 500);
  }
});
