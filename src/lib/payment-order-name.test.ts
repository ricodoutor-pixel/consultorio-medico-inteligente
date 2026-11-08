import { describe, expect, it } from "vitest";
import { paymentOrderName } from "../../supabase/functions/_shared/payment-order-name";

describe("personalização de produtos pagos", () => {
  it("identifica os produtos do pedido antes da marca", () => {
    expect(paymentOrderName([{ name: "Caneca" }, { name: "Camiseta" }], "Pedido Shopping"))
      .toBe("Caneca + Camiseta — Planta y Raiz");
  });
  it("usa o nome de produto do carrinho sem incluir dados clínicos", () => {
    expect(paymentOrderName([{ product_name: "Óleo CBD", diagnosis: "privado", patient_name: "privado" }], "Compra com Prescrição"))
      .toBe("Óleo CBD — Planta y Raiz");
  });
  it("mantém identificação comercial quando não há nomes disponíveis", () => {
    expect(paymentOrderName([{ patient_name: "privado" }], "Pedido Shopping"))
      .toBe("Pedido Shopping — Planta y Raiz");
  });
});