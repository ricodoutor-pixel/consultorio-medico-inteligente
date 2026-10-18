import { supabase } from "@/integrations/supabase/client";

/**
 * Distribuição oficial de consultas e agendamentos (2026-10).
 *
 * O servidor escolhe um cadastro real; indisponibilidade nunca cria um médico fictício.
 */
export interface RoutedDoctor {
  doctor_id: string;
  user_id: string;
  full_name: string | null;
  crm: string | null;
  crm_state: string | null;
  specialty: string | null;
  readiness_score: number;
  docs_count: number;
  is_online: boolean | null;
}

export async function resolveRoutingDoctor(
  specialty?: string | null,
): Promise<RoutedDoctor | null> {
  try {
    const { data, error } = await supabase.rpc("route_consultation_doctor" as any, {
      _specialty: specialty && specialty.trim().length > 2 ? specialty.trim() : null,
    } as any);

    if (!error && data && Array.isArray(data) && data.length > 0) {
      const rows = data as unknown as RoutedDoctor[];
      return rows[0] ?? null;
    }
  } catch (e) {
    console.warn("[consultation-routing] encaminhamento indisponível:", e);
  }

  return null;
}

/** Avisa o profissional de plantão por e-mail e WhatsApp sobre o novo atendimento. */
export async function notifyRoutedDoctor(appointmentId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("consultation-notify-doctor", {
      body: { appointmentId },
    });
    if (error) throw error;
    return Boolean((data as any)?.ok);
  } catch (e) {
    console.error("[consultation-routing] falha ao notificar profissional:", e);
    return false;
  }
}
