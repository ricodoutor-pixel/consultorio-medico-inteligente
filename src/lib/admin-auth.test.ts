import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), maybeSingle: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: mocks.getUser },
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }) }),
} }));
import { verifyAndEnsureAdmin } from "./admin-auth";
describe("server administrator role", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null }); });
  it("does not authorize a master email without a server admin role", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await verifyAndEnsureAdmin({ id: "u1", email: "contato@plantayraiz.com.br" })).toBe(false);
  });
  it("authorizes the verified user with a server admin role", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    expect(await verifyAndEnsureAdmin({ id: "u1" })).toBe(true);
  });
  it("rejects another user identity before querying roles", async () => {
    expect(await verifyAndEnsureAdmin({ id: "u2" })).toBe(false);
    expect(mocks.maybeSingle).not.toHaveBeenCalled();
  });
});