export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ADMIN_IDLE_WARNING_MS = 60 * 1000;

export function adminIdleState(lastActivity: number, now: number) {
  const remaining = ADMIN_IDLE_TIMEOUT_MS - (now - lastActivity);
  return remaining <= 0 ? "expired" : remaining <= ADMIN_IDLE_WARNING_MS ? "warning" : "active";
}

export function isAccountStorageKey(key: string) {
  return /^sb-.*-auth-token(?:\.\d+|-[\w-]+)?$/.test(key) ||
    /^(auth-preferences|cart-storage|triage-progress|telemedicine_pending_checkout)$/.test(key) ||
    /^(ot[_-]|triage[_-]|brisa[_-].*(session|history)|user[_-]|admin[_-]|profile[_-])/.test(key);
}

export async function completeLogout(
  signOut: () => Promise<{ error: { message: string } | null }>,
  cleanup: () => Promise<void>,
  redirect: () => void,
) {
  const result = await signOut();
  if (result.error) throw new Error(result.error.message);
  await cleanup();
  redirect();
}