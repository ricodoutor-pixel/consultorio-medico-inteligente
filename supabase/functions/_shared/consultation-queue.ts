// 🌿 Planta y Raiz — Regras editáveis de presença médica real e fila de transferência automática.
// Fonte única para:
// 1. Presença "online" real (logado + Consultório Médico aberto + botão ON ativo + batimento <= 2 min, sem estar em consulta).
// 2. Fila de transferência (docs/FLUXO_CONSULTAS.md, seção 3): médico escolhido 5 min -> assinantes 5 min -> médicos online 5 min.
//    Assim que o escolhido não atende, o paciente é avisado e recebe a sugestão de Orientação Técnica gratuita enquanto a fila segue.
//    Sem médico: a consulta fica agendada na sala de espera e a fila recomeça periodicamente até o prazo (12 h; 1 h se urgente).
//    Prazo esgotado: Orientação Técnica gratuita com acesso do médico escolhido ao relatório.

import { planRank } from "./doctor-plans.ts";

export const PRESENCE_HEARTBEAT_INTERVAL_MS = 30_000; // ~30 segundos
export const PRESENCE_TIMEOUT_MS = 120_000; // 2 minutos sem batimento = offline automático

/** Mensagem genérica (compatibilidade); use patientRescheduleMessage(urgent) para o texto da regra atual. */

export const PATIENT_URGENCY_RESCHEDULE_MESSAGE =
  "No momento todos os médicos estão em atendimento. Sua consulta está garantida e acontecerá em até 12 horas. Fique nesta sala de espera: avisamos aqui assim que um médico entrar.";

export function patientRescheduleMessage(urgent: boolean): string {
  return urgent
    ? "No momento todos os médicos estão em atendimento. Como seu caso foi marcado como urgente, sua consulta acontecerá em até 1 hora. Fique nesta sala de espera: avisamos aqui assim que um médico entrar."
    : PATIENT_URGENCY_RESCHEDULE_MESSAGE;
}

/** Mostrada assim que o médico escolhido não atende, enquanto a fila chama o médico de plantão. */
export const PATIENT_FREE_OT_SUGGESTION_MESSAGE =
  "O médico escolhido não conseguiu entrar agora. Já estamos chamando o próximo médico disponível. Enquanto isso, se quiser, você pode fazer uma Orientação Técnica gratuita — sua consulta continua garantida.";

export const PATIENT_FREE_OT_NOTICE_MESSAGE =
  "Nenhum médico conseguiu entrar agora. Para você não ficar esperando e dar mais tempo ao médico escolhido, vamos encaminhar você agora para uma Orientação Técnica gratuita. Assim que terminar, o médico escolhido recebe acesso ao relatório da sua orientação.";

export interface QueueRoutingConfig {
  /** Tempo de espera por tentativa em segundos (padrão: 300s = 5 min). */
  offerWaitSeconds: number;
  /** Tempo reduzido permitido APENAS quando testMode=true estiver explicitamente marcado. */
  testOfferWaitSeconds: number;
  /** Tempo sem batimento para considerar offline (padrão: 120s = 2 min). */
  heartbeatTimeoutSeconds: number;
  /** Intervalo entre reinícios da fila quando nenhum médico atende (padrão: 60 min). */
  rescheduleDelayMinutes: number;
  /** Intervalo entre reinícios para casos urgentes (padrão: 15 min). */
  urgentRescheduleDelayMinutes: number;
  /** Prazo máximo para a consulta acontecer desde o 1º convite (padrão: 12 h). */
  deadlineMinutes: number;
  /** Prazo máximo para casos urgentes (padrão: 1 h). */
  urgentDeadlineMinutes: number;
  /** Planos considerados "médico assinante". */
  subscriberTiers: string[];
  /** Critério de ordenação entre assinantes ("priority_then_rotation" | "rotation" | "rating"). */
  subscriberOrder: "priority_then_rotation" | "rotation" | "rating";
  /** CRMs prioritários configuráveis entre assinantes. */
  prioritySubscriberCrms: string[];
}

export const DEFAULT_QUEUE_ROUTING_CONFIG: QueueRoutingConfig = {
  offerWaitSeconds: 300,
  testOfferWaitSeconds: 15,
  heartbeatTimeoutSeconds: 120,
  rescheduleDelayMinutes: 60,
  urgentRescheduleDelayMinutes: 15,
  deadlineMinutes: 720,
  urgentDeadlineMinutes: 60,
  subscriberTiers: ["vip", "vip_prescritor", "premium", "basic", "assinante", "pro", "plano_medico", "ouro", "platina", "diamante", "elite", "black"],
  subscriberOrder: "priority_then_rotation",
  prioritySubscriberCrms: ["58169", "206873"],
};

