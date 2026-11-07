import { describe, it, expect, vi } from "vitest";
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
import { loadPermanentReferralCode } from "./referral-code";

describe("permanent referral code", () => {
  it("three reloads reuse only the server-persisted code", async () => {
    rpc.mockResolvedValue({ data: "PRZ-TZSUE", error: null });
    for (let i = 0; i < 3; i++) expect(await loadPermanentReferralCode("account-1")).toBe("PRZ-TZSUE");
    expect(rpc).toHaveBeenCalledWith("ensure_referral_code", { _user_id: "account-1" });
  });
  it("failed persistence never produces a fabricated link", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(loadPermanentReferralCode("account-1")).rejects.toThrow();
  });
});