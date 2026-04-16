/**
 * 🛒 Marketplace Engine — Helpers para sincronizar status de pagamento com ManyChat
 * 
 * Funções utilitárias para disparar eventos de sincronização do ManyChat 
 * em pontos críticos do fluxo do usuário.
 */

import { supabase } from "@/integrations/supabase/client";

type LeadEventType = 
  | "payment_abandoned"
  | "triage_completed"
  | "appointment_booked"
  | "appointment_completed"
  | "prescription_ready";

export async function syncLeadEvent(
  eventType: LeadEventType,
  userId?: string,
  metadata?: Record<string, string>
) {
  try {
    const { data, error } = await supabase.functions.invoke("manychat-lead-sync", {
      body: {
        event_type: eventType,
        user_id: userId,
        metadata,
      },
    });

    if (error) {
      console.warn(`[ManyChat Sync] Failed to sync ${eventType}:`, error);
      return null;
    }

    // Sync successful
    return data;
  } catch (err) {
    console.warn("[ManyChat Sync] Error:", err);
    return null;
  }
}

/**
 * Dispara quando paciente abandona pagamento
 */
export const syncPaymentAbandoned = (userId: string, consultationValue?: string) =>
  syncLeadEvent("payment_abandoned", userId, { valor_consulta: consultationValue || "" });

/**
 * Dispara quando triagem é finalizada
 */
export const syncTriageCompleted = (userId: string, specialty?: string) =>
  syncLeadEvent("triage_completed", userId, { especialidade: specialty || "" });

/**
 * Dispara quando consulta é agendada
 */
export const syncAppointmentBooked = (userId: string, doctorName?: string) =>
  syncLeadEvent("appointment_booked", userId, { medico: doctorName || "" });

/**
 * Dispara quando consulta é finalizada
 */
export const syncAppointmentCompleted = (userId: string) =>
  syncLeadEvent("appointment_completed", userId);

/**
 * Dispara quando receita está pronta
 */
export const syncPrescriptionReady = (userId: string) =>
  syncLeadEvent("prescription_ready", userId);
