import { describe, expect, it } from "vitest";
import { ORIENTATION_PATH, orientationEntryUrl } from "./orientation-navigation";

describe("single technical orientation entry", () => {
  it("always directs new access to the current page", () => {
    expect(ORIENTATION_PATH).toBe("/orientacao-tecnica");
    expect(orientationEntryUrl()).toBe("/orientacao-tecnica");
  });

  it("preserves a paid order reference without implying approval", () => {
    const url = new URL(orientationEntryUrl("?ref=brisa-orientacao-paid-order&paid=1"), "https://www.plantayraiz.com.br");
    expect(url.pathname).toBe("/orientacao-tecnica");
    expect(url.searchParams.get("ref")).toBe("brisa-orientacao-paid-order");
    expect(url.searchParams.get("paid")).toBe("1");
  });

  it("preserves the old chat session for ownership-checked resumption", () => {
    const url = new URL(orientationEntryUrl("?sessionId=old&ref=existing-order", "existing-session"), "https://www.plantayraiz.com.br");
    expect(url.pathname).toBe("/orientacao-tecnica");
    expect(url.searchParams.getAll("sessionId")).toEqual(["existing-session"]);
    expect(url.searchParams.get("ref")).toBe("existing-order");
  });

  it("preserves referral attribution and navigation anchor", () => {
    const url = new URL(orientationEntryUrl("?referral=PRZ-123&origem=indicacao", undefined, "#atendimento"), "https://www.plantayraiz.com.br");
    expect(url.searchParams.get("referral")).toBe("PRZ-123");
    expect(url.searchParams.get("origem")).toBe("indicacao");
    expect(url.hash).toBe("#atendimento");
  });
});