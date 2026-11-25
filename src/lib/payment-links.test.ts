import { describe, it, expect } from "vitest";
import { resolvePaymentLink, buildPaymentLink, paymentLinkMessage } from "./payment-links";

describe("links de pagamento WhatsApp", () => {
  it("vídeo leva ao checkout oficial com médico e campanha", () => {
    expect(resolvePaymentLink("consulta-video", "?pro=dr1&utm_source=whatsapp&utm_campaign=nov&ref=ABC"))
      .toBe("/consulta/consulta_video?utm_source=whatsapp&utm_campaign=nov&indicacao=ABC&origem=whatsapp_link&pro=dr1&etapa=pagamento");
  });
  it("triagem e orientação vão para a Orientação Técnica sem médico", () => {
    expect(resolvePaymentLink("triagem", "?pro=x")).toBe("/orientacao-tecnica?origem=whatsapp_link&etapa=pagamento");
  });
  it("produto desconhecido não abre checkout", () => {
    expect(resolvePaymentLink("qualquer", "")).toBe("/orientacao-tecnica");
  });
  it("valores inseguros são descartados", () => {
    expect(resolvePaymentLink("consulta-chat", "?pro=<script>")).toBe("/consulta/consulta_chat?origem=whatsapp_link&etapa=pagamento");
  });
  it("mensagem usa preço oficial de R$ 150 no vídeo", () => {
    const l = buildPaymentLink("consulta-video");
    expect(paymentLinkMessage("consulta-video", l)).toMatch(/R\$\s150,00/);
  });
});
