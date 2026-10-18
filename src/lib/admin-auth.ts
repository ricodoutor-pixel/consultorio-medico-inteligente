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
 * Valida a permissão de administrador EXCLUSIVAMENTE via banco (user_roles + RLS).
 * Nunca concede papel a partir do navegador nem por e-mail.
 */
export async function verifyAndEnsureAdmin(user: { id: string; email?: string | null }): Promise<boolean> {


  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return !!role;
}
