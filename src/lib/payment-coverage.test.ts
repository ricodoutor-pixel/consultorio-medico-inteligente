import { describe, expect, it } from "vitest";
import { paymentCoversConsultation, expectedConsultationPrice } from "../../supabase/functions/_shared/consultation-price";

describe("Webhook: pagamento só libera consulta quando cobre o preço oficial", () => {
  it("pagamento de centavos nunca libera consulta", () => {
    expect(paymentCoversConsultation(1).ok).toBe(false);
    expect(paymentCoversConsultation(0).ok).toBe(false);
    expect(paymentCoversConsultation(null).ok).toBe(false);
    expect(paymentCoversConsultation(30).ok).toBe(false); // valor da Orientação não libera consulta
  });

  it("valores oficiais de consulta liberam (inclusive Retorno gravado como chat)", () => {
    expect(paymentCoversConsultation(90).ok).toBe(true);
    expect(paymentCoversConsultation(100).ok).toBe(true);
    expect(paymentCoversConsultation(150).ok).toBe(true);
    expect(paymentCoversConsultation(180).ok).toBe(true);
    expect(paymentCoversConsultation(89.99).expected).toBe(90);
  });

  it("o gerador de cobrança usa o preço oficial da modalidade, nunca o valor gravado pelo paciente", () => {
    expect(expectedConsultationPrice("video")).toBe(150);
    expect(expectedConsultationPrice("chat")).toBe(100);
    expect(expectedConsultationPrice("renovacao")).toBe(90);
    expect(expectedConsultationPrice("premium", 250)).toBe(250);
    expect(expectedConsultationPrice("premium", 5)).toBe(180);
    expect(expectedConsultationPrice("qualquer")).toBe(null);
  });
});
