import { describe, it, expect } from "vitest";
import { decidePixReuse } from "../../supabase/functions/_shared/pix-reuse";
const now = Date.parse("2026-11-25T16:00:00Z");
const iso = (ms: number) => new Date(now + ms).toISOString();
describe("reaproveitamento de Pix", () => {
  it("reaproveita pending recente com vencimento > 10 min", () => {
    expect(decidePixReuse({ status: "pending", date_of_expiration: iso(20 * 60_000) }, iso(-5 * 60_000), now)).toBe("reuse");
  });
  it("não reaproveita Pix cancelado/vencido", () => {
    expect(decidePixReuse({ status: "cancelled", date_of_expiration: iso(-1) }, iso(-60_000), now)).toBe("dead");
  });
  it("não reaproveita com menos de 10 min de folga", () => {
    expect(decidePixReuse({ status: "pending", date_of_expiration: iso(9 * 60_000) }, iso(-60_000), now)).toBe("dead");
  });
  it("não reaproveita Pix com mais de 30 min", () => {
    expect(decidePixReuse({ status: "pending", date_of_expiration: iso(60 * 60_000) }, iso(-31 * 60_000), now)).toBe("dead");
  });
});
