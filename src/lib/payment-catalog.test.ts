import { describe, expect, it } from "vitest";
import {
  FALLBACK_DESCRIPTOR,
  FALLBACK_SERVICES,
  formatPaymentName,
  normalizeReceiverName,
  OFFICIAL_RECEIVER_NAME,
  resolveConsultationSku,
  resolveDisplayName,
  sanitizeDescriptor,
} from "../../supabase/functions/_shared/payment-catalog";

describe("payment-catalog — nome que aparece no pagamento", () => {
  it("todo serviço oficial exibe o nome do serviço + Planta y Raiz, nunca nome pessoal", () => {
    for (const code of ["orientacao_tecnica", "retorno_consulta", "consulta_chat", "consulta_video", "consulta_premium"]) {
      const name = resolveDisplayName(FALLBACK_SERVICES, code);
      expect(name).toContain("Planta y Raiz");
      expect(name).not.toMatch(/Edilson|Bezerra/i);
    }
  });

  it("valores oficiais: Orientação 30, Retorno 90, Chat 100, Vídeo 150, Premium 180, planos 99", () => {
    expect(FALLBACK_SERVICES.orientacao_tecnica.amount_brl).toBe(30);
    expect(FALLBACK_SERVICES.retorno_consulta.amount_brl).toBe(90);
    expect(FALLBACK_SERVICES.consulta_chat.amount_brl).toBe(100);
    expect(FALLBACK_SERVICES.consulta_video.amount_brl).toBe(150);
    expect(FALLBACK_SERVICES.consulta_premium.amount_brl).toBe(180);
    expect(FALLBACK_SERVICES.plano_paciente.amount_brl).toBe(99);
    expect(FALLBACK_SERVICES.plano_medico.amount_brl).toBe(99);
    expect(FALLBACK_SERVICES.plano_lojista.amount_brl).toBe(99);
  });

  it("troca 'Doutor Rico Ltda' ou vazio por 'Planta y Raiz Ltda' no recebedor do Pix", () => {
    expect(normalizeReceiverName("Doutor Rico Ltda")).toBe("Planta y Raiz Ltda");
    expect(normalizeReceiverName("doutor rico")).toBe("Planta y Raiz Ltda");
    expect(normalizeReceiverName("")).toBe(OFFICIAL_RECEIVER_NAME);
    expect(normalizeReceiverName(null)).toBe("Planta y Raiz Ltda");
    expect(normalizeReceiverName("Planta y Raiz Ltda")).toBe("Planta y Raiz Ltda");
  });

  it("resolve todas as modalidades de consulta para a tabela única payment_services", () => {
    expect(resolveConsultationSku("chat")).toBe("consulta_chat");
    expect(resolveConsultationSku("video")).toBe("consulta_video");
    expect(resolveConsultationSku("retorno")).toBe("retorno_consulta");
    expect(resolveConsultationSku("premium")).toBe("consulta_premium");
  });

  it("serviço sem cadastro usa nome genérico da empresa", () => {
    expect(resolveDisplayName(FALLBACK_SERVICES, "servico_inexistente")).toBe("Serviço — Planta y Raiz");
  });

  it("descritor da fatura: maiúsculas, sem acentos, até 16 caracteres", () => {
    expect(sanitizeDescriptor("Planta y Raíz — Orientação Técnica")).toBe("PLANTA Y RAIZ OR");
    expect(sanitizeDescriptor("")).toBe(FALLBACK_DESCRIPTOR);
    expect(sanitizeDescriptor("plantayraiz")).toBe("PLANTAYRAIZ");
  });

  it("nome mudado na tabela aparece no pagamento seguinte", () => {
    const catalog = {
      ...FALLBACK_SERVICES,
      orientacao_tecnica: { ...FALLBACK_SERVICES.orientacao_tecnica, display_name: "Orientação Especial — Planta y Raiz" },
    };
    expect(resolveDisplayName(catalog, "orientacao_tecnica")).toBe("Orientação Especial — Planta y Raiz");
  });

  it("personaliza qualquer produto mantendo a marca depois do nome", () => {
    expect(formatPaymentName("Camiseta Botânica")).toBe("Camiseta Botânica — Planta y Raiz");
    expect(formatPaymentName("Planta y Raíz — Caneca")).toBe("Caneca — Planta y Raiz");
    expect(formatPaymentName("Orientação Técnica — Planta y Raiz")).toBe("Orientação Técnica — Planta y Raiz");
    expect(formatPaymentName("x".repeat(300))).toBe("x".repeat(239) + " — Planta y Raiz");
  });
});
