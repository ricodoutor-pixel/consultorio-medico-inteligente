type Store = { from(table: string): any };
export type SendResult = { ok: boolean; http: number | null; error: string | null; ms: number; messageId?: string | null };

/** Keep the event claimed throughout retries. Unknown outcomes never authorize resend. */
export async function deliverNotice(sb: Store, logId: string, text: string, logKey: string, trigger: string, startNo: number, send: (text: string) => Promise<SendResult>, wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))): Promise<boolean> {
  for (let i = 0; i < 3; i++) {
    const n = startNo + i + 1;
    // Durable intent BEFORE contacting the provider: storage failure stops sends.
    const { data: attempt, error: intentError } = await sb.from("payment_notify_attempts").insert({
      log_id: logId, external_reference: logKey, attempt_no: n, trigger,
      status: "failed", error: "outcome_pending",
    }).select("id").maybeSingle();
    if (intentError || !attempt) return false;
    let result: SendResult;
    try { result = await send(text); }
    catch { result = { ok: false, http: null, error: "provider_outcome_unknown", ms: 0 }; }
    const definitelyNotSent = !result.ok && (
      result.error?.startsWith("evolution_not_configured") ||
      (result.http !== null && result.http >= 400 && result.http < 500)
    );
    const uncertain = !result.ok && !definitelyNotSent;
    const retry = definitelyNotSent && result.http === 429 && i < 2;
    const { error: attemptError } = await sb.from("payment_notify_attempts").update({
      status: result.ok ? "sent" : "failed", http_status: result.http,
      error: uncertain ? "provider_outcome_unknown" : result.error,
      duration_ms: result.ms, provider_message_id: result.messageId ?? null,
    }).eq("id", attempt.id);
    const { error: logError } = await sb.from("payment_notify_log").update({
      // NEVER publish failed while this worker still intends to retry.
      status: result.ok ? "sent" : uncertain || retry ? "pending" : "failed",
      error: uncertain ? "provider_outcome_unknown" : result.error,
      http_status: result.http, attempts: n, last_attempt_at: new Date().toISOString(),
      sent_at: result.ok ? new Date().toISOString() : null,
      provider_message_id: result.messageId ?? null,
      delivery_status: result.ok ? "accepted" : uncertain ? "unknown" : "failed",
    }).eq("id", logId).eq("status", "pending");
    if (result.ok) return true; // Provider acceptance is not handset delivery.
    if (uncertain || attemptError || logError || !retry) return false;
    await wait(1500 * (i + 1));
  }
  return false;
}