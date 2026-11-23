/**
 * Escriba de IA do médico (Kit do Assinante).
 * - action=transcribe (multipart: file = trecho de áudio de até 10 MB): devolve o texto. O áudio não é guardado.
 * - action=soap (JSON: transcript, appointmentId?, mode?): rascunho SOAP + pontos de atenção ao médico.
 *   Com appointmentId (médico da consulta), guarda transcrição, SOAP e pontos em consultation_transcripts.
 *   Gravar a consulta inteira exige a autorização prévia do paciente (consultation_scribe_consents).
 * - action=consent (JSON: appointmentId): decisão do paciente e transcrição já guardada, se houver.
 * - action=status: limite e uso do dia.
 * Só médicos (ou admin). Cada trecho transcrito e cada SOAP contam no limite diário ("escriba").
 */
import { generateChatCompletion, GatewayError, transcribeAudio } from "npm:@lovable.dev/ai-gateway@0.1.11";
import type {} from "../_shared/generated/ai-gateway/models.d.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { doctorKitAccess, recordDoctorAiUsage, serviceClient } from "../_shared/doctor-kit-access.ts";
import { parseScribeOutput, SCRIBE_PROMPT } from "../_shared/scribe-output.ts";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_TRANSCRIPT_CHARS = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Confirma que quem chama é o médico desta consulta. */
async function isAppointmentDoctor(appointmentId: string, userId: string): Promise<boolean> {
  const svc = serviceClient();
  const { data: appt } = await svc.from("appointments").select("doctor_id").eq("id", appointmentId).maybeSingle();
  if (!appt?.doctor_id) return false;
  const { data: doc } = await svc.from("doctors").select("user_id").eq("id", appt.doctor_id).maybeSingle();
  return doc?.user_id === userId;
}

async function readConsent(appointmentId: string) {
  const { data } = await serviceClient()
    .from("consultation_scribe_consents")
    .select("accepted, decided_at")
    .eq("appointment_id", appointmentId)
    .maybeSingle();
  return data ? { consent: data.accepted ? "accepted" : "declined", decidedAt: data.decided_at as string } : { consent: "pending", decidedAt: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const access = await doctorKitAccess(req, "escriba");
  if (!access) return json({ error: "Faça login para usar o escriba." }, 401);
  if (!access.doctor && !access.admin) return json({ error: "Ferramenta exclusiva para médicos cadastrados." }, 403);
  const status = { limit: access.limit, used: access.used, remaining: Math.max(access.limit - access.used, 0), paid: access.paid };

  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");
  let action = "";
  let form: FormData | null = null;
  let body: Record<string, unknown> = {};
  try {
    if (isMultipart) {
      form = await req.formData();
      action = String(form.get("action") ?? "");
    } else {
      body = await req.json().catch(() => ({}));
      action = String(body.action ?? "");
    }
  } catch {
    return json({ error: "Envio inválido.", ...status }, 400);
  }

  if (action === "status") return json(status);

  // Consulta vinculada: só o médico da própria consulta lê a autorização ou guarda a transcrição.
  const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : "";
  if (appointmentId && !UUID.test(appointmentId)) return json({ error: "Consulta inválida.", ...status }, 400);
  const linked = appointmentId ? await isAppointmentDoctor(appointmentId, access.userId) : false;
  if (appointmentId && !linked) return json({ error: "Esta consulta não é sua.", ...status }, 403);

  if (action === "consent") {
    if (!appointmentId) return json({ error: "Consulta não informada.", ...status }, 400);
    const { data: saved } = await serviceClient()
      .from("consultation_transcripts")
      .select("mode, transcript, soap, attention_points, updated_at")
      .eq("appointment_id", appointmentId)
      .maybeSingle();
    return json({ ...(await readConsent(appointmentId)), saved: saved ?? null, ...status });
  }

  if (status.remaining <= 0) {
    return json({ error: "Limite diário do escriba atingido. Renova à meia-noite (horário de Brasília).", ...status }, 429);
  }

  try {
    if (action === "transcribe") {
      const file = form?.get("file");
      if (!(file instanceof Blob) || file.size === 0) return json({ error: "Áudio não recebido.", ...status }, 400);
      if (file.size > MAX_AUDIO_BYTES) return json({ error: "Trecho de áudio grande demais (máx. 10 MB).", ...status }, 413);
      if (file.type && !file.type.startsWith("audio/") && !file.type.startsWith("video/webm")) {
        return json({ error: "Formato de áudio não suportado.", ...status }, 415);
      }
      const res = await transcribeAudio({
        model: "google/gemini-3.5-transcribe",
        file,
        language: "pt",
        response_format: "json",
      });
      const text = (typeof res === "string" ? res : (res as { text?: string })?.text ?? "").trim();
      await recordDoctorAiUsage(access.userId, "escriba", "transcribe", "");
      const used = access.used + 1;
      return json({ text, limit: access.limit, used, remaining: Math.max(access.limit - used, 0), paid: access.paid });
    }

    if (action === "soap") {
      const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
      if (transcript.length < 20) return json({ error: "Transcrição curta demais para gerar o SOAP.", ...status }, 400);
      const mode = body.mode === "consulta" ? "consulta" : "ditado";
      let consentDecidedAt: string | null = null;
      if (linked && mode === "consulta") {
        const consent = await readConsent(appointmentId);
        if (consent.consent !== "accepted") {
          return json({ error: "O paciente não autorizou a gravação desta consulta.", ...status }, 409);
        }
        consentDecidedAt = consent.decidedAt;
      }
      const res = await generateChatCompletion({
        model: "google/gemini-3.8-flash",
        temperature: 0.1,
        messages: [
          { role: "system", content: SCRIBE_PROMPT },
          { role: "user", content: transcript.slice(0, MAX_TRANSCRIPT_CHARS) },
        ],
      });
      const { soap, attentionPoints } = parseScribeOutput(res.choices?.[0]?.message?.content ?? "");
      if (!soap) return json({ error: "O escriba não respondeu agora. Tente de novo.", ...status }, 502);
      let stored = false;
      if (linked) {
        const { error: saveErr } = await serviceClient().from("consultation_transcripts").upsert({
          appointment_id: appointmentId,
          doctor_user_id: access.userId,
          mode,
          transcript: transcript.slice(0, MAX_TRANSCRIPT_CHARS),
          soap,
          attention_points: attentionPoints,
          consent_decided_at: consentDecidedAt,
          updated_at: new Date().toISOString(),
        });
        if (saveErr) console.error("[doctor-scribe] save transcript", saveErr.code);
        stored = !saveErr;
      }
      // Uso registra só a ação, nunca dados do paciente.
      await recordDoctorAiUsage(access.userId, "escriba", "soap", "");
      const used = access.used + 1;
      return json({ soap, attentionPoints, stored, limit: access.limit, used, remaining: Math.max(access.limit - used, 0), paid: access.paid });
    }

    return json({ error: "Ação inválida.", ...status }, 400);
  } catch (err) {
    if (err instanceof GatewayError) console.error("[doctor-scribe]", err.code, err.httpStatus);
    else console.error("[doctor-scribe]", (err as Error)?.message);
    return json({ error: "Não foi possível processar agora. Tente de novo.", ...status }, 500);
  }
});
