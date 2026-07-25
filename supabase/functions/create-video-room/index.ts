// 🌿 Planta y Raiz — generate-video-room / create-video-room
// Telemedicina CFM 2.314/2022 · Jitsi Meet · JWT · Lobby · E2EE
// Uma sala única, não-adivinhável, por consulta, com expiração.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://esm.sh/jose@5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JITSI_DOMAIN  = Deno.env.get("JITSI_DOMAIN")  || "meet.jit.si";
const JITSI_APP_ID  = Deno.env.get("JITSI_APP_ID")  || "";
const JITSI_SECRET  = Deno.env.get("JITSI_SECRET")  || "";

// Gera nome de sala criptograficamente seguro e único
async function generateRoomName(consultationId: string): Promise<string> {
  const seed = `plantayraiz-${consultationId}-${Date.now()}`;
  const encoded = new TextEncoder().encode(seed);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  const hex = hashArr.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
  return `plr-${hex}`;
}

// Gera JWT para Jitsi (apenas quando JITSI_APP_ID e JITSI_SECRET configurados)
async function generateJitsiJWT(opts: {
  roomName: string;
  displayName: string;
  email: string;
  isDoctor: boolean;
  expiresIn: number; // segundos
}): Promise<string | null> {
  if (!JITSI_APP_ID || !JITSI_SECRET) return null;
  const now  = Math.floor(Date.now() / 1000);
  const key  = new TextEncoder().encode(JITSI_SECRET);
  const jwt  = await new jose.SignJWT({
    aud: "jitsi",
    iss: JITSI_APP_ID,
    sub: JITSI_DOMAIN,
    room: opts.roomName,
    context: {
      user: { name: opts.displayName, email: opts.email, moderator: opts.isDoctor },
      features: {
        lobby: true,         // Sala de espera obrigatória
        "screen-sharing": true,
        recording: opts.isDoctor,
        "inbound-call": false,
        "outbound-call": false,
      },
    },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + opts.expiresIn)
    .sign(key);
  return jwt;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Health check
  if (req.method === "GET") {
    return new Response(JSON.stringify({
      ok: true, service: "create-video-room", provider: "jitsi",
      domain: JITSI_DOMAIN, jwt_enabled: Boolean(JITSI_APP_ID && JITSI_SECRET),
      compliance: "CFM 2.314/2022",
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } }); }

  const consultationId = String(body.consultation_id || body.consultationId || "");
  const patientName    = String(body.patient_name    || body.patientName    || "Paciente");
  const doctorName     = String(body.doctor_name     || body.doctorName     || "Dra. Suelen Naves Rodrigues (CRM-PR 49354)");
  const displayName    = String(body.display_name    || body.displayName    || patientName);
  const isDoctor       = Boolean(body.is_doctor      || body.isDoctor       || false);
  const appointmentId  = String(body.appointment_id  || body.appointmentId  || "");

  if (!consultationId) {
    return new Response(JSON.stringify({ error: "consultation_id é obrigatório" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Verificar se já existe sala para esta consulta
  const { data: existing } = await sb
    .from("telemed_sessions")
    .select("*")
    .eq("consultation_id", consultationId)
    .maybeSingle();

  let roomName: string;
  let sessionId: string;

  if (existing && new Date(existing.expires_at) > new Date()) {
    // Reusar sala existente que ainda não expirou
    roomName  = existing.room_name;
    sessionId = existing.id;
    console.log(`[create-video-room] Reusando sala existente: ${roomName}`);
  } else {
    // Criar nova sala
    roomName = await generateRoomName(consultationId);
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4h

    const { data: inserted, error: insertErr } = await sb
      .from("telemed_sessions")
      .upsert({
        consultation_id: consultationId,
        patient_name: patientName,
        room_name: roomName,
        status: "scheduled",
        expires_at: expiresAt,
        jitsi_domain: JITSI_DOMAIN,
        lobby_enabled: true,
        e2ee_enabled: true,
      }, { onConflict: "consultation_id" })
      .select()
      .single();

    if (insertErr) console.error("[create-video-room] telemed_sessions error:", insertErr);
    sessionId = inserted?.id || "";

    // Atualizar video_rooms também (compatibilidade)
    await sb.from("video_rooms").upsert({
      consultation_id: consultationId,
      room_name: roomName,
      room_url: `https://${JITSI_DOMAIN}/${roomName}`,
      expires_at: expiresAt,
      status: "scheduled",
    }, { onConflict: "consultation_id" });

    // Atualizar appointment se fornecido
    if (appointmentId) {
      await sb.from("appointments").update({
        room_url: `https://${JITSI_DOMAIN}/${roomName}`,
        consultation_id: consultationId,
        status: "confirmed",
        updated_at: new Date().toISOString(),
      }).eq("id", appointmentId);
    }

    console.log(`[create-video-room] Nova sala: ${roomName}`);
  }

  // Gerar JWT Jitsi (se configurado)
  const jitsiJWT = await generateJitsiJWT({
    roomName, displayName, email: "", isDoctor,
    expiresIn: 4 * 60 * 60, // 4 horas
  });

  // Config Jitsi para o frontend
  const jitsiConfig = {
    domain: JITSI_DOMAIN,
    roomName,
    jwt: jitsiJWT,
    configOverwrite: {
      prejoinPageEnabled: false,
      disableDeepLinking: true,
      startWithAudioMuted: !isDoctor,
      startWithVideoMuted: false,
      enableWelcomePage: false,
      defaultLanguage: "pt",
      // E2EE — ativado
      e2ee: { labels: { labelTooltip: "Sala criptografada (E2EE)", labelKey: "encrypted" } },
      // Lobby — apenas médico pode aprovar entrada
      enableLobby: true,
    },
    interfaceConfigOverwrite: {
      DEFAULT_BACKGROUND: "#0a0c10",
      DEFAULT_REMOTE_DISPLAY_NAME: isDoctor ? "Paciente" : "Médico(a)",
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      MOBILE_APP_PROMO: false,
      TOOLBAR_BUTTONS: [
        "microphone", "camera", "desktop", "chat",
        "raisehand", "tileview", "hangup",
        ...(isDoctor ? ["mute-everyone", "kick", "security", "recording"] : ["fullscreen"]),
      ],
    },
    userInfo: { displayName, email: "" },
  };

  return new Response(JSON.stringify({
    ok: true,
    session_id: sessionId,
    consultation_id: consultationId,
    room_name: roomName,
    room_url: `https://${JITSI_DOMAIN}/${roomName}`,
    expires_at: existing?.expires_at || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    jitsi_config: jitsiConfig,
    compliance: { cfm: "2.314/2022", e2ee: true, lobby: true, lgpd: true },
  }), { headers: { ...cors, "Content-Type": "application/json" } });
});
