/**
 * Guard global de alertas ao Dr. Edilson.
 *
 * Política vigente (até segunda ordem, definida pelo Dr. Edilson):
 *   APENAS alertas de novos cadastros são enviados ao WhatsApp pessoal dele.
 *   Todos os outros (sentinel, growth, weekly-audit, fuzzy-triage, crisis,
 *   channels-status, retention, meta-messenger, mp-health, pool-sanitizer,
 *   prescription-hash-audit, infra-expiry, mercadopago-webhook, brisa-ai
 *   heartbeat, etc.) ficam SILENCIADOS no canal pessoal.
 *
 * Para reativar: definir secret `ADMIN_ALERTS_SIGNUP_ONLY=false` (ou remover).
 * Default = silenciado (signup-only) para evitar spam ao Dr. Edilson.
 */
export function adminAlertsSignupOnly(): boolean {
  const v = (Deno.env.get("ADMIN_ALERTS_SIGNUP_ONLY") ?? "true").toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Retorna `true` se o alerta deve ser ENGOLIDO (não enviado ao admin). */
export function shouldSilenceAdminAlert(source: string): boolean {
  if (!adminAlertsSignupOnly()) return false;
  // Única exceção: o próprio fluxo de signup-alert
  if (source === "brisa-signup-alert") return false;
  console.log(`[admin-alert-guard] Silenciado (signup-only): source=${source}`);
  return true;
}
