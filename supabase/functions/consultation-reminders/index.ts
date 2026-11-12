/**
 * Lembretes automáticos das consultas por WhatsApp (cron a cada 10 minutos).
 * 24 h e 1 h antes das consultas agendadas e pagas; convite de retorno 30 dias após a consulta concluída.
 * Cada aviso sai uma única vez (notifyRecipientOnce, chave por consulta e tipo).
 * Aceita apenas o cron (x-cron-secret / LOVABLE_CRON_SECRET), service-role ou administrador.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { getCallerUserId, isAdmin } from "../_shared/admin-auth.ts";
import { notifyRecipientOnce } from "../_shared/payment-notify.ts";
import { resolveConsultationSku } from "../_shared/payment-catalog.ts";
import {
  brasiliaParts,
  dailyAgendaDue,
  dailyAgendaKey,
  dailyAgendaText,
  reminderKey,
  reminderText,
  returnReminderDue,
  scheduledReminderDue,
  type ReminderKind,
  waitlistKey,
  waitlistText,
} from "../_shared/consultation-reminders.ts";

const SITE = "https://www.plantayraiz.com.br";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

interface Appt {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  type: string;
  status: string;
  scheduled_at: string;
  updated_at: string;
  notes: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ceoSecret = Deno.env.get("BRISA_CEO_SECRET_KEY");
  let allowed =
    (Boolean(serviceKey) && bearer === serviceKey) ||
    (Boolean(ceoSecret) && req.headers.get("x-cron-secret") === ceoSecret);
  if (!allowed && Deno.env.get("LOVABLE_CRON_SECRET")) allowed = authenticateCronRequest(req) === null;
  if (!allowed) {
    const caller = await getCallerUserId(req);
    allowed = Boolean(caller && (await isAdmin(caller)));
  }
  if (!allowed) return json({ error: "Unauthorized" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const now = new Date();
  const errors: string[] = [];
  const due: { appt: Appt; kind: ReminderKind }[] = [];

  // Consultas agendadas e pagas nas próximas 24 h (fora da sala de espera, que tem avisos próprios).
  const { data: upcoming, error: upErr } = await sb
    .from("appointments")
    .select("id, patient_id, doctor_id, type, status, scheduled_at, updated_at, notes")
    .eq("payment_status", "paid")
    .in("status", ["scheduled", "confirmed"])
    .gt("scheduled_at", now.toISOString())
    .lte("scheduled_at", new Date(now.getTime() + 24 * 3_600_000).toISOString())
    .limit(200);
  if (upErr) errors.push(`upcoming: ${upErr.message}`);
  for (const a of (upcoming ?? []) as Appt[]) {
    if ((a.notes ?? "").includes("[FILA_REAGENDADA")) continue;
    const kind = scheduledReminderDue(a.scheduled_at, now);
    if (kind) due.push({ appt: a, kind });
  }

  // Retorno: consultas concluídas há 30 dias (updated_at marca a conclusão).
  const { data: done, error: doneErr } = await sb
    .from("appointments")
    .select("id, patient_id, doctor_id, type, status, scheduled_at, updated_at, notes")
    .eq("payment_status", "paid")
    .eq("status", "completed")
    .gte("updated_at", new Date(now.getTime() - 31 * 24 * 3_600_000).toISOString())
    .lte("updated_at", new Date(now.getTime() - 30 * 24 * 3_600_000).toISOString())
    .limit(200);
  if (doneErr) errors.push(`returns: ${doneErr.message}`);
  for (const a of (done ?? []) as Appt[]) {
    if (returnReminderDue(a.updated_at, now)) due.push({ appt: a, kind: "retorno30d" });
  }

  let sent = 0;
  let skipped = 0;
  for (const { appt, kind } of due) {
    const [{ data: profile }, { data: doctor }] = await Promise.all([
      sb.from("profiles").select("phone").eq("id", appt.patient_id).maybeSingle(),
      appt.doctor_id ? sb.from("doctors").select("user_id").eq("id", appt.doctor_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const phone = String(profile?.phone ?? "");
    if (phone.replace(/\D/g, "").length < 10) {
      skipped++;
      continue;
    }
    const { data: docProfile } = doctor?.user_id
      ? await sb.from("profiles").select("full_name").eq("id", doctor.user_id).maybeSingle()
      : { data: null };
    const sku = resolveConsultationSku(appt.type) ?? "consulta_video";
    const link =
      kind === "retorno30d"
        ? `${SITE}/consulta/retorno_consulta${appt.doctor_id ? `?doctor=${appt.doctor_id}` : ""}`
        : `${SITE}/consulta/${sku}?appt=${appt.id}`;
    const ok = await notifyRecipientOnce(sb, {
      key: reminderKey(appt.id, kind),
      phone,
      text: reminderText(kind, { whenIso: appt.scheduled_at, link, doctorName: docProfile?.full_name ?? null }),
      service: "consulta_paciente",
    });
    if (ok) sent++;
  }

  // Lista de espera: avisa uma vez quando a agenda real do médico tem horário livre (este mês ou o próximo).
  const parts = brasiliaParts(now);
  let waitlistSent = 0;
  const { data: waiting, error: waitErr } = await sb
    .from("consultation_waitlist")
    .select("id, patient_id, doctor_id, modality")
    .eq("status", "waiting")
    .gte("created_at", new Date(now.getTime() - 60 * 24 * 3_600_000).toISOString())
    .order("created_at", { ascending: true })
    .limit(200);
  if (waitErr) errors.push(`waitlist: ${waitErr.message}`);
  const openByDoctor = new Map<string, boolean>();
  for (const w of (waiting ?? []) as { id: string; patient_id: string; doctor_id: string; modality: string }[]) {
    const cacheKey = `${w.doctor_id}:${w.modality}`;
    if (!openByDoctor.has(cacheKey)) {
      let open = false;
      for (const month of [parts.month, parts.nextMonth]) {
        const { data: days } = await sb.rpc("get_available_days", { p_doctor_id: w.doctor_id, p_month: month, p_modality: w.modality });
        if ((days ?? []).some((d: { has_available_slots?: boolean }) => d.has_available_slots)) {
          open = true;
          break;
        }
      }
      openByDoctor.set(cacheKey, open);
    }
    if (!openByDoctor.get(cacheKey)) continue;
    const [{ data: profile }, { data: doctor }] = await Promise.all([
      sb.from("profiles").select("phone").eq("id", w.patient_id).maybeSingle(),
      sb.from("doctors").select("user_id").eq("id", w.doctor_id).maybeSingle(),
    ]);
    const phone = String(profile?.phone ?? "");
    if (phone.replace(/\D/g, "").length < 10) continue;
    const { data: docProfile } = doctor?.user_id
      ? await sb.from("profiles").select("full_name").eq("id", doctor.user_id).maybeSingle()
      : { data: null };
    const ok = await notifyRecipientOnce(sb, {
      key: waitlistKey(w.id),
      phone,
      text: waitlistText(`${SITE}/agendamento?pro=${w.doctor_id}`, docProfile?.full_name ?? null),
      service: "consulta_paciente",
    });
    if (ok) waitlistSent++;
    await sb
      .from("consultation_waitlist")
      .update({ status: "notified", notified_at: now.toISOString() })
      .eq("id", w.id)
      .eq("status", "waiting");
  }

  // Resumo diário do médico às 7 h (Brasília): horários das consultas pagas de hoje, sem dados de pacientes.
  let agendaSent = 0;
  if (dailyAgendaDue(now)) {
    const dayStart = new Date(`${parts.date}T03:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000);
    const { data: today, error: todayErr } = await sb
      .from("appointments")
      .select("doctor_id, scheduled_at")
      .eq("payment_status", "paid")
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_at", dayStart.toISOString())
      .lt("scheduled_at", dayEnd.toISOString())
      .not("doctor_id", "is", null)
      .order("scheduled_at", { ascending: true })
      .limit(500);
    if (todayErr) errors.push(`agenda: ${todayErr.message}`);
    const byDoctor = new Map<string, string[]>();
    for (const a of (today ?? []) as { doctor_id: string; scheduled_at: string }[]) {
      const time = new Date(a.scheduled_at).toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });
      byDoctor.set(a.doctor_id, [...(byDoctor.get(a.doctor_id) ?? []), time]);
    }
    for (const [doctorId, times] of byDoctor) {
      const { data: doctor } = await sb.from("doctors").select("user_id").eq("id", doctorId).maybeSingle();
      if (!doctor?.user_id) continue;
      const { data: docProfile } = await sb.from("profiles").select("phone, full_name").eq("id", doctor.user_id).maybeSingle();
      const phone = String(docProfile?.phone ?? "");
      if (phone.replace(/\D/g, "").length < 10) continue;
      const ok = await notifyRecipientOnce(sb, {
        key: dailyAgendaKey(doctorId, parts.date),
        phone,
        text: dailyAgendaText(times, `${SITE}/consultorio`, docProfile?.full_name ?? null),
        service: "consulta_medico",
      });
      if (ok) agendaSent++;
    }
  }

  return json({
    ok: errors.length === 0,
    checked_at: now.toISOString(),
    due: due.length,
    sent,
    skipped,
    waitlist_sent: waitlistSent,
    agenda_sent: agendaSent,
    errors,
  });
});