export interface DoctorPresenceInput {
  id?: string | null;
  user_id?: string | null;
  is_online?: boolean | null;
  is_available?: boolean | null;
  last_seen_online?: string | null;
  in_consultation?: boolean | null;
  consultorio_open?: boolean | null;
}

export type DoctorPresenceState = "online" | "em_consulta" | "offline";

/**
 * Verifica se o batimento de presença está dentro da janela de 2 minutos.
 */
export function isPresenceHeartbeatFresh(
  lastSeenIso: string | null | undefined,
  nowMs = Date.now(),
  timeoutMs = PRESENCE_TIMEOUT_MS,
): boolean {
  if (!lastSeenIso) return false;
  const ts = new Date(lastSeenIso).getTime();
  if (!Number.isFinite(ts)) return false;
  const age = nowMs - ts;
  return age >= -60_000 && age <= timeoutMs;
}

/**
 * Calcula o estado real de presença do médico (uma única fonte para vitrine, fila e painel admin).
 * - Se está em consulta ativa (`in_consultation === true`), retorna "em_consulta" (não recebe novos avisos).
 * - Só conta como "online" se `is_online === true`, `is_available !== false` e batimento recente (<= 2 min).
 */
export function evaluateDoctorPresence(
  doc: DoctorPresenceInput,
  nowMs = Date.now(),
  timeoutMs = PRESENCE_TIMEOUT_MS,
): { state: DoctorPresenceState; isOnlineForVitrine: boolean; canReceiveOffers: boolean; reason: string } {
  if (doc.in_consultation) {
    return {
      state: "em_consulta",
      isOnlineForVitrine: false,
      canReceiveOffers: false,
      reason: "Médico em consulta ativa no momento",
    };
  }
  if (doc.user_id === null) {
    return {
      state: "offline",
      isOnlineForVitrine: false,
      canReceiveOffers: false,
      reason: "Médico não está autenticado na plataforma",
    };
  }
  const toggleOn = Boolean(doc.is_online && (doc.is_available ?? true));
  if (!toggleOn) {
    return {
      state: "offline",
      isOnlineForVitrine: false,
      canReceiveOffers: false,
      reason: "Botão ON desligado no Consultório Médico",
    };
  }
  const fresh = isPresenceHeartbeatFresh(doc.last_seen_online, nowMs, timeoutMs);
  if (!fresh) {
    return {
      state: "offline",
      isOnlineForVitrine: false,
      canReceiveOffers: false,
      reason: "Sem batimento de presença nos últimos 2 minutos",
    };
  }
  return {
    state: "online",
    isOnlineForVitrine: true,
    canReceiveOffers: true,
    reason: "Logado no Consultório Médico com botão ON ativo e batimento recente",
  };
}

export interface QueueCandidate {
  doctor_id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  crm?: string | null;
  crm_state?: string | null;
  specialty?: string | null;
  is_online: boolean;
  is_available?: boolean | null;
  last_seen_online?: string | null;
  in_consultation?: boolean;
  is_subscriber?: boolean;
  plan_tier?: string | null;
  rating?: number | null;
  total_consultations?: number | null;
  kyc_green?: boolean;
}

export function isSubscriberCandidate(
  candidate: QueueCandidate,
  config: QueueRoutingConfig = DEFAULT_QUEUE_ROUTING_CONFIG,
): boolean {
  if (candidate.is_subscriber === true) return true;
  const tier = String(candidate.plan_tier ?? "").trim().toLowerCase();
  if (tier && config.subscriberTiers.map((t) => t.toLowerCase()).includes(tier)) return true;
  const cleanCrm = String(candidate.crm ?? "").replace(/\D/g, "");
  if (cleanCrm && config.prioritySubscriberCrms.includes(cleanCrm)) return true;
  return false;
}

