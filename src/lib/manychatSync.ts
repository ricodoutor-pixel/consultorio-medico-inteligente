/**
 * ManyChat sync — disabled.
 *
 * ManyChat foi removido. Estas funções são no-ops mantidas para preservar
 * imports existentes em hooks e páginas (TriageStore, Checkout, etc.).
 */

type LeadEventType =
  | "payment_abandoned"
  | "triage_completed"
  | "appointment_booked"
  | "appointment_completed"
  | "prescription_ready";

export async function syncLeadEvent(
  _eventType: LeadEventType,
  _userId?: string,
  _metadata?: Record<string, string>,
) {
  return null;
}

export const syncPaymentAbandoned = (userId: string, consultationValue?: string) =>
  syncLeadEvent("payment_abandoned", userId, { valor_consulta: consultationValue || "" });

export const syncTriageCompleted = (userId: string, specialty?: string) =>
  syncLeadEvent("triage_completed", userId, { especialidade: specialty || "" });

export const syncAppointmentBooked = (userId: string, doctorName?: string) =>
  syncLeadEvent("appointment_booked", userId, { medico: doctorName || "" });

export const syncAppointmentCompleted = (userId: string) =>
  syncLeadEvent("appointment_completed", userId);

export const syncPrescriptionReady = (userId: string) =>
  syncLeadEvent("prescription_ready", userId);
