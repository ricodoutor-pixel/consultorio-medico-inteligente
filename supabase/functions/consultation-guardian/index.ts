/**
 * Guardião das consultas — cron a cada 5 minutos (migração 0032).
 * Confere o servidor de vídeo, consultas presas, pacientes pagos sem atendimento e repasses não liberados.
 * Corrige sozinho só o que é seguro (encerrar consulta esquecida aberta) e registra tudo em
 * consultation_guardian_events (um alerta por problema), avisando os administradores.
 * Aceita apenas o cron (x-cron-secret), service-role ou administrador verificado.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { getCallerUserId, isAdmin } from "../_shared/admin-auth.ts";
import {
  appendMarker,
  GUARDIAN_AUTO_CLOSE_MARKER,
  GUARDIAN_LIMITS,
  guardianDedupeKey,
  type GuardianEventKind,
  minutesAgoIso,
  shouldAutoClose,
} from "../_shared/consultation-guardian.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

interface NewEvent {
  kind: GuardianEventKind;
  severity: "info" | "warning" | "critical";
  appointment_id: string | null;
  message: string;
  auto_fixed: boolean;
  dedupe_key: string;
  details: Record<string, unknown>;
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
  const since = minutesAgoIso(now, GUARDIAN_LIMITS.lookbackDays * 24 * 60);
  const events: NewEvent[] = [];
  const errors: string[] = [];

  // 1. Servidor de vídeo próprio
  const jitsiDomain = Deno.env.get("JITSI_DOMAIN");
  if (jitsiDomain) {
    let status = 0;
    try {
      const r = await fetch(`https://${jitsiDomain}/`, { signal: AbortSignal.timeout(10_000) });
      status = r.status;
      await r.body?.cancel();
    } catch {
      status = 0;
    }
    if (status !== 200) {
      events.push({
        kind: "video_server_down",
        severity: "critical",
        appointment_id: null,
        message: `Servidor de vídeo ${jitsiDomain} não respondeu (HTTP ${status || "sem resposta"}). O vigia da VPS tenta reiniciar sozinho; se persistir, apague os segredos JITSI_* para voltar ao meet.jit.si.`,
        auto_fixed: false,
        dedupe_key: guardianDedupeKey("video_server_down", jitsiDomain, now),
        details: { status },
      });
    }
  }

  // 2. Consultas esquecidas "em andamento": encerra sozinho (o repasse continua dependendo da avaliação).
  const { data: stuck, error: stuckErr } = await sb
    .from("appointments")
    .select("id, notes, updated_at")
    .eq("status", "in_progress")
    .eq("payment_status", "paid")
    .lt("updated_at", minutesAgoIso(now, GUARDIAN_LIMITS.stuckInProgressMinutes))
    .gte("created_at", since)
    .limit(50);
  if (stuckErr) errors.push(`stuck: ${stuckErr.message}`);
  for (const a of stuck ?? []) {
    const { data: last } = await sb
      .from("consultation_chats")
      .select("created_at")
      .eq("appointment_id", a.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!shouldAutoClose(a.updated_at, (last as { created_at?: string } | null)?.created_at ?? null, now)) continue;
    const { error: upErr } = await sb
      .from("appointments")
      .update({ status: "completed", notes: appendMarker(a.notes, GUARDIAN_AUTO_CLOSE_MARKER) })
      .eq("id", a.id)
      .eq("status", "in_progress");
    if (upErr) {
      errors.push(`close ${a.id}: ${upErr.message}`);
      continue;
    }
    events.push({
      kind: "stuck_in_progress_closed",
      severity: "info",
      appointment_id: a.id,
      message: "Consulta ficou aberta mais de 3 horas sem conversa e foi encerrada automaticamente. O paciente ainda pode avaliar.",
      auto_fixed: true,
      dedupe_key: guardianDedupeKey("stuck_in_progress_closed", a.id, now),
      details: { started_at: a.updated_at },
    });
  }

  // 3. Pagou e passou do prazo da sala de espera sem ser atendido: precisa de contato humano.
  const { data: waiting, error: waitErr } = await sb
    .from("appointments")
    .select("id, status, created_at")
    .eq("payment_status", "paid")
    .in("status", ["pending", "confirmed", "scheduled"])
    .lt("created_at", minutesAgoIso(now, GUARDIAN_LIMITS.waitingTooLongMinutes))
    .gte("created_at", since)
    .limit(50);
  if (waitErr) errors.push(`waiting: ${waitErr.message}`);
  for (const a of waiting ?? []) {
    events.push({
      kind: "paid_waiting_too_long",
      severity: "critical",
      appointment_id: a.id,
      message: "Paciente pagou e não foi atendido dentro do prazo da sala de espera. Entre em contato (atendimento, remarcação ou reembolso).",
      auto_fixed: false,
      dedupe_key: guardianDedupeKey("paid_waiting_too_long", a.id, now),
      details: { status: a.status, paid_at: a.created_at },
    });
  }

  // 4. Avaliou e o repasse de 93% não foi liberado.
  const { data: ratings, error: rateErr } = await sb
    .from("consultation_ratings")
    .select("consultation_id, created_at")
    .lt("created_at", minutesAgoIso(now, GUARDIAN_LIMITS.payoutGraceMinutes))
    .gte("created_at", since)
    .limit(200);
  if (rateErr) errors.push(`ratings: ${rateErr.message}`);
  const ratedIds = [...new Set((ratings ?? []).map((r: { consultation_id: string }) => r.consultation_id))];
  if (ratedIds.length) {
    const [{ data: released }, { data: paidAppts }] = await Promise.all([
      sb.from("consultation_credit_audit").select("consultation_id").in("consultation_id", ratedIds).eq("payout_status", "released"),
      sb.from("appointments").select("id").in("id", ratedIds).eq("payment_status", "paid").gt("amount", 0),
    ]);
    const releasedSet = new Set((released ?? []).map((r: { consultation_id: string }) => r.consultation_id));
    for (const a of paidAppts ?? []) {
      if (releasedSet.has(a.id)) continue;
      events.push({
        kind: "rating_without_payout",
        severity: "warning",
        appointment_id: a.id,
        message: "Consulta paga e avaliada, mas o repasse do médico não foi liberado. Confira a carteira do médico.",
        auto_fixed: false,
        dedupe_key: guardianDedupeKey("rating_without_payout", a.id, now),
        details: {},
      });
    }
  }

  // Registra uma única vez e avisa os administradores só sobre o que é novo.
  let created: { id: string; kind: string; message: string; appointment_id: string | null }[] = [];
  if (events.length) {
    const { data, error } = await sb
      .from("consultation_guardian_events")
      .upsert(events, { onConflict: "dedupe_key", ignoreDuplicates: true })
      .select("id, kind, message, appointment_id");
    if (error) errors.push(`events: ${error.message}`);
    created = data ?? [];
  }
  if (created.length) {
    const { data: admins } = await sb.from("user_roles").select("user_id").eq("role", "admin");
    if (admins?.length) {
      await sb.from("notifications").insert(
        admins.flatMap((r: { user_id: string }) =>
          created.map((e) => ({
            user_id: r.user_id,
            title: "Guardião das consultas",
            message: e.appointment_id ? `${e.message} (consulta ${e.appointment_id.slice(0, 8)})` : e.message,
            type: "consultation_guardian",
            action_url: "/admin",
          })),
        ),
      );
    }
  }

  return json({ ok: errors.length === 0, checked_at: now.toISOString(), found: events.length, new_alerts: created.length, errors });
});