export function sortSubscribers(
  subscribers: QueueCandidate[],
  config: QueueRoutingConfig = DEFAULT_QUEUE_ROUTING_CONFIG,
): QueueCandidate[] {
  const copy = [...subscribers];
  copy.sort((a, b) => {
    if (config.subscriberOrder === "priority_then_rotation") {
      const crmA = String(a.crm ?? "").replace(/\D/g, "");
      const crmB = String(b.crm ?? "").replace(/\D/g, "");
      const idxA = config.prioritySubscriberCrms.indexOf(crmA);
      const idxB = config.prioritySubscriberCrms.indexOf(crmB);
      if (idxA !== -1 || idxB !== -1) {
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        if (idxA !== idxB) return idxA - idxB;
      }
    }
    // Depois dos CRMs prioritários configurados, planos maiores (Black > … > Premium) recebem a oferta antes.
    const rankDiff = planRank(b.plan_tier) - planRank(a.plan_tier);
    if (rankDiff !== 0) return rankDiff;
    if (config.subscriberOrder === "rating") {
      const rDiff = Number(b.rating ?? 0) - Number(a.rating ?? 0);
      if (rDiff !== 0) return rDiff;
    }
    const cDiff = Number(a.total_consultations ?? 0) - Number(b.total_consultations ?? 0);
    if (cDiff !== 0) return cDiff;
    return String(a.full_name ?? "").localeCompare(String(b.full_name ?? ""), "pt-BR");
  });
  return copy;
}

export type QueueStepDecision =
  | {
      action: "offer_doctor";
      role: "chosen" | "subscriber" | "online";
      candidate: QueueCandidate;
      waitSeconds: number;
      cycle: number;
    }
  | {
      action: "reschedule";
      messageToPatient: string;
      rescheduledForIso: string;
      deadlineIso: string;
      cycle: number;
    }
  | {
      action: "forward_free_ot";
      messageToPatient: string;
      chosenDoctorId: string | null;
      cycle: number;
    };

/**
 * Decide o próximo passo da fila de atendimento:
 * 1) Na 1ª tentativa de cada ciclo, tenta o médico escolhido pelo paciente (se ainda não tentado neste ciclo e não estiver em outra consulta).
 * 2) Se o médico escolhido não atender em 5 min, procura o próximo médico ASSINANTE disponível (não em consulta).
 * 3) Se nenhum assinante atender, procura o próximo médico ONLINE de verdade (logado no Consultório Médico com ON ativo e batimento <= 2 min).
 * 4) Se nenhum médico atender no Ciclo 1: reagenda automaticamente para +1 hora após o primeiro atendimento com aviso na tela.
 * 5) Se mesmo após o reinício de 1 hora (Ciclo 2) nenhum médico atender: encaminha o paciente para Orientação Técnica gratuita (avisando antes) e compartilha o relatório com o médico escolhido.
 */
