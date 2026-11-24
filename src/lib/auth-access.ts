import { supabase } from "@/integrations/supabase/client";
import { classifyAccessError, PASSWORD_RESET_REDIRECT, withAccessTimeout, type AccessPortal } from "./auth-access-errors";

export function reportAccessError(error: unknown, portal: AccessPortal, operation: "login" | "recovery" | "update_password" = "login"): string {
  const diagnostic = classifyAccessError(error);
  // Do not persist raw errors, addresses, identifiers, passwords or tokens.
  void supabase.rpc("record_auth_error", {
    p_user_type: portal, p_error_code: diagnostic.code,
    p_http_status: diagnostic.status ?? 0, p_operation: operation,
  }).then(({ error: logError }) => {
    if (logError) console.warn("[access-diagnostic] unavailable");
  }, () => console.warn("[access-diagnostic] unavailable"));
  return diagnostic.message;
}

export async function requestPasswordReset(email: string, portal: AccessPortal) {
  try {
    const { error } = await withAccessTimeout(supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: PASSWORD_RESET_REDIRECT,
    }));
    if (error) reportAccessError(error, portal, "recovery");
  } catch (error) { reportAccessError(error, portal, "recovery"); }
  // Same response for registered, unknown, and rejected addresses to avoid account enumeration.
}