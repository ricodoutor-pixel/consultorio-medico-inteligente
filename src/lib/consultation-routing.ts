import { supabase } from "@/integrations/supabase/client";

/**
 * Distribuição oficial de consultas e agendamentos (2026-09).
 *
 * Regra de negócio: todo atendimento é direcionado ao profissional com o
 * cadastro mais completo (documentos anexados no KYC, assinatura digital,
 * chave Pix, verificação, conta de recebimento e disponibilidade), qualquer
 * que seja o profissional escolhido pelo paciente na vitrine.
 *
 * O cálculo acontece 100% no servidor (RPC `route_consultation_doctor`), então
 * conforme outro profissional completa o cadastro ele passa a receber
 * atendimentos automaticamente — sem alteração de código.
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
  const { data, error } = await supabase.rpc("route_consultation_doctor" as any, {
    _specialty: specialty && specialty.trim().length > 2 ? specialty.trim() : null,
  } as any);

  if (error) {
    console.error("[consultation-routing] falha ao resolver plantão:", error.message);
    return null;
  }
  const rows = (data ?? []) as unknown as RoutedDoctor[];
  return rows.length > 0 ? rows[0] : null;
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
