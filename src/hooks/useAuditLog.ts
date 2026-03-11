import { supabase } from "@/integrations/supabase/client";

export const useAuditLog = () => {
  const log = async (action: string, tableName: string, recordId: string, oldData?: any, newData?: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from("audit_log").insert({
        user_id: session.user.id,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData ?? null,
        new_data: newData ?? null,
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  return { log };
};
