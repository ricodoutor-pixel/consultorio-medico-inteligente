// consultation-notify-doctor — avisa o profissional escolhido (WhatsApp + e-mail Hostinger)
// no instante em que o pagamento é reconhecido, SEM nome do paciente e SEM dado de saúde.
// Registra horário, canal, status (aceito, entregue, falhou) e tentativas em payment_notify_log / payment_notify_attempts.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  buildDoctorConsultationMessage,
  cleanDoctorDisplayName,
  notifyRecipientEmailOnce,
  notifyRecipientOnce,
} from "../_shared/payment-notify.ts";

const SITE = "https://www.plantayraiz.com.br";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const admin = createClient(supabaseUrl, serviceKey);

  let callerId: string | null = null;
  const isService = token === serviceKey;
  if (!isService) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    callerId = userData.user.id;
  }

  let payload: { appointmentId?: string; test_mode?: boolean } = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const appointmentId = (payload.appointmentId || "").trim();
  const testMode = Boolean(payload.test_mode);
  if (!/^[0-9a-f-]{36}$/i.test(appointmentId)) return json({ error: "invalid_appointment" }, 400);

  const { data: appt } = await admin
    .from("appointments")
    .select("id, patient_id, doctor_id, scheduled_at, type, amount, status, payment_status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appt) return json({ error: "appointment_not_found" }, 404);
  if (!isService && appt.patient_id !== callerId) return json({ error: "forbidden" }, 403);
  if (appt.payment_status !== "paid") return json({ error: "payment_not_confirmed" }, 402);

  const { data: doctor } = await admin
    .from("doctors")
    .select("id, user_id, crm, crm_state, specialty")
    .eq("id", appt.doctor_id)
    .maybeSingle();
  if (!doctor) return json({ error: "doctor_not_found" }, 404);

  const { data: docProfile } = await admin
    .from("profiles")
    .select("full_name, phone")
    .eq("id", doctor.user_id)
    .maybeSingle();

  const rawDoctorName = docProfile?.full_name || `CRM ${doctor.crm}/${doctor.crm_state}`;
  const cleanName = cleanDoctorDisplayName(rawDoctorName);
  const doctorRoomUrl = `${SITE}/consultorio?appointment=${appt.id}`;
  const alertMessage = buildDoctorConsultationMessage({ doctorName: cleanName });

  // 1. WhatsApp (registrado em payment_notify_log + payment_notify_attempts, sem nome do paciente nem dado de saúde)
  let whatsappSent = false;
  if (docProfile?.phone) {
    whatsappSent = await notifyRecipientOnce(admin, {
      key: `appointment:${appt.id}:doctor:${doctor.id}:whatsapp`,
      phone: String(docProfile.phone),
      service: "Aviso ao médico (WhatsApp) — consulta paga",
      text: alertMessage,
      simulateOnly: testMode,
    });
  }

  // 2. E-mail Hostinger (registrado em payment_notify_log + payment_notify_attempts, sem nome do paciente nem dado de saúde)
  let emailSent = false;
  let doctorEmail = "";
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(doctor.user_id);
    doctorEmail = authUser?.user?.email || "";
  } catch {
    doctorEmail = "";
  }
  if (doctorEmail) {
    emailSent = await notifyRecipientEmailOnce(admin, {
      key: `appointment:${appt.id}:doctor:${doctor.id}:email`,
      email: doctorEmail,
      doctorName: cleanName,
      service: "Aviso ao médico (E-mail Hostinger) — consulta paga",
      consultorioUrl: doctorRoomUrl,
      simulateOnly: testMode,
    });
  }

  // 3. Notificação no painel interno (sem dados de saúde)
  // Uma única notificação por consulta, mesmo se a página do paciente for reaberta.
  const actionUrl = `/consultorio?appointment=${appt.id}`;
  const { data: existingNotice } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", doctor.user_id)
    .eq("action_url", actionUrl)
    .eq("title", "Consulta agora na Planta y Raiz")
    .limit(1);
  if (!testMode && !(existingNotice && existingNotice.length)) {
    await admin.from("notifications").insert([
      {
        user_id: doctor.user_id,
        title: "Consulta agora na Planta y Raiz",
        message: alertMessage,
        type: "appointment",
        action_url: actionUrl,
      },
    ]);
  }

  // 4. Garante que o convite com contador de 5 minutos (janela da triagem) está ativo
  try {
    await admin.functions.invoke("consultation-offer", {
      body: { action: "dispatch", appointment_id: appt.id, test_mode: testMode },
    });
  } catch {
    /* idempotente */
  }

  return json({
    ok: true,
    doctor: `Dr(a). ${cleanName}`,
    message: alertMessage,
    whatsapp: { ok: whatsappSent },
    email: { ok: emailSent },
    simulated: testMode,
  });
});

