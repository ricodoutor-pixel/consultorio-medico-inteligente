import { describe, expect, it, vi } from "vitest";
import { adminIdleState, completeLogout, isAccountStorageKey } from "./account-session";

describe("account security", () => {
  it("expires the administrator after 30 minutes", () => {
    expect(adminIdleState(0, 30 * 60 * 1000)).toBe("expired");
    expect(adminIdleState(0, 30 * 60 * 1000 - 1)).not.toBe("expired");
  });
  it("warns one minute before expiration", () => {
    expect(adminIdleState(0, 29 * 60 * 1000)).toBe("warning");
    expect(adminIdleState(0, 29 * 60 * 1000 - 1)).toBe("active");
  });
  it("does not clear or redirect when signout fails", async () => {
    const cleanup = vi.fn(); const redirect = vi.fn();
    await expect(completeLogout(async () => ({ error: { message: "offline" } }), cleanup, redirect)).rejects.toThrow("offline");
    expect(cleanup).not.toHaveBeenCalled(); expect(redirect).not.toHaveBeenCalled();
  });
  it("waits for successful signout and cleanup before redirecting", async () => {
    const events: string[] = [];
    await completeLogout(async () => { events.push("signout"); return { error: null }; }, async () => { events.push("cleanup"); }, () => events.push("redirect"));
    expect(events).toEqual(["signout", "cleanup", "redirect"]);
  });
  it("does not redirect before the signout response arrives", async () => {
    let finish: (value: { error: null }) => void = () => {};
    const response = new Promise<{ error: null }>(resolve => { finish = resolve; });
    const cleanup = vi.fn(async () => {}); const redirect = vi.fn();
    const operation = completeLogout(() => response, cleanup, redirect);
    expect(cleanup).not.toHaveBeenCalled(); expect(redirect).not.toHaveBeenCalled();
    finish({ error: null }); await operation;
    expect(redirect).toHaveBeenCalledOnce();
  });
  it("clears account tokens and patient drafts but preserves unrelated preferences", () => {
    expect(isAccountStorageKey("sb-example-auth-token")).toBe(true);
    expect(isAccountStorageKey("triage-progress")).toBe(true);
    expect(isAccountStorageKey("pr-locale")).toBe(false);
    expect(isAccountStorageKey("cookie-consent")).toBe(false);
  });
});