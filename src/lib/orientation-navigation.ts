export const ORIENTATION_PATH = "/orientacao-tecnica";

/** Keep payment, referral and resume context when retiring old entry URLs. */
export function orientationEntryUrl(search = "", sessionId?: string, hash = "") {
  const params = new URLSearchParams(search);
  if (sessionId) params.set("sessionId", sessionId);
  const query = params.toString();
  return `${ORIENTATION_PATH}${query ? `?${query}` : ""}${hash}`;
}