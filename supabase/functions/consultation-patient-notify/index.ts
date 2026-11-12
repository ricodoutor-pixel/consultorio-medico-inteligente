// Avisos de WhatsApp ao paciente durante a consulta paga (envio único por evento, via _shared/payment-notify.ts).
// Eventos:
//  - waiting_room: a consulta entrou na sala de espera (chamado pela fila, serviço).
//  - doctor_joined: o médico entrou na sala (chamado pelo Workspace do médico da consulta, ou serviço).
// O telefone vem do cadastro do paciente; o texto não contém dado de saúde.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { getCallerUserId } from "../_shared/admin-auth.ts";
import { notifyRecipientOnce } from "../_shared/payment-notify.ts";
import { resolveConsultationSku } from "../_shared/payment-catalog.ts";
import { isUrgentConsultation, patientNoticeText } from "../_shared/consultation-queue.ts";

const SITE = "https://www.plantayraiz.com.br";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const body = await req.json().catch(() => ({}));
  const appointmentId = String(body?.appointment_id ?? "");
  const event = String(body?.event ?? "");
  if (!UUID.test(appointmentId)) return json({ error: "appointment_id inválido" }, 400);
  if (event !== "waiting_room" && event !== "doctor_joined") return json({ error: "evento inválido" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: appt } = await svc
    .from("appointments")
    .select("id, patient_id, doctor_id, type, status, payment_status, notes")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt) return json({ error: "Consulta não encontrada" }, 404);

  const isService = requireServiceAuth(req, cors) === null;
  if (!isService) {
    // Fora do serviço, só o médico da consulta avisa que entrou.
    const callerId = await getCallerUserId(req);
    const { data: doc } = appt.doctor_id
      ? await svc.from("doctors").select("user_id").eq("id", appt.doctor_id).maybeSingle()
      : { data: null };
    if (event !== "doctor_joined" || !callerId || doc?.user_id !== callerId) return json({ error: "Unauthorized" }, 401);
  }
  if (appt.payment_status !== "paid") return json({ error: "Consulta não paga" }, 409);
  if (event === "doctor_joined" && appt.status !== "in_progress") return json({ error: "Consulta não está em andamento" }, 409);

  const { data: profile } = await svc.from("profiles").select("phone").eq("id", appt.patient_id).maybeSingle();
  const phone = String(profile?.phone ?? "");
  if (phone.replace(/\D/g, "").length < 10) return json({ ok: false, reason: "patient_phone_missing" });

  const sku = resolveConsultationSku(appt.type) ?? "consulta_video";
  const link = `${SITE}/consulta/${sku}?appt=${appt.id}`;
  const sent = await notifyRecipientOnce(svc, {
    key: `consulta:${appt.id}:paciente:${event}`,
    phone,
    text: patientNoticeText(event, link, isUrgentConsultation(appt.notes)),
    service: "consulta_paciente",
  });
  return json({ ok: true, sent });
});
