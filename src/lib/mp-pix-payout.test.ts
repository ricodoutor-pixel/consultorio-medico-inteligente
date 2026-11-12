import { describe, expect, it } from "vitest";
import { mpPayoutOutcome, mpPixKey, mpPixPayoutBody } from "../../supabase/functions/_shared/mp-pix-payout";
import { isSignatureImagePath } from "./kyc-docs";

describe("saque Pix Mercado Pago", () => {
  it("classifica as chaves Pix", () => {
    expect(mpPixKey("123.456.789-09")).toEqual({ type: "CPF", value: "12345678909" });
    expect(mpPixKey("12.345.678/0001-90")).toEqual({ type: "CNPJ", value: "12345678000190" });
    expect(mpPixKey("Medico@Exemplo.com")).toEqual({ type: "EMAIL", value: "medico@exemplo.com" });
    expect(mpPixKey("+55 (11) 98765-4321")).toEqual({ type: "PHONE", value: "+5511987654321" });
    expect(mpPixKey("123e4567-e89b-12d3-a456-426614174000")?.type).toBe("PIX_CODE");
    expect(mpPixKey("chave inválida")).toBeNull();
  });

  it("monta o corpo do Payouts com valores iguais em origem, destino e total", () => {
    const body = mpPixPayoutBody({ withdrawalId: "abc", net: 94.999, pixKey: "123.456.789-09" });
    expect(body.point_of_interaction).toEqual({ type: "PSP_TRANSFER" });
    expect(body.transaction.total_amount).toBe(95);
    expect(body.transaction.from.accounts[0].amount).toBe(95);
    expect(body.transaction.to.accounts[0]).toEqual({ type: "current", amount: 95, chave: { type: "CPF", value: "12345678909" } });
    expect(() => mpPixPayoutBody({ withdrawalId: "x", net: 10, pixKey: "???" })).toThrow();
  });

  it("só considera pago o que o Mercado Pago confirmou", () => {
    expect(mpPayoutOutcome("processed")).toBe("paid");
    expect(mpPayoutOutcome("success")).toBe("paid");
    expect(mpPayoutOutcome("approved")).toBe("processing");
    expect(mpPayoutOutcome("transaction_in_process")).toBe("processing");
    expect(mpPayoutOutcome("rejected")).toBe("failed");
    expect(mpPayoutOutcome(undefined)).toBe("failed");
  });

  it("usa como carimbo apenas imagens de assinatura", () => {
    expect(isSignatureImagePath("uid/icp_brasil.png")).toBe(true);
    expect(isSignatureImagePath("https://x/assinatura.JPG?token=1")).toBe(true);
    expect(isSignatureImagePath("uid/icp_brasil.pdf")).toBe(false);
    expect(isSignatureImagePath("uid/certificado.pfx")).toBe(false);
    expect(isSignatureImagePath(null)).toBe(false);
  });
});
