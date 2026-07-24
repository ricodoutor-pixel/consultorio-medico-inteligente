import { supabase } from "@/integrations/supabase/client";

export interface AuditLogParams {
  actor_id?: string | null;
  actor_role?: "professional" | "admin" | "patient" | string;
  resource_table: "appointments" | "prescriptions" | "medical_records" | "tcle_consents" | string;
  resource_id?: string | null;
  action: "select" | "insert" | "update" | "delete" | string;
  metadata?: Record<string, any>;
}

/**
 * Insere um registro de auditoria de acesso na tabela `access_audit_log`.
 * A chamada é estritamente best-effort em bloco try/catch para nunca interromper a UX.
 */
export async function logAccessAudit(params: AuditLogParams): Promise<void> {
  try {
    const {
      actor_id,
      actor_role = "professional",
      resource_table,
      resource_id,
      action,
      metadata = {},
    } = params;

    let finalActorId = actor_id;
    if (!finalActorId) {
      const { data: sessionData } = await supabase.auth.getSession();
      finalActorId = sessionData?.session?.user?.id || null;
    }

    if (!finalActorId) return;

    await (supabase as any).from("access_audit_log").insert({
      actor_id: finalActorId,
      actor_role,
      resource_table,
      resource_id: resource_id || null,
      action,
      metadata,
    });
  } catch (err) {
    // Audit log é silencioso para não impactar o fluxo principal do usuário
    console.warn("[auditLogger] Falha ao registrar log de acesso:", err);
  }
}
