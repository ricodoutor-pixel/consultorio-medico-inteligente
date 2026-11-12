/**
 * "Avise-me quando ficar livre" — cron a cada minuto.
 * Para cada pedido em espera: se o médico voltou a ficar disponível (botão ON, batimento recente e sem
 * consulta em andamento), manda um único WhatsApp ao paciente; pedidos com mais de 3 h expiram sem aviso.
 * Aceita apenas o cron (x-cron-secret / LOVABLE_CRON_SECRET), service-role ou administrador.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { getCallerUserId, isAdmin } from "../_shared/admin-auth.ts";
import { notifyRecipientOnce } from "../_shared/payment-notify.ts";
import { evaluateDoctorPresence } from "../_shared/consultation-queue.ts";
import { freeAlertExpired, freeAlertKey, freeAlertText } from "../_shared/doctor-free-alerts.ts";

const SITE = "https://plantayraiz.com.br";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

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
  const { data: alerts, error } = await sb
    .from("doctor_free_alerts")
    .select("id, patient_id, doctor_id, created_at")
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) return json({ ok: false, error: error.message }, 500);

  let expired = 0;
  let sent = 0;
  const presenceByDoctor = new Map<string, { free: boolean; name: string | null }>();

  for (const a of alerts ?? []) {
    if (freeAlertExpired(a.created_at, now)) {
      await sb.from("doctor_free_alerts").update({ status: "expired" }).eq("id", a.id).eq("status", "waiting");
      expired++;
      continue;
    }
    if (!presenceByDoctor.has(a.doctor_id)) {
      const [{ data: doc }, { count: live }] = await Promise.all([
        sb.from("doctors").select("user_id, is_online, is_available, last_seen_online").eq("id", a.doctor_id).maybeSingle(),
        sb
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("doctor_id", a.doctor_id)
          .eq("status", "in_progress")
          .eq("payment_status", "paid")
          .gt("updated_at", new Date(now.getTime() - 3 * 3_600_000).toISOString()),
      ]);
      const presence = doc
        ? evaluateDoctorPresence({ ...doc, in_consultation: (live ?? 0) > 0 }, now.getTime())
        : { canReceiveOffers: false };
      const { data: prof } = doc?.user_id
        ? await sb.from("profiles").select("full_name").eq("id", doc.user_id).maybeSingle()
        : { data: null };
      presenceByDoctor.set(a.doctor_id, { free: presence.canReceiveOffers, name: prof?.full_name ?? null });
    }
    const doctor = presenceByDoctor.get(a.doctor_id)!;
    if (!doctor.free) continue;

    const { data: patient } = await sb.from("profiles").select("phone").eq("id", a.patient_id).maybeSingle();
    const phone = String(patient?.phone ?? "");
    if (phone.replace(/\D/g, "").length >= 10) {
      const ok = await notifyRecipientOnce(sb, {
        key: freeAlertKey(a.id),
        phone,
        text: freeAlertText(`${SITE}/profissionais/${a.doctor_id}`, doctor.name),
        service: "consulta_paciente",
      });
      if (ok) sent++;
    }
    await sb
      .from("doctor_free_alerts")
      .update({ status: "notified", notified_at: now.toISOString() })
      .eq("id", a.id)
      .eq("status", "waiting");
  }

  return json({ ok: true, checked: alerts?.length ?? 0, sent, expired });
});
