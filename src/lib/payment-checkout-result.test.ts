import { describe, expect, it } from "vitest";
import { requireCheckoutUrl } from "./payment-checkout-result";
describe("agendamento não confirma falha de pagamento", () => {
  it("bloqueia erro mesmo com endereço", () => expect(() => requireCheckoutUrl({ init_point: "https://www.mercadopago.com.br/checkout" }, new Error("failed"))).toThrow());
  it("bloqueia resposta sem endereço", () => expect(() => requireCheckoutUrl({}, null)).toThrow());
  it("permite redirecionar apenas com endereço recebido", () => expect(requireCheckoutUrl({ init_point: "https://www.mercadopago.com.br/checkout" }, null)).toBe("https://www.mercadopago.com.br/checkout"));
});