// 🌿 Planta y Raiz — Convite de consulta com aceite em 5 minutos e fila automática.
// Regra oficial:
// 1. Médico escolhido recebe WhatsApp + E-mail (Hostinger):
//    "Dr(a). [nome], o senhor(a) tem uma consulta agora na Planta y Raiz. Entre em Consultório Médico."
//    (Zero nome do paciente ou dado de saúde no aviso).
// 2. Se não atender em 5 minutos -> próximo médico assinante disponível (5 min, repete entre assinantes).
// 3. Se nenhum assinante atender -> próximo médico online no Consultório Médico com ON ativo e batimento <= 2 min (5 min).
// 4. Se nenhum atender no Ciclo 1 -> reagenda automaticamente para +1h após o 1º atendimento com aviso na tela.
// 5. Se após o reinício de 1h (Ciclo 2) nenhum atender -> encaminha o paciente para Orientação Técnica gratuita
//    (avisado antes) e entrega o relatório da orientação ao médico escolhido.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getCallerUserId, isAdmin } from "../_shared/admin-auth.ts";
import {
  buildDoctorConsultationMessage,
  cleanDoctorDisplayName,
  notifyRecipientEmailOnce,
  notifyRecipientOnce,
} from "../_shared/payment-notify.ts";
import {
  DEFAULT_QUEUE_ROUTING_CONFIG,
  PATIENT_FREE_OT_NOTICE_MESSAGE,
  PATIENT_FREE_OT_SUGGESTION_MESSAGE,
  isUrgentConsultation,
  lastRescheduleIso,
  patientRescheduleMessage,
  queueCycleFromNotes,
  selectNextQueueStep,
  shouldSuggestFreeOt,
  type QueueCandidate,
  type QueueRoutingConfig,
} from "../_shared/consultation-queue.ts";

const SITE = "https://www.plantayraiz.com.br";

function svcClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function htmlPage(title: string, body: string, extraHeaders: Record<string, string> = {}) {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#08140d;color:#eafaf0;font-family:system-ui,-apple-system,sans-serif;padding:24px}
.c{max-width:420px;text-align:center;background:#0f2418;border:1px solid #1e5c3a;border-radius:20px;padding:28px}
h1{font-size:20px;margin:0 0 12px}p{font-size:15px;line-height:1.5;color:#b9e6cd;margin:0 0 18px}
a{display:inline-block;background:#1B4332;color:#fff;text-decoration:none;font-weight:800;padding:14px 20px;border-radius:14px}</style>
</head><body><div class="c"><h1>${title}</h1>${body}</div></body></html>`,
    { status: 200, headers: { ...extraHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function loadEditableQueueConfig(svc: ReturnType<typeof svcClient>): Promise<QueueRoutingConfig> {
  try {
    const { data } = await svc
      .from("audit_log")
      .select("new_data")
      .eq("action", "queue_routing_config_updated")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const custom = (data?.new_data ?? null) as Partial<QueueRoutingConfig> | null;
    if (custom && typeof custom === "object") {
      return { ...DEFAULT_QUEUE_ROUTING_CONFIG, ...custom };
    }
  } catch {
    /* fallback to default config */
  }
  return DEFAULT_QUEUE_ROUTING_CONFIG;
}

/** Cria o convite para o próximo profissional apto (ou executa o fallback da fila). */
/** Orientação Técnica gratuita ligada à consulta (idempotente por consulta). Não cancela a fila da consulta. */
async function ensureFreeOtOrder(
  svc: ReturnType<typeof svcClient>,
  appt: { id: string; patient_id: string; notes: string | null },
  chosenDoctorId: string | null,
): Promise<string> {
  const freeRef = `orientacao_tecnica:free:${appt.patient_id}:${appt.id}`;
  await svc.from("orientacao_tecnica_orders").upsert(
    {
      external_reference: freeRef,
      user_id: appt.patient_id,
      amount: 0,
      status: "approved",
      flow_status: "ready",
      mp_payment_id: `free-fallback-${appt.id}`,
      triage: {
        red_flags: "nenhum",
        queixa: String(appt.notes ?? "Encaminhado da fila de consulta médica").slice(0, 1000),
        tempo: "1 a 6 meses",
        intensidade: "5",
        medicamentos: "Conforme triagem da consulta",
        objetivo: `Relatório compartilhado com médico escolhido (${chosenDoctorId ?? "plantão"})`,
        forwarded_from_appointment_id: appt.id,
        chosen_doctor_id: chosenDoctorId,
      },
    },
    { onConflict: "external_reference", ignoreDuplicates: true },
  );
  return freeRef;
}

async function dispatchOffer(
  svc: ReturnType<typeof svcClient>,
  appointmentId: string,
  options?: { testMode?: boolean; forceCycle?: number },
): Promise<{
  ok: boolean;
  reason?: string;
  action?: string;
  doctor?: string;
  offer_id?: string;
  cycle?: number;
  rescheduled_for?: string;
  free_ot_reference?: string;
  patient_message?: string;
}> {
  const testMode = Boolean(options?.testMode);
  const { data: appt } = await svc
    .from("appointments")
    .select("id, patient_id, doctor_id, type, amount, status, payment_status, notes, scheduled_at, created_at")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt) return { ok: false, reason: "appointment_not_found" };
  if (appt.payment_status !== "paid") {
    return { ok: false, reason: "payment_not_confirmed" };
  }
  if (appt.status === "cancelled" || appt.status === "completed") {
    return { ok: false, reason: "appointment_closed" };
  }

  // Já existe convite aceito ou pendente válido?
  const { data: offers } = await svc
    .from("consultation_offers")
    .select("id, doctor_id, status, expires_at, attempt, created_at, payload")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });

  const list = offers ?? [];
  if (list.some((o) => o.status === "accepted") || appt.status === "in_progress") {
    return { ok: false, reason: "already_accepted" };
  }
  const live = list.find(
    (o) => o.status === "pending" && new Date(o.expires_at as string).getTime() > Date.now(),
  );
  if (live) return { ok: true, offer_id: live.id as string, reason: "offer_already_live" };

  const config = await loadEditableQueueConfig(svc);

  // Ciclo atual = 1 + reagendamentos já feitos (cada reinício da fila volta a tentar escolhido -> assinantes -> online).
  const highestRecordedCycle = list.reduce((max, o) => {
    const c = Number((o.payload as Record<string, unknown> | null)?.cycle ?? 1);
    return Math.max(max, Number.isFinite(c) ? c : 1);
  }, 1);
  const currentCycle = options?.forceCycle ?? Math.max(highestRecordedCycle, queueCycleFromNotes(appt.notes));
  const urgent = isUrgentConsultation(appt.notes);

  // Médicos já tentados no ciclo atual
  const triedInCurrentCycle = list
    .filter((o) => Number((o.payload as Record<string, unknown> | null)?.cycle ?? 1) === currentCycle)
    .map((o) => String(o.doctor_id));

  // médico escolhido originalmente (preservado no 1º convite ou no próprio agendamento)
  const chosenDoctorId = String(
    (list[0]?.payload as Record<string, unknown> | null)?.chosen_doctor_id ??
      appt.doctor_id ??
      "",
  ) || null;

  // Consulta médicos em atendimento ativo para marcar como "em consulta" (não recebem novos avisos)
  const { data: activeAppts } = await svc
    .from("appointments")
    .select("doctor_id")
    .eq("status", "in_progress")
    .neq("id", appointmentId);
  const busyDoctorIds = new Set((activeAppts ?? []).map((a) => String(a.doctor_id)));

  // Carrega pool de médicos + dados extras de presença e assinatura
  const [{ data: pool, error: poolErr }, { data: doctorRows }] = await Promise.all([
    svc.rpc("consultation_doctor_pool", { _specialty: null }),
    svc
      .from("doctors")
      .select("id, user_id, crm, crm_state, specialty, is_online, is_available, last_seen_online, plan_tier, rating, total_consultations"),
  ]);
  if (poolErr) {
    console.error("[consultation-offer] pool", poolErr.message);
    return { ok: false, reason: "pool_failed" };
  }

  const docMetaById = new Map<string, Record<string, unknown>>();
  for (const d of doctorRows ?? []) {
    docMetaById.set(String(d.id), d as Record<string, unknown>);
  }

  const rawPool = (pool ?? []) as Array<Record<string, unknown>>;
  const candidates: QueueCandidate[] = await Promise.all(
    rawPool.map(async (p) => {
      const docId = String(p.doctor_id);
      const userId = String(p.user_id);
      const meta = docMetaById.get(docId) ?? {};
      let activeSub = false;
      try {
        const { data: subData } = await svc.rpc("has_active_subscription", {
          user_uuid: userId,
          check_env: "live",
        });
        activeSub = subData === true;
      } catch {
        activeSub = false;
      }
      return {
        doctor_id: docId,
        user_id: userId,
        full_name: (p.full_name as string | null) ?? null,
        phone: (p.phone as string | null) ?? null,
        crm: (p.crm as string | null) ?? (meta.crm as string | null) ?? null,
        crm_state: (p.crm_state as string | null) ?? (meta.crm_state as string | null) ?? null,
        specialty: (p.specialty as string | null) ?? (meta.specialty as string | null) ?? null,
        is_online: Boolean(meta.is_online ?? p.is_online),
        is_available: (meta.is_available as boolean | null) ?? true,
        last_seen_online: (meta.last_seen_online as string | null) ?? null,
        in_consultation: busyDoctorIds.has(docId),
        is_subscriber: activeSub,
        plan_tier: (meta.plan_tier as string | null) ?? null,
        rating: (meta.rating as number | null) ?? null,
        total_consultations: (meta.total_consultations as number | null) ?? null,
        kyc_green: Boolean(p.kyc_green),
      };
    }),
  );

  const firstAttemptAtIso = (list[0]?.created_at as string | undefined) ?? (appt.created_at as string | undefined) ?? new Date().toISOString();

  const decision = selectNextQueueStep({
    chosenDoctorId,
    candidates,
    triedDoctorIdsInCurrentCycle: triedInCurrentCycle,
    currentCycle,
    firstAttemptAtIso,
    nowMs: Date.now(),
    testMode,
    urgent,
    config,
  });

  // ── Caso 4: Ninguém atendeu neste ciclo -> sala de espera e reinício da fila até o prazo (12 h; 1 h urgente) ──
  if (decision.action === "reschedule") {
    const updatedNotes = `${String(appt.notes ?? "").trim()}\n[FILA_REAGENDADA:${decision.rescheduledForIso}]`.trim();
    await svc
      .from("appointments")
      .update({
        scheduled_at: decision.rescheduledForIso,
        notes: updatedNotes.slice(0, 4000),
      })
      .eq("id", appt.id);

    // Avisa o paciente só no 1º reagendamento (os reinícios seguintes acontecem na mesma sala de espera).
    if (decision.cycle <= 1) {
      await svc.from("notifications").insert({
        user_id: appt.patient_id,
        title: urgent ? "Sua consulta acontece em até 1 hora" : "Sua consulta acontece em até 12 horas",
        message: decision.messageToPatient,
        type: "consultation_waiting_room",
        action_url: `/consulta/consulta_video?appt=${appt.id}`,
      });
      // WhatsApp ao paciente (envio único por consulta).
      await svc.functions
        .invoke("consultation-patient-notify", { body: { appointment_id: appt.id, event: "waiting_room" } })
        .catch((e) => console.error("[consultation-offer] patient notify", e));
    }

    await svc.from("audit_log").insert({
      user_id: appt.patient_id,
      action: "consultation_queue_rescheduled",
      table_name: "appointments",
      record_id: appt.id,
      new_data: {
        appointment_id: appt.id,
        chosen_doctor_id: chosenDoctorId,
        rescheduled_for: decision.rescheduledForIso,
        deadline: decision.deadlineIso,
        urgent,
        patient_message: decision.messageToPatient,
        cycle: decision.cycle,
        test_mode: testMode,
      },
    });

    return {
      ok: false,
      reason: "rescheduled",
      action: "reschedule",
      cycle: decision.cycle,
      rescheduled_for: decision.rescheduledForIso,
      patient_message: decision.messageToPatient,
    };
  }

  // ── Caso 5: Prazo esgotado sem médico -> Orientação Técnica gratuita + relatório ao médico escolhido ──
  if (decision.action === "forward_free_ot") {
    const freeRef = await ensureFreeOtOrder(svc, appt, chosenDoctorId);

    const updatedNotes = `${String(appt.notes ?? "").trim()}\n[ENCAMINHADO_OT_GRATUITA:${freeRef}]`.trim();
    await svc
      .from("appointments")
      .update({ notes: updatedNotes.slice(0, 4000) })
      .eq("id", appt.id);

    await svc.from("notifications").insert({
      user_id: appt.patient_id,
      title: "Orientação Técnica gratuita liberada",
      message: decision.messageToPatient,
      type: "consultation_forwarded_free_ot",
      action_url: `/orientacao-tecnica?ref=${encodeURIComponent(freeRef)}&from_appt=${appt.id}&doctor=${chosenDoctorId ?? ""}`,
    });

    // Avisa o médico escolhido que o paciente foi encaminhado para a Orientação Técnica gratuita e que o relatório está vinculado a ele
    if (chosenDoctorId) {
      const { data: chosenDoc } = await svc.from("doctors").select("user_id").eq("id", chosenDoctorId).maybeSingle();
      if (chosenDoc?.user_id) {
        await svc.from("notifications").insert({
          user_id: chosenDoc.user_id,
          title: "Relatório de Orientação Técnica vinculado à sua consulta",
          message: "Seu paciente recebeu uma Orientação Técnica gratuita enquanto aguardava. O relatório ficará disponível no seu Consultório Médico.",
          type: "ot_report_shared_with_doctor",
          action_url: `/consultorio?appointment=${appt.id}&ot_ref=${encodeURIComponent(freeRef)}`,
        });
      }
    }

    await svc.from("audit_log").insert({
      user_id: appt.patient_id,
      action: "consultation_queue_forwarded_free_ot",
      table_name: "appointments",
      record_id: appt.id,
      new_data: {
        appointment_id: appt.id,
        chosen_doctor_id: chosenDoctorId,
        free_ot_reference: freeRef,
        patient_message: decision.messageToPatient,
        cycle: decision.cycle,
        test_mode: testMode,
      },
    });

    return {
      ok: false,
      reason: "forwarded_free_ot",
      action: "forward_free_ot",
      cycle: decision.cycle,
      free_ot_reference: freeRef,
      patient_message: decision.messageToPatient,
    };
  }

  // ── Caso 1/2/3: Envia convite ao médico selecionado (escolhido / assinante / online) ──
  const next = decision.candidate;
  const waitSeconds = decision.waitSeconds;
  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + waitSeconds * 1000).toISOString();

  const { data: offer, error: offErr } = await svc
    .from("consultation_offers")
    .insert({
      patient_id: appt.patient_id,
      doctor_id: next.doctor_id,
      appointment_id: appt.id,
      consultation_type: String(appt.type ?? "video"),
      amount: Number(appt.amount ?? 0),
      status: "pending",
      expires_at: expiresAt,
      attempt: list.length + 1,
      response_token: token,
      payload: {
        doctor_user_id: next.user_id,
        kyc_green: next.kyc_green,
        role: decision.role,
        cycle: decision.cycle,
        chosen_doctor_id: chosenDoctorId,
        wait_seconds: waitSeconds,
        test_mode: testMode,
      },
    })
    .select("id")
    .single();

  if (offErr || !offer) {
    console.error("[consultation-offer] insert", offErr?.message);
    return { ok: false, reason: "offer_insert_failed" };
  }

  const cleanName = cleanDoctorDisplayName(next.full_name);
  const privacySafeAlert = buildDoctorConsultationMessage({ doctorName: cleanName });
  const consultorioUrl = `${SITE}/consultorio?appointment=${appt.id}&offer=${offer.id}`;

  // 1) Aviso por WhatsApp registrado em payment_notify_log + payment_notify_attempts (sem nome do paciente nem dado de saúde)
  if (next.phone) {
    await notifyRecipientOnce(svc, {
      key: `offer:${offer.id}:doctor:${next.doctor_id}:whatsapp`,
      phone: next.phone,
      service: `Aviso ao médico (${decision.role}) — WhatsApp`,
      text: privacySafeAlert,
      simulateOnly: testMode,
    });
  }

  // 2) Aviso por E-mail Hostinger registrado em payment_notify_log + payment_notify_attempts (sem nome do paciente nem dado de saúde)
  let doctorEmail = next.email || "";
  if (!doctorEmail) {
    try {
      const { data: authUser } = await svc.auth.admin.getUserById(next.user_id);
      doctorEmail = authUser?.user?.email || "";
    } catch {
      doctorEmail = "";
    }
  }
  if (doctorEmail) {
    await notifyRecipientEmailOnce(svc, {
      key: `offer:${offer.id}:doctor:${next.doctor_id}:email`,
      email: doctorEmail,
      doctorName: cleanName,
      service: `Aviso ao médico (${decision.role}) — E-mail Hostinger`,
      consultorioUrl,
      simulateOnly: testMode,
    });
  }

  // 3) Notificação interna no Consultório Médico
  await svc.from("notifications").insert({
    user_id: next.user_id,
    title: "Consulta agora na Planta y Raiz",
    message: privacySafeAlert,
    type: "consultation_offer",
    action_url: `/consultorio?appointment=${appt.id}&offer=${offer.id}`,
  });

  // 4) Registra cadeia completa de auditoria
  await svc.from("audit_log").insert({
    user_id: next.user_id,
    action: "consultation_offer_dispatched",
    table_name: "consultation_offers",
    record_id: offer.id,
    new_data: {
      appointment_id: appt.id,
      offer_id: offer.id,
      doctor_id: next.doctor_id,
      doctor_name: `Dr(a). ${cleanName}`,
      role: decision.role,
      attempt: list.length + 1,
      cycle: decision.cycle,
      wait_seconds: waitSeconds,
      expires_at: expiresAt,
      test_mode: testMode,
    },
  });

  if (list.length > 0) {
    const newTime = new Date(Date.now() + waitSeconds * 1000);
    await svc
      .from("appointments")
      .update({ doctor_id: next.doctor_id, scheduled_at: newTime.toISOString() })
      .eq("id", appt.id);
  }

  return {
    ok: true,
    action: "offer_doctor",
    offer_id: offer.id as string,
    doctor: `Dr(a). ${cleanName}`,
    cycle: decision.cycle,
  };
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const htmlPageCors = (title: string, body: string) => htmlPage(title, body, cors);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const url = new URL(req.url);
  const svc = svcClient();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const isService =
    bearer === serviceKey ||
    req.headers.get("x-cron-secret") === Deno.env.get("BRISA_CEO_SECRET_KEY");

  let body: Record<string, unknown> = {};
  if (req.method === "POST") body = await req.json().catch(() => ({}));
  const action = String(url.searchParams.get("action") ?? body.action ?? "");

  try {
    // ── Resposta do profissional (link ou banner do Consultório Médico) ──
    if (action === "respond") {
      const offerId = String(url.searchParams.get("offer") ?? body.offer ?? "");
      const token = String(url.searchParams.get("token") ?? body.token ?? "");
      const reply = String(url.searchParams.get("reply") ?? body.reply ?? "").toLowerCase();
      if (!offerId || !token) return htmlPageCors("Link inválido", "<p>Convite não encontrado.</p>");

      const { data: offer } = await svc
        .from("consultation_offers")
        .select("id, doctor_id, appointment_id, status, expires_at, response_token, payload")
        .eq("id", offerId)
        .maybeSingle();

      if (!offer || offer.response_token !== token) {
        return htmlPageCors("Link inválido", "<p>Este convite não é mais válido.</p>");
      }
      if (offer.status !== "pending") {
        return htmlPageCors(
          "Convite encerrado",
          `<p>Esta consulta já foi ${offer.status === "accepted" ? "aceita por um médico" : "repassada a outro profissional"}.</p>
           <a href="${SITE}/consultorio">Abrir Consultório Médico</a>`,
        );
      }
      const expired = new Date(offer.expires_at as string).getTime() < Date.now();
      const offerPayload = (offer.payload ?? {}) as Record<string, unknown>;
      const testMode = Boolean(offerPayload.test_mode);

      if (reply === "no" || expired) {
        await svc
          .from("consultation_offers")
          .update({
            status: expired ? "expired" : "declined",
            declined_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", offer.id)
          .eq("status", "pending");

        await svc.from("audit_log").insert({
          action: expired ? "consultation_offer_expired" : "consultation_offer_declined",
          table_name: "consultation_offers",
          record_id: offer.id,
          new_data: {
            appointment_id: offer.appointment_id,
            doctor_id: offer.doctor_id,
            test_mode: testMode,
          },
        });

        const next = await dispatchOffer(svc, String(offer.appointment_id), { testMode });
        return htmlPageCors(
          expired ? "Tempo esgotado" : "Consulta repassada",
          `<p>${expired ? "O prazo de 5 minutos expirou." : "Tudo bem, obrigado pela resposta."} ${
            next.ok ? "A consulta foi encaminhada ao próximo profissional de plantão." : "O fluxo automático de contingência foi acionado."
          }</p><a href="${SITE}/consultorio">Abrir Consultório Médico</a>`,
        );
      }

      // Bloqueio de concorrência: verifica se outro médico já aceitou esta mesma consulta
      const { data: alreadyAccepted } = await svc
        .from("consultation_offers")
        .select("id, doctor_id")
        .eq("appointment_id", offer.appointment_id)
        .eq("status", "accepted")
        .limit(1);
      if (alreadyAccepted && alreadyAccepted.length > 0) {
        return htmlPageCors("Convite encerrado", "<p>Outro médico já assumiu este atendimento.</p>");
      }

      // Aceite atômico (status = 'pending')
      const { data: accepted } = await svc
        .from("consultation_offers")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", offer.id)
        .eq("status", "pending")
        .select("id, doctor_id, appointment_id")
        .maybeSingle();

      if (!accepted) return htmlPageCors("Convite encerrado", "<p>Esta consulta já foi atribuída.</p>");

      await svc
        .from("appointments")
        .update({
          doctor_id: accepted.doctor_id,
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", accepted.appointment_id);

      await svc.from("audit_log").insert({
        action: "consultation_offer_accepted",
        table_name: "consultation_offers",
        record_id: accepted.id,
        new_data: {
          appointment_id: accepted.appointment_id,
          doctor_id: accepted.doctor_id,
          accepted_at: new Date().toISOString(),
        },
      });

      const { data: appt } = await svc
        .from("appointments")
        .select("patient_id, type")
        .eq("id", accepted.appointment_id)
        .maybeSingle();

      if (appt?.patient_id) {
        const patientUrl = `/consulta/consulta_${appt.type === "chat" ? "chat" : "video"}?appt=${accepted.appointment_id}`;
        await svc.from("notifications").insert({
          user_id: appt.patient_id,
          title: "Médico na sala ao vivo",
          message: "O médico aceitou sua consulta e já está na sala ao vivo.",
          type: "consultation",
          action_url: patientUrl,
        });
      }

      return htmlPageCors(
        "Consulta confirmada ✅",
        `<p>Obrigado! O paciente já está na sala ao vivo. Entre em Consultório Médico para atender.</p>
         <a href="${SITE}/consultorio?appointment=${accepted.appointment_id}">Entrar em Consultório Médico</a>`,
      );
    }

    // ── Estado do convite e da fila (paciente ou serviço) ─────────────────
    // ── Sala de espera do paciente: estado da fila e Orientação gratuita (só o paciente da consulta ou serviço) ──
    if (action === "status" || action === "free_ot") {
      const appointmentId = String(url.searchParams.get("appointment") ?? body.appointment_id ?? "");
      if (!appointmentId) return json({ error: "appointment_id obrigatório" }, 400);
      const [{ data: offers }, { data: appt }] = await Promise.all([
        svc
          .from("consultation_offers")
          .select("id, doctor_id, status, expires_at, created_at, payload")
          .eq("appointment_id", appointmentId)
          .order("created_at", { ascending: true })
          .limit(100),
        svc
          .from("appointments")
          .select("id, patient_id, doctor_id, status, payment_status, scheduled_at, notes")
          .eq("id", appointmentId)
          .maybeSingle(),
      ]);
      if (!appt) return json({ error: "Consulta não encontrada" }, 404);
      if (!isService) {
        const callerId = await getCallerUserId(req);
        if (!callerId || (callerId !== appt.patient_id && !(await isAdmin(callerId)))) {
          return json({ error: "Unauthorized" }, 401);
        }
      }

      const list = offers ?? [];
      const chosenDoctorId = String(
        (list[0]?.payload as Record<string, unknown> | null)?.chosen_doctor_id ?? appt.doctor_id ?? "",
      ) || null;
      const notes = String(appt.notes ?? "");
      const freeOtMatch = notes.match(/\[ENCAMINHADO_OT_GRATUITA:([^\]]+)\]/);
      const urgent = isUrgentConsultation(notes);
      const rescheduledFor = lastRescheduleIso(notes);
      const inProgress = appt.status === "in_progress" || appt.status === "completed";
      const suggestFreeOt = !inProgress && !freeOtMatch && appt.payment_status === "paid" &&
        shouldSuggestFreeOt(list.map((o) => ({ doctor_id: o.doctor_id as string | null, status: o.status as string | null })), chosenDoctorId);

      if (action === "free_ot") {
        // O paciente aceitou a sugestão: libera a Orientação gratuita sem cancelar a fila da consulta.
        if (!suggestFreeOt) return json({ error: "Orientação gratuita indisponível neste momento" }, 409);
        const ref = await ensureFreeOtOrder(svc, appt, chosenDoctorId);
        return json({ ok: true, free_ot_reference: ref });
      }

      const queueState = freeOtMatch ? "forwarded_free_ot" : inProgress ? "in_progress" : rescheduledFor ? "rescheduled" : "waiting";
      return json({
        ok: true,
        queue_state: queueState,
        urgent,
        rescheduled_for: rescheduledFor,
        free_ot_reference: freeOtMatch?.[1] ?? null,
        suggest_free_ot: suggestFreeOt,
        patient_message: freeOtMatch
          ? PATIENT_FREE_OT_NOTICE_MESSAGE
          : rescheduledFor
          ? patientRescheduleMessage(urgent)
          : suggestFreeOt
          ? PATIENT_FREE_OT_SUGGESTION_MESSAGE
          : null,
        current_offer: list.filter((o) => o.status === "pending").map((o) => ({ expires_at: o.expires_at })).pop() ?? null,
      });
    }

    if (action !== "sweep" && !isService) return json({ error: "Unauthorized" }, 401);

    if (action === "dispatch") {
      const appointmentId = String(body.appointment_id ?? "");
      if (!appointmentId) return json({ error: "appointment_id obrigatório" }, 400);
      const res = await dispatchOffer(svc, appointmentId, {
        testMode: Boolean(body.test_mode),
        forceCycle: typeof body.force_cycle === "number" ? body.force_cycle : undefined,
      });
      return json(res);
    }

    if (action === "sweep") {
      // 1. Expira convites vencidos (> 5 min) e transfere para o próximo da fila
      const { data: stale } = await svc
        .from("consultation_offers")
        .select("id, appointment_id, doctor_id, payload")
        .eq("status", "pending")
        .lt("expires_at", new Date().toISOString())
        .limit(50);

      let reassigned = 0;
      for (const offer of stale ?? []) {
        await svc
          .from("consultation_offers")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", offer.id)
          .eq("status", "pending");

        const offerPayload = (offer.payload ?? {}) as Record<string, unknown>;
        await svc.from("audit_log").insert({
          action: "consultation_offer_expired",
          table_name: "consultation_offers",
          record_id: offer.id,
          new_data: {
            appointment_id: offer.appointment_id,
            doctor_id: offer.doctor_id,
            cycle: offerPayload.cycle ?? 1,
          },
        });

        const next = await dispatchOffer(svc, String(offer.appointment_id), {
          testMode: Boolean(offerPayload.test_mode),
        });
        if (next.ok) reassigned++;
      }

      // 2. Reinicia a fila das consultas na sala de espera cujo horário de reinício chegou.
      //    Consulta paga fica "confirmed" (webhook) ou "scheduled"; o ciclo vem das notas (1 + reagendamentos).
      const { data: dueRescheduled } = await svc
        .from("appointments")
        .select("id, notes, scheduled_at")
        .in("status", ["confirmed", "scheduled", "pending"])
        .eq("payment_status", "paid")
        .lte("scheduled_at", new Date().toISOString())
        .ilike("notes", "%[FILA_REAGENDADA%")
        .limit(25);

      let restartedAfter1h = 0;
      for (const appt of dueRescheduled ?? []) {
        if (String(appt.notes ?? "").includes("[ENCAMINHADO_OT_GRATUITA:")) continue;
        const next = await dispatchOffer(svc, String(appt.id));
        if (next.ok || next.action === "forward_free_ot") restartedAfter1h++;
      }

      return json({
        ok: true,
        expired: stale?.length ?? 0,
        reassigned,
        restarted_after_1h: restartedAfter1h,
      });
    }

    return json({ error: "action inválida" }, 400);
  } catch (e) {
    console.error("[consultation-offer]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
