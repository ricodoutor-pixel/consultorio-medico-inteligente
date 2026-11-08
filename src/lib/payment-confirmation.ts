export function isPaymentConfirmed(status: unknown): boolean {
  return status === "approved" || status === "paid";
}

export function orientationPaymentConfirmed(state: unknown): boolean {
  return state === "triage" || state === "ready" || state === "active" || state === "paused";
}