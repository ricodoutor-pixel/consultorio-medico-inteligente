import { describe, expect, it } from "vitest";
import { createOtStreamParser, canDownloadOtReport } from "../../supabase/functions/_shared/ot-stream";

describe("orientation conversation persistence", () => {
  it("retains responses split between network chunks", () => {
    const parse = createOtStreamParser();
    expect(parse('data: {"choices":[{"delta":{"content":"Olá').concat("")).toBe("");
    expect(parse(' Maria"}}]}\n\ndata: [DONE]\n')).toBe("Olá Maria");
  });
  it("surfaces a terminal error instead of an empty success", () => {
    expect(() => createOtStreamParser()('data: {"error":{"message":"failed"}}\n')).toThrow("interrompida");
  });
});

describe("report review", () => {
  it("requires approval or explicit educational release for PDF", () => {
    expect(canDownloadOtReport("draft")).toBe(false);
    expect(canDownloadOtReport("draft", true)).toBe(true);
    expect(canDownloadOtReport("rejected", true)).toBe(false);
    expect(canDownloadOtReport("rejected")).toBe(false);
    expect(canDownloadOtReport("approved")).toBe(true);
  });
});