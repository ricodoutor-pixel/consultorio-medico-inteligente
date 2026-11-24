import { describe, expect, it } from "vitest";
import { classifyAccessError, withAccessTimeout } from "./auth-access-errors";

describe("access failure classification", () => {
  it("recognizes only an explicit invalid credential response", () => {
    expect(classifyAccessError({ status: 400, code: "invalid_credentials" }).code).toBe("invalid_credentials");
    expect(classifyAccessError({ status: 400, message: "unexpected error" }).code).toBe("unknown");
  });
  it.each([0, 402, 408, 500, 502, 503, 504])("never treats an unavailable status %s as a bad password", (status) => {
    expect(classifyAccessError({ status, code: "invalid_credentials" }).code).toBe("unavailable");
  });
  it("recognizes rejected network calls", () => {
    expect(classifyAccessError(new TypeError("Failed to fetch")).code).toBe("unavailable");
  });
  it("keeps unconfirmed email and rate limits distinct", () => {
    expect(classifyAccessError({ status: 400, code: "email_not_confirmed" }).code).toBe("email_not_confirmed");
    expect(classifyAccessError({ status: 429 }).code).toBe("rate_limited");
  });
  it("stops waiting for a hung access request", async () => {
    await expect(withAccessTimeout(new Promise(() => {}), 5)).rejects.toMatchObject({ status: 408 });
  });
});