export function selectNextQueueStep(params: {
  chosenDoctorId: string | null;
  candidates: QueueCandidate[];
  triedDoctorIdsInCurrentCycle: string[];
  currentCycle: number;
  firstAttemptAtIso?: string | null;
  nowMs?: number;
  testMode?: boolean;
  /** Caso urgente (não grave) marcado na triagem: prazo de 1 h em vez de 12 h. */
  urgent?: boolean;
  config?: QueueRoutingConfig;
}): QueueStepDecision {
  const {
    chosenDoctorId,
    candidates,
    triedDoctorIdsInCurrentCycle,
    currentCycle,
    firstAttemptAtIso,
    nowMs = Date.now(),
    testMode = false,
    urgent = false,
    config = DEFAULT_QUEUE_ROUTING_CONFIG,
  } = params;

  const waitSeconds = testMode ? config.testOfferWaitSeconds : config.offerWaitSeconds;
  const timeoutMs = config.heartbeatTimeoutSeconds * 1000;
  const tried = new Set(triedDoctorIdsInCurrentCycle);

  // Filtra candidatos que não estão em outra consulta ativa e ainda não foram tentados neste ciclo
  const available = candidates.filter((c) => !c.in_consultation && !tried.has(c.doctor_id));

  // 1. Médico escolhido pelo paciente (primeira tentativa do ciclo)
  if (chosenDoctorId && !tried.has(chosenDoctorId)) {
    const chosen = available.find((c) => c.doctor_id === chosenDoctorId);
    if (chosen) {
      return {
        action: "offer_doctor",
        role: "chosen",
        candidate: chosen,
        waitSeconds,
        cycle: currentCycle,
      };
    }
  }

  // 2. Próximo médico ASSINANTE disponível
  const subscribers = sortSubscribers(
    available.filter((c) => isSubscriberCandidate(c, config)),
    config,
  );
  if (subscribers.length > 0) {
    return {
      action: "offer_doctor",
      role: "subscriber",
      candidate: subscribers[0],
      waitSeconds,
      cycle: currentCycle,
    };
  }

  // 3. Próximo médico ONLINE na plataforma (Consultório Médico aberto + botão ON + batimento <= 2 min)
  const onlineDoctors = available.filter((c) => {
    const hasExplicitTimestamp = c.last_seen_online !== undefined && c.last_seen_online !== null;
    if (hasExplicitTimestamp) {
      return evaluateDoctorPresence(c, nowMs, timeoutMs).canReceiveOffers;
    }
    return Boolean(c.is_online && (c.is_available ?? true));
  });
  if (onlineDoctors.length > 0) {
    return {
      action: "offer_doctor",
      role: "online",
      candidate: onlineDoctors[0],
      waitSeconds,
      cycle: currentCycle,
    };
  }

  // 4. Ninguém atendeu neste ciclo: agenda (sala de espera) e recomeça a fila até o prazo (12 h; 1 h se urgente).
  const baseMs = firstAttemptAtIso ? new Date(firstAttemptAtIso).getTime() : nowMs;
  const validBaseMs = Number.isFinite(baseMs) ? baseMs : nowMs;
  const deadlineMs = validBaseMs + (urgent ? config.urgentDeadlineMinutes : config.deadlineMinutes) * 60_000;
  const nextTryMs = nowMs + (urgent ? config.urgentRescheduleDelayMinutes : config.rescheduleDelayMinutes) * 60_000;
  if (nextTryMs < deadlineMs) {
    return {
      action: "reschedule",
      messageToPatient: patientRescheduleMessage(urgent),
      rescheduledForIso: new Date(nextTryMs).toISOString(),
      deadlineIso: new Date(deadlineMs).toISOString(),
      cycle: currentCycle,
    };
  }

  // 5. Prazo esgotado sem médico: Orientação Técnica gratuita com acesso do médico escolhido ao relatório.
  return {
    action: "forward_free_ot",
    messageToPatient: PATIENT_FREE_OT_NOTICE_MESSAGE,
    chosenDoctorId,
    cycle: currentCycle,
  };
}

/** Marcadores gravados nas notas da consulta pela fila. */
export const QUEUE_RESCHEDULE_MARKER = /\[FILA_REAGENDADA(?:_1H)?:([^\]]+)\]/g;
export const URGENT_MARKER = "[URGENTE]";

/** Ciclo atual = 1 + número de reagendamentos já feitos (formato novo e antigo). */
export function queueCycleFromNotes(notes: string | null | undefined): number {
  return 1 + (String(notes ?? "").match(QUEUE_RESCHEDULE_MARKER)?.length ?? 0);
}

export function isUrgentConsultation(notes: string | null | undefined): boolean {
  return String(notes ?? "").includes(URGENT_MARKER);
}

/** O paciente vê a sugestão de Orientação gratuita assim que o médico escolhido deixou de atender. */
export function shouldSuggestFreeOt(
  offers: Array<{ doctor_id: string | null; status: string | null }>,
  chosenDoctorId: string | null,
): boolean {
  return offers.some((o) => {
    const toChosen = chosenDoctorId !== null && o.doctor_id === chosenDoctorId;
    // O escolhido recusou/não respondeu, ou a fila já chamou outro médico.
    return toChosen ? o.status === "expired" || o.status === "declined" : true;
  });
}

/** Último horário de reinício gravado nas notas (para mostrar na sala de espera). */
export function lastRescheduleIso(notes: string | null | undefined): string | null {
  const all = [...String(notes ?? "").matchAll(QUEUE_RESCHEDULE_MARKER)];
  return all.length ? all[all.length - 1][1] : null;
}

/** WhatsApp ao paciente (sem dado de saúde): sala de espera e médico na sala. */
export function patientNoticeText(event: "waiting_room" | "doctor_joined", link: string, urgent: boolean): string {
  if (event === "doctor_joined") {
    return `🌿 Planta y Raiz: seu médico entrou na sala da consulta agora. Volte para a consulta por aqui: ${link}`;
  }
  return `🌿 Planta y Raiz: no momento todos os médicos estão em atendimento. Sua consulta está garantida e acontecerá em até ${
    urgent ? "1 hora" : "12 horas"
  }. Avisaremos por aqui quando o médico entrar. Acompanhe na sala de espera: ${link}`;
}
