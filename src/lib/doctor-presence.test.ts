import { describe, expect, it } from "vitest";
import {
  DOCTOR_PRESENCE_HEARTBEAT_INTERVAL_MS,
  DOCTOR_PRESENCE_STALE_TIMEOUT_MS,
  DEFAULT_QUEUE_ROUTING_CONFIG,
  PATIENT_URGENCY_RESCHEDULE_MESSAGE,
  PATIENT_FREE_OT_NOTICE_MESSAGE,
  evaluateDoctorPresence,
  isPresenceHeartbeatFresh,
  selectNextQueueStep,
  maskPixKey,
  type QueueCandidate,
} from "./doctor-presence";
import {
  buildDoctorConsultationMessage,
  buildDoctorPayoutAvailableMessage,
} from "../../supabase/functions/_shared/payment-notify";
import {
  RED_FLAG_OPTIONS,
  hasEmergency,
  invalidTriageFields,
} from "../../supabase/functions/_shared/orientation-triage";
import {
  FALLBACK_SERVICES,
  OFFICIAL_RECEIVER_NAME,
} from "../../supabase/functions/_shared/payment-catalog";

describe("Fluxo padronizado de consultas — Testes de Aceitação (Itens 1 a 10)", () => {
  it("Aceite 1 & 10: Catálogo único mantém preços intocados (Chat R$ 100, Vídeo R$ 150, Retorno R$ 90, Orientação Técnica R$ 30) e recebedor Planta y Raiz Ltda", () => {
    expect(OFFICIAL_RECEIVER_NAME).toBe("Planta y Raiz Ltda");
    expect(FALLBACK_SERVICES.consulta_chat.amount_brl).toBe(100);
    expect(FALLBACK_SERVICES.consulta_video.amount_brl).toBe(150);
    expect(FALLBACK_SERVICES.retorno_consulta.amount_brl).toBe(90);
    expect(FALLBACK_SERVICES.orientacao_tecnica.amount_brl).toBe(30);
  });

  it("Aceite 2 & 3: Triagem de 5 perguntas idêntica à Orientação Técnica (emergência primeiro SAMU 192 / CVV 188) e aviso ao médico sem dados do paciente", () => {
    expect(RED_FLAG_OPTIONS[0].value).toBe("nenhum");
    expect(RED_FLAG_OPTIONS[1].value).toBe("sim_emergencia");
    expect(hasEmergency({ red_flags: ["sim_emergencia"] })).toBe(true);
    expect(hasEmergency({ red_flags: ["nenhum"] })).toBe(false);

    const invalid = invalidTriageFields({
      red_flags: "nenhum",
      queixa: "Insônia e ansiedade crônica",
      tempo: "6 meses",
      intensidade: "7",
      medicamentos: "Nenhum",
      objetivo: "Melhorar o sono",
    });
    expect(invalid).toEqual([]);

    // Verifica que a mensagem de aviso ao médico segue o texto exato e NÃO vaza nome do paciente nem dado de saúde
    const msg = buildDoctorConsultationMessage({
      doctorName: "Dr. Victor Henrique Bueno da Fonseca",
      modality: "consulta_video",
    });
    expect(msg).toBe(
      "Dr(a). Victor Henrique Bueno da Fonseca, o senhor(a) tem uma consulta agora na Planta y Raiz. Entre em Consultório Médico.",
    );
    expect(msg).not.toContain("Insônia");
    expect(msg).not.toContain("Paciente");
  });

  it("Aceite 5: Repasse liberado após avaliação envia mensagem padronizada e mascara chave Pix em modo simulado", () => {
    expect(buildDoctorPayoutAvailableMessage()).toBe(
      "Pagamento disponível para saque na Planta y Raiz.",
    );
    expect(maskPixKey("drmiltonurban@gmail.com")).toBe("drmi****.com");
    expect(maskPixKey("12345678901")).toBe("1234****8901");
  });

  it("Aceite 6, 7 & 8: Fila de médicos transfere em 5 min (Escolhido -> Assinante -> Online -> Reagendamento +1h -> Orientação Técnica Gratuita)", () => {
    const nowMs = Date.parse("2026-04-19T12:00:00Z");
    const freshPulseIso = new Date(nowMs - 20_000).toISOString(); // 20s atrás

    const candidates: QueueCandidate[] = [
      {
        doctor_id: "doc-escolhido",
        user_id: "u-1",
        full_name: "Dr. Escolhido",
        phone: "5511999990001",
        plan_tier: "free",
        is_online: false,
        is_available: true,
        last_seen_online: null,
        rating: 4.8,
        total_consultations: 10,
      },
      {
        doctor_id: "doc-assinante-1",
        user_id: "u-2",
        full_name: "Dr. Assinante 1",
        phone: "5511999990002",
        crm: "58169",
        plan_tier: "vip_prescritor",
        is_online: false,
        is_available: true,
        last_seen_online: null,
        rating: 4.9,
        total_consultations: 5,
      },
      {
        doctor_id: "doc-assinante-2",
        user_id: "u-3",
        full_name: "Dr. Assinante 2",
        phone: "5511999990003",
        crm: "206873",
        plan_tier: "vip_prescritor",
        is_online: false,
        is_available: true,
        last_seen_online: null,
        rating: 5.0,
        total_consultations: 8,
      },
      {
        doctor_id: "doc-online-1",
        user_id: "u-4",
        full_name: "Dr. Online Plantão",
        phone: "5511999990004",
        plan_tier: "free",
        is_online: true,
        is_available: true,
        last_seen_online: freshPulseIso,
        rating: 4.7,
        total_consultations: 2,
      },
    ];

    // 1º passo: médico escolhido pelo paciente
    const step1 = selectNextQueueStep({
      chosenDoctorId: "doc-escolhido",
      candidates,
      triedDoctorIdsInCurrentCycle: [],
      currentCycle: 1,
      nowMs,
    });
    expect(step1.action).toBe("offer_doctor");
    if (step1.action === "offer_doctor") {
      expect(step1.role).toBe("chosen");
      expect(step1.candidate.doctor_id).toBe("doc-escolhido");
      expect(step1.waitSeconds).toBe(300);
    }

    // 2º passo (médico escolhido ignorou os 5 min): transfere para 1º médico assinante
    const step2 = selectNextQueueStep({
      chosenDoctorId: "doc-escolhido",
      candidates,
      triedDoctorIdsInCurrentCycle: ["doc-escolhido"],
      currentCycle: 1,
      nowMs,
    });
    expect(step2.action).toBe("offer_doctor");
    if (step2.action === "offer_doctor") {
      expect(step2.role).toBe("subscriber");
      expect(step2.candidate.doctor_id).toBe("doc-assinante-1");
      expect(step2.waitSeconds).toBe(300);
    }

    // 3º passo (1º assinante ignorou): transfere para 2º assinante
    const step3 = selectNextQueueStep({
      chosenDoctorId: "doc-escolhido",
      candidates,
      triedDoctorIdsInCurrentCycle: ["doc-escolhido", "doc-assinante-1"],
      currentCycle: 1,
      nowMs,
    });
    expect(step3.action).toBe("offer_doctor");
    if (step3.action === "offer_doctor") {
      expect(step3.role).toBe("subscriber");
      expect(step3.candidate.doctor_id).toBe("doc-assinante-2");
      expect(step3.waitSeconds).toBe(300);
    }

    // 4º passo (nenhum assinante atendeu): transfere para médico online no Consultório com ON ativo
    const step4 = selectNextQueueStep({
      chosenDoctorId: "doc-escolhido",
      candidates,
      triedDoctorIdsInCurrentCycle: ["doc-escolhido", "doc-assinante-1", "doc-assinante-2"],
      currentCycle: 1,
      nowMs,
    });
    expect(step4.action).toBe("offer_doctor");
    if (step4.action === "offer_doctor") {
      expect(step4.role).toBe("online");
      expect(step4.candidate.doctor_id).toBe("doc-online-1");
      expect(step4.waitSeconds).toBe(300);
    }

    // 5º passo (nenhum médico atendeu no Ciclo 1): reagendamento automático para +1 hora com mensagem exata
    const step5 = selectNextQueueStep({
      chosenDoctorId: "doc-escolhido",
      candidates,
      triedDoctorIdsInCurrentCycle: [
        "doc-escolhido",
        "doc-assinante-1",
        "doc-assinante-2",
        "doc-online-1",
      ],
      currentCycle: 1,
      firstAttemptAtIso: new Date(nowMs).toISOString(),
      nowMs,
    });
    expect(step5).toEqual({
      action: "reschedule_1h",
      messageToPatient:
        "Todos os médicos estão em consulta de urgência. Sua consulta foi agendada automaticamente para uma hora depois do primeiro atendimento",
      rescheduledForIso: new Date(
        nowMs + DEFAULT_QUEUE_ROUTING_CONFIG.rescheduleDelayMinutes * 60_000,
      ).toISOString(),
      cycle: 1,
    });
    expect(PATIENT_URGENCY_RESCHEDULE_MESSAGE).toBe(
      "Todos os médicos estão em consulta de urgência. Sua consulta foi agendada automaticamente para uma hora depois do primeiro atendimento",
    );

    // 6º passo (após o reinício de 1 hora no Ciclo 2, se ainda nenhum médico atender): encaminha à Orientação Técnica gratuita
    const step6 = selectNextQueueStep({
      chosenDoctorId: "doc-escolhido",
      candidates,
      triedDoctorIdsInCurrentCycle: [
        "doc-escolhido",
        "doc-assinante-1",
        "doc-assinante-2",
        "doc-online-1",
      ],
      currentCycle: 2,
      nowMs,
    });
    expect(step6).toEqual({
      action: "forward_free_ot",
      messageToPatient: PATIENT_FREE_OT_NOTICE_MESSAGE,
      chosenDoctorId: "doc-escolhido",
      cycle: 2,
    });
  });

  it("Aceite 9: Médico 'online' de verdade (batimento ~30s, auto-offline em 2 min, 'em_consulta' bloqueia novos avisos)", () => {
    expect(DOCTOR_PRESENCE_HEARTBEAT_INTERVAL_MS).toBe(30_000);
    expect(DOCTOR_PRESENCE_STALE_TIMEOUT_MS).toBe(120_000);

    const nowMs = Date.parse("2026-04-19T12:00:00Z");
    const freshIso = new Date(nowMs - 45_000).toISOString(); // 45s atrás (< 2 min)
    const staleIso = new Date(nowMs - 125_000).toISOString(); // 2m05s atrás (> 2 min)

    expect(isPresenceHeartbeatFresh(freshIso, nowMs)).toBe(true);
    expect(isPresenceHeartbeatFresh(staleIso, nowMs)).toBe(false);

    // Médico logado com ON ativo e batimento fresco -> online
    const onlineDoc = evaluateDoctorPresence(
      { user_id: "user-1", is_online: true, is_available: true, last_seen_online: freshIso },
      nowMs,
    );
    expect(onlineDoc.state).toBe("online");
    expect(onlineDoc.isOnlineForVitrine).toBe(true);
    expect(onlineDoc.canReceiveOffers).toBe(true);

    // Médico que fechou a aba há > 2 min (sem batimento) -> vira offline automaticamente
    const closedTabDoc = evaluateDoctorPresence(
      { user_id: "user-1", is_online: true, is_available: true, last_seen_online: staleIso },
      nowMs,
    );
    expect(closedTabDoc.state).toBe("offline");
    expect(closedTabDoc.isOnlineForVitrine).toBe(false);

    // Médico sem user_id (não logado) nunca aparece online na vitrine
    const unloggedDoc = evaluateDoctorPresence(
      { user_id: null, is_online: true, is_available: true, last_seen_online: freshIso },
      nowMs,
    );
    expect(unloggedDoc.state).toBe("offline");
    expect(unloggedDoc.isOnlineForVitrine).toBe(false);

    // Médico em consulta ativa aparece como "em_consulta" e não recebe novos avisos
    const busyDoc = evaluateDoctorPresence(
      {
        user_id: "user-1",
        is_online: true,
        is_available: true,
        last_seen_online: freshIso,
        in_consultation: true,
      },
      nowMs,
    );
    expect(busyDoc.state).toBe("em_consulta");
    expect(busyDoc.canReceiveOffers).toBe(false);
  });
});
