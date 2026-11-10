/**
 * Etapa da consulta paga numa página única (mesmo padrão da Orientação Técnica).
 * Somente o estado gravado no servidor decide a etapa — nunca botões ou a URL de retorno.
 */
export type ConsultationStage = "payment" | "triage" | "room" | "rating" | "referral";

export interface ConsultationSnapshot {
  payment_status: string | null;
  status: string | null;
  notes: string | null;
}

const TRIAGE_LINK = /Triagem:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function hasLinkedTriage(notes: string | null | undefined): boolean {
  return TRIAGE_LINK.test(notes || "");
}

/** O médico abriu a consulta no Consultório (status gravado pelo próprio médico). */
export function doctorJoined(appt: ConsultationSnapshot): boolean {
  return appt.status === "in_progress" || appt.status === "completed";
}

/** A avaliação só abre depois que o médico entrou; ela libera 93% ao médico. */
export function canRateConsultation(appt: ConsultationSnapshot): boolean {
  return appt.payment_status === "paid" && doctorJoined(appt);
}

export function consultationStage(appt: ConsultationSnapshot | null, rated: boolean, patientEnded = false): ConsultationStage {
  if (!appt || appt.payment_status !== "paid") return "payment";
  if (!hasLinkedTriage(appt.notes)) return "triage";
  if (rated) return "referral";
  const ended = appt.status === "completed" || patientEnded;
  if (ended && canRateConsultation(appt)) return "rating";
  return "room";
}

/** Carinhas de avaliação (1 = ruim, 2 = regular, 3 = ótima) gravadas como nota 0–10. */
export function faceToScore(face: 1 | 2 | 3): number {
  return face === 3 ? 10 : face === 2 ? 7 : 3;
}

/** Mesma sala Jitsi que o médico abre no Consultório para esta consulta. */
export function consultationRoomName(appointmentId: string): string {
  return `plantayraiz-consultorio-${appointmentId}`;
}
