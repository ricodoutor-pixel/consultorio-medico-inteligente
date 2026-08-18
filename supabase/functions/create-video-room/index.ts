// 🌿 Planta y Raiz — create-video-room (CORRIGIDO — restaura autenticação e compatibilidade)
// Cria (ou reaproveita, de forma idempotente) a sala de telemedicina de uma consulta.
// Exige autenticacao do medico responsavel e emite um JWT real (Jitsi).
// Compatível com: src/pages/OrientacaoVideo.tsx e src/pages/WorkspaceMedico.tsx
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create as createJWT, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JITSI_APP_ID = Deno.env.get("JITSI_APP_ID") || "";
const JITSI_APP_SECRET = Deno.env.get("JITSI_APP_SECRET") || "";
const JITSI_DOMAIN = Deno.env.get("JITSI_DOMAIN") ?? "meet.jit.si";
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://plantayraiz.com.br";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (req.method === "GET") {
    return new Response(JSON.stringify({
      ok: true, service: "create-video-room", version: "2026.08-fixed",
      jwt_enabled: Boolean(JITSI_APP_ID && JITSI_APP_SECRET),
      domain: JITSI_DOMAIN,
      auth_required: true,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    // 1. Exige medico autenticado — NUNCA aceitar is_doctor vindo do corpo da requisicao
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: authError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Nao autenticado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 2. Confirma que e um medico verificado
    const { data: doctor, error: doctorError } = await admin
      .from("doctors")
      .select("user_id, is_verified")
      .eq("user_id", user.id)
      .maybeSingle();

    if (doctorError || !doctor || !doctor.is_verified) {
      return new Response(
        JSON.stringify({ ok: false, error: "Apenas medicos verificados podem criar salas" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const appointmentId = String(body.appointmentId || body.appointment_id || "");
    if (!appointmentId) {
      return new Response(JSON.stringify({ ok: false, error: "appointmentId e obrigatorio" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 3. Confirma que a consulta pertence a este medico
    const { data: appointment, error: apptError } = await admin
      .from("appointments")
      .select("id, doctor_id, patient_id, consultation_id, scheduled_at, status")
      .eq("id", appointmentId)
      .maybeSingle();

    if (apptError || !appointment) {
      return new Response(JSON.stringify({ ok: false, error: "Consulta nao encontrada" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (appointment.doctor_id !== user.id) {
      return new Response(
        JSON.stringify({ ok: false, error: "Esta consulta nao pertence a este medico" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const consultationId = appointment.consultation_id ?? crypto.randomUUID();

    // 3b. IDEMPOTENCIA: reaproveita sala existente e nao expirada
    const { data: existingRoom } = await admin
      .from("video_rooms")
      .select("id, room_name, room_url, expires_at, secure_token, status")
      .eq("consultation_id", consultationId)
      .maybeSingle();

    const now = new Date();
    const existingIsValid = existingRoom
      && existingRoom.status !== "ended"
      && existingRoom.expires_at
      && new Date(existingRoom.expires_at) > now;

    let roomName: string;
    let roomUrl: string;
    let patientAccessToken: string;
    let expiresAt: string;

    if (existingIsValid) {
      roomName = existingRoom.room_name;
      roomUrl = existingRoom.room_url;
      expiresAt = existingRoom.expires_at;
      patientAccessToken = randomHex(24);
      const secureTokenHash = await sha256Hex(patientAccessToken);
      await admin.from("video_rooms").update({ secure_token: secureTokenHash }).eq("id", existingRoom.id);
    } else {
      roomName = `pyr-${consultationId}-${randomHex(4)}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      roomUrl = `https://${JITSI_DOMAIN}/${roomName}`;

      const scheduledAt = appointment.scheduled_at ? new Date(appointment.scheduled_at) : new Date();
      expiresAt = new Date(scheduledAt.getTime() + 4 * 60 * 60 * 1000).toISOString();

      patientAccessToken = randomHex(24);
      const secureTokenHash = await sha256Hex(patientAccessToken);

      const { error: upsertError } = await admin
        .from("video_rooms")
        .upsert({
          consultation_id: consultationId,
          room_name: roomName,
          room_url: roomUrl,
          doctor_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          status: "scheduled",
          expires_at: expiresAt,
          secure_token: secureTokenHash,
        }, { onConflict: "consultation_id" });

      if (upsertError) {
        console.error("[create-video-room] DB error:", upsertError);
        return new Response(JSON.stringify({ ok: false, error: "Erro ao salvar a sala" }), {
          status: 500, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    await admin.from("appointments").update({
      room_url: roomUrl,
      consultation_id: consultationId,
      status: "confirmed",
      updated_at: new Date().toISOString(),
    }).eq("id", appointment.id);

    // 4. JWT real do medico (moderador)
    let doctorJwt: string | null = null;
    if (JITSI_APP_ID && JITSI_APP_SECRET) {
      doctorJwt = await createJWT(
        { alg: "HS256", typ: "JWT" },
        {
          iss: JITSI_APP_ID,
          aud: "jitsi",
          sub: JITSI_APP_ID,
          room: roomName,
          exp: getNumericDate(60 * 60 * 4),
          context: {
            user: { name: String(user.user_metadata?.full_name ?? "Medico(a)"), moderator: "true" },
            features: { "lobby-bypass": true, "screen-sharing": true, recording: false },
          },
        },
        JITSI_APP_SECRET,
      );
    }

    console.log(`[create-video-room] Sala ${existingIsValid ? "reaproveitada" : "criada"}: ${roomName} (medico ${user.id})`);

    return new Response(JSON.stringify({
      ok: true,
      roomName,
      roomUrl,
      domain: JITSI_DOMAIN,
      consultationId,
      expiresAt,
      doctorJwt,
      reused: Boolean(existingIsValid),
      patientAccessLink: `${PUBLIC_SITE_URL}/orientacao-video?consultation=${consultationId}&token=${patientAccessToken}`,
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[create-video-room] Error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
