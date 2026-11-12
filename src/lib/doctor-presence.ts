import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_QUEUE_ROUTING_CONFIG,
  evaluateDoctorPresence,
  isPresenceHeartbeatFresh,
  PATIENT_FREE_OT_NOTICE_MESSAGE,
  PATIENT_FREE_OT_SUGGESTION_MESSAGE,
  PATIENT_URGENCY_RESCHEDULE_MESSAGE,
  PRESENCE_HEARTBEAT_INTERVAL_MS,
  PRESENCE_TIMEOUT_MS,
  selectNextQueueStep,
  type DoctorPresenceInput,
  type DoctorPresenceState,
  type QueueCandidate,
  type QueueRoutingConfig,
  type QueueStepDecision,
} from "../../supabase/functions/_shared/consultation-queue";

export const DOCTOR_PRESENCE_HEARTBEAT_INTERVAL_MS = PRESENCE_HEARTBEAT_INTERVAL_MS;
export const DOCTOR_PRESENCE_STALE_TIMEOUT_MS = PRESENCE_TIMEOUT_MS;

export {
  DEFAULT_QUEUE_ROUTING_CONFIG,
  evaluateDoctorPresence,
  isPresenceHeartbeatFresh,
  PATIENT_FREE_OT_NOTICE_MESSAGE,
  PATIENT_FREE_OT_SUGGESTION_MESSAGE,
  PATIENT_URGENCY_RESCHEDULE_MESSAGE,
  PRESENCE_HEARTBEAT_INTERVAL_MS,
  PRESENCE_TIMEOUT_MS,
  selectNextQueueStep,
  type DoctorPresenceInput,
  type DoctorPresenceState,
  type QueueCandidate,
  type QueueRoutingConfig,
  type QueueStepDecision,
};

/**
 * Mascara a chave Pix cadastrada antes de exibir para confirmação de saque.
 */
export function maskPixKey(pixKey: string | null | undefined): string {
  const raw = String(pixKey ?? "").trim();
  if (!raw) return "Nenhuma chave cadastrada";
  if (raw.length >= 8) {
    return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
  }
  if (raw.length >= 4) {
    return `${raw.slice(0, 2)}****`;
  }
  return "****";
}

export interface HeartbeatParams {
  doctorId: string;
  userId: string;
  isOnline: boolean;
  event?: "enter" | "heartbeat" | "exit" | "doctor_presence_enter" | "doctor_presence_heartbeat" | "doctor_presence_exit";
}

/**
 * Envia o batimento de presença do médico autenticado na página Consultório Médico com o botão ON ativado.
 * Registra horário de entrada/batimento/saída.
 */
export async function sendDoctorPresenceHeartbeat(
  firstArg: HeartbeatParams | typeof supabase,
  secondArg?: HeartbeatParams,
): Promise<boolean> {
  const params: HeartbeatParams = (secondArg ?? firstArg) as HeartbeatParams;
  const { doctorId, userId, isOnline, event = "heartbeat" } = params;
  if (!doctorId || !userId) return false;
  const nowIso = new Date().toISOString();

  try {
    const updatePayload: Record<string, unknown> = {
      is_online: isOnline,
      is_available: isOnline,
      updated_at: nowIso,
    };
    if (isOnline) {
      updatePayload.last_seen_online = nowIso;
    }

    const { error } = await supabase
      .from("doctors")
      .update(updatePayload as never)
      .eq("id", doctorId);

    const isEnter = event === "enter" || event === "doctor_presence_enter";
    const isExit = event === "exit" || event === "doctor_presence_exit";
    if (isEnter || isExit) {
      try {
        await supabase.from("audit_log").insert({
          user_id: userId,
          action: isEnter ? "doctor_presence_enter" : "doctor_presence_exit",
          table_name: "doctors",
          record_id: doctorId,
          new_data: {
            doctor_id: doctorId,
            is_online: isOnline,
            timestamp: nowIso,
            source: "consultorio_medico",
          },
        } as never);
      } catch {
        /* best-effort audit */
      }
    }

    return !error;
  } catch {
    return false;
  }
}
