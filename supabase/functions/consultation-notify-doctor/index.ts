// consultation-notify-doctor — avisa o profissional de plantão (e-mail + WhatsApp)
// sobre um novo atendimento contratado pelo paciente.
// Segurança: exige JWT do paciente dono do agendamento (ou service_role).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendWhatsApp } from "../_shared/evolution.ts";

const SITE = "https://www.plantayraiz.com.br";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fmtBRL(value: unknown): string {
  const n = Number(value ?? 0);
  return n > 0 ? `R$ ${n.toFixed(2).replace(".", ",")}` : "—";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "A confirmar";
  try {
    return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  } catch {
    return iso;
  }
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

  let payload: { appointmentId?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const appointmentId = (payload.appointmentId || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(appointmentId)) return json({ error: "invalid_appointment" }, 400);

  const { data: appt } = await admin
    .from("appointments")
    .select("id, patient_id, doctor_id, scheduled_at, type, amount, status, payment_status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appt) return json({ error: "appointment_not_found" }, 404);
  if (!isService && appt.patient_id !== callerId) return json({ error: "forbidden" }, 403);

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

  const { data: patientProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", appt.patient_id)
    .maybeSingle();

  const doctorName = docProfile?.full_name || `CRM ${doctor.crm}/${doctor.crm_state}`;
  const patientName = patientProfile?.full_name || "Paciente da plataforma";
  const when = fmtDate(appt.scheduled_at as string | null);
  const modality = String(appt.type || "video");
  const amount = fmtBRL(appt.amount);

  // --- WhatsApp ---
  let whatsapp: { ok: boolean; error?: string } = { ok: false, error: "sem telefone cadastrado" };
  if (docProfile?.phone) {
    const message =
      `🌱 *Planta y Raiz — novo atendimento*\n\n` +
      `*Paciente:* ${patientName}\n` +
      `*Data:* ${when}\n` +
      `*Modalidade:* ${modality}\n` +
      `*Valor:* ${amount}\n\n` +
      `O paciente passa pela triagem da Enfª Brisa e segue para o seu consultório virtual.\n` +
      `Acesse: ${SITE}/consultorio`;
    whatsapp = await sendWhatsApp(docProfile.phone, message);
  }

  // --- E-mail ---
  let email: { ok: boolean; error?: string } = { ok: false };
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(doctor.user_id);
    const to = authUser?.user?.email;
    if (!to) {
      email = { ok: false, error: "sem e-mail cadastrado" };
    } else {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateName: "nova-consulta-medico",
          recipientEmail: to,
          templateData: {
            doctorName,
            patientName,
            scheduledAt: when,
            modality,
            amount,
            consultorioUrl: `${SITE}/consultorio`,
          },
        }),
      });
      email = res.ok
        ? { ok: true }
        : { ok: false, error: (await res.text().catch(() => "")).slice(0, 300) };
    }
  } catch (e) {
    email = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  await admin.from("notifications").insert({
    user_id: doctor.user_id,
    title: "Novo atendimento direcionado a você",
    message: `${patientName} · ${when} · ${modality} · ${amount}`,
    type: "appointment",
    action_url: "/consultorio",
  }).select("id").maybeSingle();

  return json({ ok: true, doctor: doctorName, whatsapp, email });
});
