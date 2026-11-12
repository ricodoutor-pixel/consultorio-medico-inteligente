import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { isValidMetaSignature } from "../../supabase/functions/_shared/meta-signature";

const SECRET = "test-only-secret";
const body = JSON.stringify({ entry: [{ messaging: [{ sender: { id: "1" }, message: { text: "oi" } }] }] });
const sign = (raw: string, secret = SECRET) => "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");

describe("Meta webhook signature", () => {
  it("accepts a payload signed with the app secret", async () => {
    expect(await isValidMetaSignature(body, sign(body), SECRET)).toBe(true);
  });
  it("rejects a tampered payload", async () => {
    expect(await isValidMetaSignature(body + " ", sign(body), SECRET)).toBe(false);
  });
  it("rejects a signature made with another secret", async () => {
    expect(await isValidMetaSignature(body, sign(body, "other"), SECRET)).toBe(false);
  });
  it("rejects missing header and fails closed without a configured secret", async () => {
    expect(await isValidMetaSignature(body, null, SECRET)).toBe(false);
    expect(await isValidMetaSignature(body, sign(body), "")).toBe(false);
  });
});
