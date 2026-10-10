import { describe, expect, it, vi, beforeEach } from "vitest";
import { fixedConsultationPrice } from "../../supabase/functions/_shared/consultation-price";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  rpc: vi.fn(),
  invoke: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getSession: mocks.session }, rpc: mocks.rpc, functions: { invoke: mocks.invoke }, from: mocks.from,
} }));
import { resolveRoutingDoctor } from "./consultation-routing";
import { isConsultationPaid, createConsultationCheckout } from "./telemedicine-checkout";

describe("real consultation rules", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ data: { session: { user: { id: "patient-id" } } } });
  });
  it("video costs R$150 on the server", () => expect(fixedConsultationPrice("video")).toBe(150));
  it("chat costs R$100 on the server", () => expect(fixedConsultationPrice("chat")).toBe(100));
  it("uses the real top-ranked doctor even when not Victor", async () => {
    const doctor = { doctor_id: "31613ce7-6116-4eee-9d58-3c699282b670", full_name: "Another doctor" };
    mocks.rpc.mockResolvedValue({ data: [doctor], error: null });
    expect(await resolveRoutingDoctor()).toEqual(doctor);
  });
  it("does not invent a doctor on routing failure", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("offline") });
    expect(await resolveRoutingDoctor()).toBeNull();
  });
  it("pending payment does not unlock consultation", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { payment_status: "pending" }, error: null }) };
    mocks.from.mockReturnValue(query);
    expect(await isConsultationPaid("appointment-id")).toBe(false);
    expect(query.eq).toHaveBeenCalledWith("patient_id", "patient-id");
  });
  it("only a paid appointment unlocks consultation", async () => {
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { payment_status: "paid" }, error: null }) });
    expect(await isConsultationPaid("appointment-id")).toBe(true);
  });
  it("payment errors stay errors rather than claiming payment", async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new Error("gateway failed") });
    await expect(createConsultationCheckout("video", "triage-id", "appointment-id")).rejects.toThrow("Não foi possível gerar o pagamento");
    expect(mocks.invoke).toHaveBeenCalledWith("mp-checkout", expect.objectContaining({ body: expect.objectContaining({ appointmentId: "appointment-id", sku: "consulta_video" }) }));
  });
});