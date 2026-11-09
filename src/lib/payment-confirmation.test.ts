import { describe, expect, it } from "vitest";
import { isPaymentConfirmed, orientationPaymentConfirmed } from "./payment-confirmation";
import { confirmedProviderPayment } from "../../supabase/functions/_shared/payment-confirmation";

describe("aviso somente após pagamento real", () => {
  it("pagamento aprovado do titular confirma", () => {
    expect(confirmedProviderPayment({ status: "approved", metadata: { user_id: "owner" }, external_reference: "order-1" }, "owner", "order-1")).toBe(true);
  });
  it("pagamento pendente não confirma", () => {
    expect(confirmedProviderPayment({ status: "pending", metadata: { user_id: "owner" } }, "owner")).toBe(false);
    expect(isPaymentConfirmed("pending")).toBe(false);
  });
  it("pagamento de outro titular não confirma", () => {
    expect(confirmedProviderPayment({ status: "approved", metadata: { user_id: "other" } }, "owner")).toBe(false);
  });
  it("pagamento de outro pedido não confirma", () => {
    expect(confirmedProviderPayment({ status: "approved", metadata: { user_id: "owner" }, external_reference: "old-order" }, "owner", "new-order")).toBe(false);
  });
  it("retorno do checkout sem aprovação não confirma", () => {
    expect(isPaymentConfirmed({ paid: "1", status: "approved", session_id: "anything" })).toBe(false);
    expect(orientationPaymentConfirmed("awaiting_payment")).toBe(false);
    expect(orientationPaymentConfirmed("none")).toBe(false);
  });
  it("retomada da triagem paga permite continuação", () => {
    expect(orientationPaymentConfirmed("triage")).toBe(true);
    expect(orientationPaymentConfirmed("ready")).toBe(true);
  });
  it("sala expirada ou encerrada não permite continuação", () => {
    expect(orientationPaymentConfirmed("expired")).toBe(false);
    expect(orientationPaymentConfirmed("completed")).toBe(false);
  });
  it("falha ou estado ausente não confirma", () => {
    expect(isPaymentConfirmed(undefined)).toBe(false);
    expect(isPaymentConfirmed("error")).toBe(false);
    expect(confirmedProviderPayment({ status: "approved" }, "owner")).toBe(false);
  });
});