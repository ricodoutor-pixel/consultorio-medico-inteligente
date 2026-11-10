import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  expectedConsultationPrice,
  fixedConsultationPrice,
  validateConsultationPaymentGuard,
} from "../../supabase/functions/_shared/consultation-price";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  rpc: vi.fn(),
  invoke: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: mocks.session },
    rpc: mocks.rpc,
    functions: { invoke: mocks.invoke },
    from: mocks.from,
  },
}));
import { resolveRoutingDoctor } from "./consultation-routing";
import { isConsultationPaid, createConsultationCheckout } from "./telemedicine-checkout";

describe("real consultation rules — Etapa A (pagamento padronizado)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("window", { location: { origin: "http://localhost:8080" } });
    mocks.session.mockResolvedValue({ data: { session: { user: { id: "patient-id" } } } });
  });

  it("fixed consultation prices come from single table: video R$150, chat R$100, retorno R$90, premium R$180", () => {
    expect(fixedConsultationPrice("video")).toBe(150);
    expect(fixedConsultationPrice("chat")).toBe(100);
    expect(fixedConsultationPrice("retorno")).toBe(90);
    expect(expectedConsultationPrice("consulta_premium")).toBe(180);
    expect(expectedConsultationPrice("consulta_premium", 220)).toBe(220);
  });

  it("generates in-platform Pix (without paying or leaving site) for chat (100), video (150), retorno (90) and premium (180) without notifying any doctor", async () => {
    const doctorUuid = "31613ce7-6116-4eee-9d58-3c699282b670";
    const cases = [
      { sku: "consulta_chat" as const, expectedAmount: 100, expectedDesc: "Consulta por Chat — Planta y Raiz" },
      { sku: "consulta_video" as const, expectedAmount: 150, expectedDesc: "Consulta por Vídeo — Planta y Raiz" },
      { sku: "retorno_consulta" as const, expectedAmount: 90, expectedDesc: "Retorno — Planta y Raiz" },
      { sku: "consulta_premium" as const, expectedAmount: 180, expectedDesc: "Consulta Premium — Planta y Raiz" },
    ];

    for (const c of cases) {
      mocks.invoke.mockReset();
      mocks.from.mockReset();

      const insertSingle = vi.fn().mockResolvedValue({ data: { id: `appt-${c.sku}` }, error: null });
      mocks.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertSingle }) }),
      });
      mocks.invoke.mockResolvedValue({
        data: {
          qr_code: `000201PIX_${c.sku}`,
          qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAAUA",
          description: c.expectedDesc,
          amount: c.expectedAmount,
          receiver_name: "Doutor Rico Ltda", // deve ser normalizado para Planta y Raiz Ltda
        },
        error: null,
      });

      const res = await createConsultationCheckout(c.sku, "", null, doctorUuid);
      expect(res.initPoint).toBeNull();
      expect(res.pix.qr_code).toBe(`000201PIX_${c.sku}`);
      expect(res.pix.amount).toBe(c.expectedAmount);
      expect(res.pix.description).toBe(c.expectedDesc);
      expect(res.pix.receiver_name).toBe("Planta y Raiz Ltda");

      // Garante que apenas mp-checkout foi chamado (nenhum médico é avisado na criação do pedido)
      expect(mocks.invoke).toHaveBeenCalledTimes(1);
      expect(mocks.invoke).toHaveBeenCalledWith(
        "mp-checkout",
        expect.objectContaining({
          body: expect.objectContaining({
            appointmentId: `appt-${c.sku}`,
            sku: c.sku,
            payment_method: "pix",
          }),
        }),
      );
    }
  });

  it("blocks duplicate payment, wrong doctor, and price different from official table", async () => {
    // 1. Pagamento duplicado
    const dup = validateConsultationPaymentGuard({
      paymentStatus: "paid",
      appointmentStatus: "scheduled",
      expectedAmount: 150,
    });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.reason).toBe("duplicate_payment");

    // 2. Médico errado
    const wrongDoc = validateConsultationPaymentGuard({
      paymentStatus: "pending",
      appointmentDoctorId: "31613ce7-6116-4eee-9d58-3c699282b670",
      requestedDoctorId: "99999999-6116-4eee-9d58-3c699282b670",
      expectedAmount: 150,
    });
    expect(wrongDoc.ok).toBe(false);
    if (!wrongDoc.ok) expect(wrongDoc.reason).toBe("wrong_doctor");

    // 3. Valor diferente da tabela
    const badPrice = validateConsultationPaymentGuard({
      paymentStatus: "pending",
      requestedAmount: 50,
      expectedAmount: 150,
    });
    expect(badPrice.ok).toBe(false);
    if (!badPrice.ok) expect(badPrice.reason).toBe("price_mismatch");

    await expect(
      createConsultationCheckout("consulta_video", "", null, "31613ce7-6116-4eee-9d58-3c699282b670", {
        requestedAmount: 50,
      }),
    ).rejects.toThrow(/Valor divergente/);
  });

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
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    mocks.invoke.mockResolvedValue({ data: null, error: new Error("gateway failed") });
    await expect(createConsultationCheckout("video", "triage-id", "appointment-id")).rejects.toThrow("Não foi possível gerar o Pix");
    expect(mocks.invoke).toHaveBeenCalledWith("mp-checkout", expect.objectContaining({ body: expect.objectContaining({ appointmentId: "appointment-id", sku: "consulta_video" }) }));
  });
});