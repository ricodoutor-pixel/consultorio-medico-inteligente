import { describe, expect, it, vi } from "vitest";
import { deliverNotice } from "../../supabase/functions/_shared/notice-delivery";

function store(failIntent = false) {
  const log = { status: "pending", delivery_status: "", attempts: 0 };
  const updates: Array<Record<string, unknown>> = [];
  const attempts: Array<Record<string, unknown>> = [];
  return { log, updates, attempts, sb: { from(table: string) {
    return {
      insert(row: Record<string, unknown>) { attempts.push(row); return { select: () => ({ maybeSingle: async () => failIntent ? { error: {} } : { data: { id: String(attempts.length) } } }) }; },
      update(row: Record<string, unknown>) {
        const chain = { eq() { return chain; }, then(resolve: (value: unknown) => unknown) {
          if (table === "payment_notify_log") { Object.assign(log, row); updates.push(row); }
          return Promise.resolve({ error: null }).then(resolve);
        } };
        return chain;
      },
    };
  } } };
}

describe("one provider acceptance per notice", () => {
  it("keeps the claim pending throughout a rejected attempt and concurrent retry opportunity", async () => {
    const state = store();
    const send = vi.fn().mockResolvedValueOnce({ ok: false, http: 429, error: "provider_http_429", ms: 1 }).mockResolvedValueOnce({ ok: true, http: 200, error: null, ms: 1, messageId: "accepted-id" });
    const wait = async () => { expect(state.log.status).toBe("pending"); };
    expect(await deliverNotice(state.sb, "log", "text", "order:inicio", "auto", 0, send, wait)).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
    expect(state.updates.map(row => row.status)).toEqual(["pending", "sent"]);
    expect(state.log.delivery_status).toBe("accepted");
  });
  it.each([null, 500, 502, 504])("never resends an uncertain outcome %s", async http => {
    const state = store();
    const send = vi.fn().mockResolvedValue({ ok: false, http, error: "timeout_or_server_error", ms: 1 });
    expect(await deliverNotice(state.sb, "log", "text", "order", "auto", 0, send)).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
    expect(state.log.status).toBe("pending");
    expect(state.log.delivery_status).toBe("unknown");
  });
  it("stops before sending if intent storage fails", async () => {
    const state = store(true);
    const send = vi.fn();
    expect(await deliverNotice(state.sb, "log", "text", "order", "auto", 0, send)).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
  it("allows recovery only after explicit rejection, not during a retry", async () => {
    const state = store();
    const send = vi.fn().mockResolvedValue({ ok: false, http: 401, error: "provider_http_401", ms: 1 });
    await deliverNotice(state.sb, "log", "text", "order:fim", "auto", 0, send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(state.log.status).toBe("failed");
  });
  it("records intent before provider acceptance and never retries success", async () => {
    const state = store();
    const send = vi.fn(async () => {
      expect(state.attempts).toHaveLength(1);
      return { ok: true, http: 200, error: null, ms: 1, messageId: "only-one" };
    });
    await deliverNotice(state.sb, "log", "text", "order", "auto", 0, send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(state.log.status).toBe("sent");
  });
});