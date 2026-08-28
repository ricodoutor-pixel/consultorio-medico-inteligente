import { supabase } from "@/integrations/supabase/client";

/**
 * Lista oficial de contas de Administrador Geral / Super Admin da Planta y Raíz.
 * Estas contas possuem autorização administrativa mestre RBAC em toda a plataforma.
 */
export const MASTER_ADMIN_EMAILS = [
  "contato@plantayraiz.com.br",
  "contatoplantaeraiz@gmail.com",
  "admin@plantayraiz.com.br",
  "ricodoutor@gmail.com",
  "dredilsonbezerra@gmail.com",
];

export function isMasterAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return MASTER_ADMIN_EMAILS.includes(clean);
}

/**
 * Valida a permissão de administrador via banco de dados (tabela user_roles)
 * com auto-recuperação transparente (auto-healing) para as contas mestre.
 */
export async function verifyAndEnsureAdmin(user: { id: string; email?: string | null }): Promise<boolean> {
  if (isMasterAdminEmail(user.email)) {
    try {
      await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin" });
    } catch {
      // non-blocking
    }
    return true;
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return !!role;
}
