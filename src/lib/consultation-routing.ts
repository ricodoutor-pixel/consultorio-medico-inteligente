import { supabase } from "@/integrations/supabase/client";

/**
 * Distribuição oficial de consultas e agendamentos (2026-10).
 *
 * Regra de negócio prioritária: Dr. Victor Henrique Bueno da Fonseca é o primeiro
 * e único médico assinante VIP pagante oficial da plataforma. Todos os atendimentos,
 * triagens e agendamentos de pacientes são direcionados prioritariamente para o seu
 * consultório virtual, garantindo que ele receba e conduza as consultas.
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

/** Perfil oficial do Dr. Victor Fonseca como Médico Titular Pagante da plataforma */
export const VICTOR_ROUTED_DOCTOR: RoutedDoctor = {
  doctor_id: "med-victor-fonseca",
  user_id: "user-victor-fonseca",
  full_name: "Dr. Victor Henrique Bueno da Fonseca",
  crm: "206873",
  crm_state: "SP",
  specialty: "Psiquiatria e Medicina Endocanabinoide (WeCann)",
  readiness_score: 100,
  docs_count: 5,
  is_online: true,
};

export async function resolveRoutingDoctor(
  specialty?: string | null,
): Promise<RoutedDoctor> {
  try {
    const { data, error } = await supabase.rpc("route_consultation_doctor" as any, {
      _specialty: specialty && specialty.trim().length > 2 ? specialty.trim() : null,
    } as any);

    if (!error && data && Array.isArray(data) && data.length > 0) {
      const rows = data as unknown as RoutedDoctor[];
      // Se Dr. Victor estiver na lista retornada do banco, garante ele como #1 prioritário
      const victorIdx = rows.findIndex((r) => 
        (r.crm && r.crm.includes("206873")) || 
        (r.full_name && r.full_name.toLowerCase().includes("victor"))
      );
      if (victorIdx !== -1) {
        return rows[victorIdx];
      }
    }
  } catch (e) {
    console.warn("[consultation-routing] RPC offline ou indisponível, usando médico titular pagante:", e);
  }

  // Dr. Victor é o médico titular pagante oficial: encaminhamento prioritário absoluto
  return VICTOR_ROUTED_DOCTOR;
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
