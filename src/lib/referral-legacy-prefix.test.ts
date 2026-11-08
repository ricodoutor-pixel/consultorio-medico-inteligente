import { describe, it, expect } from "vitest";
import { stripReferralPrefix } from "@/hooks/useReferralTracking";

describe("legacy referral prefixes", () => {
  it("PRZ- links keep attributing to the same persisted code", () => {
    expect(stripReferralPrefix("PRZ-TZSUE")).toBe("TZSUE");
  });
  it("PLR- and PLANTA- prefixes map to the same code", () => {
    expect(stripReferralPrefix("PLR-TZSUE")).toBe("TZSUE");
    expect(stripReferralPrefix("PLANTA-TZSUE")).toBe("TZSUE");
  });
  it("codes without prefix stay untouched", () => {
    expect(stripReferralPrefix("TZSUE")).toBe("TZSUE");
  });
});
