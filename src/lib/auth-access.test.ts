import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, reset } = vi.hoisted(() => ({
  rpc: vi.fn().mockResolvedValue({ error: null }),
  reset: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc, auth: { resetPasswordForEmail: reset } } }));
import { reportAccessError, requestPasswordReset } from "./auth-access";

beforeEach(() => { vi.clearAllMocks(); });
describe("minimal access diagnostics", () => {
  it("records only portal, operation, safe code and status, never secrets or raw messages", () => {
    reportAccessError({ code: "invalid_credentials", status: 400, message: "private-error", password: "never-log", email: "private@example.invalid" }, "medico");
    expect(rpc).toHaveBeenCalledWith("record_auth_error", {
      p_user_type: "medico", p_error_code: "invalid_credentials", p_http_status: 400, p_operation: "login",
    });
  });
  it("uses the requested canonical reset destination and normalizes email", async () => {
    await requestPasswordReset(" TEST@EXAMPLE.INVALID ", "medico");
    expect(reset).toHaveBeenCalledWith("test@example.invalid", { redirectTo: "https://plantayraiz.com.br/redefinir-senha" });
  });
  it("never leaks registered-account status when recovery is rejected", async () => {
    reset.mockResolvedValueOnce({ error: { status: 503, message: "private-error" } });
    await expect(requestPasswordReset("test@example.invalid", "paciente")).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("record_auth_error", {
      p_user_type: "paciente", p_error_code: "unavailable", p_http_status: 503, p_operation: "recovery",
    });
  });
});