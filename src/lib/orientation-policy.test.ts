import { describe, expect, it } from "vitest";
import { canReadEducationalReport, orientationTimeStage, REPORT_WAIT_LIMIT_MS } from "../../supabase/functions/_shared/orientation-policy";
describe("orientation v3 rules", () => {
  it("releases only explicitly delivered educational drafts", () => {
    expect(canReadEducationalReport("draft", true)).toBe(true);
    expect(canReadEducationalReport("draft", false)).toBe(false);
    expect(canReadEducationalReport("rejected", true)).toBe(false);
  });
  it("does not close at 24 minutes or exactly five minutes", () => {
    expect(orientationTimeStage(24 * 60)).toBe("conversation");
    expect(orientationTimeStage(300)).toBe("conversation");
    expect(orientationTimeStage(299)).toBe("closing");
  });
  it("bounds visible waiting at sixty seconds", () => expect(REPORT_WAIT_LIMIT_MS).toBe(60_000));
});