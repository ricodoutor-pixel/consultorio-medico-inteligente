// Sala de vídeo da consulta paga (paciente e médico na mesma sala).
// - Só participantes da consulta (paciente dono ou médico da consulta), com a consulta paga e em andamento.
// - Com JITSI_DOMAIN + JITSI_APP_ID + JITSI_APP_SECRET (Jitsi próprio na VPS), devolve token JWT por pessoa:
//   médico entra como moderador; paciente como participante. Sem esses segredos, usa o meet.jit.si público.
// - Não altera o status da consulta (quem marca "em andamento"/"concluída" são as telas da consulta).
import { createClient } from "npm:@supabase/supabase-js@2";
import { create as createJWT, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getCallerUserId } from "../_shared/admin-auth.ts";

const JITSI_DOMAIN = (Deno.env.get("JITSI_DOMAIN") || "").trim();
const JITSI_APP_ID = (Deno.env.get("JITSI_APP_ID") || "").trim();
const JITSI_APP_SECRET = (Deno.env.get("JITSI_APP_SECRET") || "").trim();
const SELF_HOSTED = Boolean(JITSI_DOMAIN && JITSI_APP_ID && JITSI_APP_SECRET);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const userId = await getCallerUserId(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const appointmentId = String(body?.appointmentId ?? body?.appointment_id ?? "");
  if (!UUID.test(appointmentId)) return json({ error: "appointmentId inválido" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: appt } = await svc
    .from("appointments")
    .select("id, patient_id, doctor_id, payment_status, status")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt) return json({ error: "Consulta não encontrada" }, 404);

  let role: "patient" | "doctor" | null = appt.patient_id === userId ? "patient" : null;
  let displayName = "Paciente";
  if (!role && appt.doctor_id) {
    const { data: doc } = await svc.from("doctors").select("user_id").eq("id", appt.doctor_id).maybeSingle();
    if (doc?.user_id === userId) {
      role = "doctor";
      const { data: prof } = await svc.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      displayName = prof?.full_name || "Médico(a)";
    }
  }
  if (!role) return json({ error: "Esta consulta não pertence a você" }, 403);
  if (appt.payment_status !== "paid" || appt.status !== "in_progress") {
    return json({ error: "A sala abre quando a consulta paga estiver em andamento" }, 409);
  }

  const roomName = `plantayraiz-consultorio-${appt.id}`;
  if (!SELF_HOSTED) return json({ ok: true, domain: "meet.jit.si", roomName, jwt: null, selfHosted: false });

  const jwt = await createJWT(
    { alg: "HS256", typ: "JWT" },
    {
      iss: JITSI_APP_ID,
      aud: "jitsi",
      sub: "*",
      room: roomName,
      nbf: getNumericDate(-60),
      exp: getNumericDate(60 * 60 * 2),
      context: {
        user: { id: userId, name: displayName, moderator: role === "doctor" },
        features: { recording: false, livestreaming: false, "screen-sharing": true },
      },
      moderator: role === "doctor",
    },
    await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(JITSI_APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
    ),
  );
  return json({ ok: true, domain: JITSI_DOMAIN, roomName, jwt, selfHosted: true });
});
