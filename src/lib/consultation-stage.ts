/**
 * Etapa da consulta paga numa página única (mesmo padrão da Orientação Técnica).
 * Somente o estado gravado no servidor decide a etapa — nunca botões ou a URL de retorno.
 */
export type ConsultationStage = "payment" | "triage" | "room" | "rating" | "referral";

export interface ConsultationSnapshot {
  payment_status: string | null;
  status: string | null;
  notes: string | null;
  room_url: string | null;
}

const TRIAGE_LINK = /Triagem:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function hasLinkedTriage(notes: string | null | undefined): boolean {
  return TRIAGE_LINK.test(notes || "");
}

/** A avaliação só abre depois que o médico abriu a sala; ela libera 93% ao médico. */
export function canRateConsultation(appt: ConsultationSnapshot): boolean {
  return appt.payment_status === "paid" && Boolean(appt.room_url);
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

export function roomFromUrl(url: string): { domain: string; roomName: string } | null {
  try {
    const u = new URL(url);
    const roomName = u.pathname.replace(/^\/+/, "").split("/").pop() || "";
    if (!roomName) return null;
    return { domain: u.host, roomName };
  } catch {
    return null;
  }
}
