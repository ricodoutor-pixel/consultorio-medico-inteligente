import { describe, expect, it } from "vitest";
import {
  FALLBACK_DESCRIPTOR,
  FALLBACK_SERVICES,
  resolveDisplayName,
  sanitizeDescriptor,
} from "../../supabase/functions/_shared/payment-catalog";

describe("payment-catalog — nome que aparece no pagamento", () => {
  it("todo serviço oficial exibe o nome do serviço + Planta y Raiz, nunca nome pessoal", () => {
    for (const code of ["orientacao_tecnica", "retorno_consulta", "consulta_chat", "consulta_video"]) {
      const name = resolveDisplayName(FALLBACK_SERVICES, code);
      expect(name).toContain("Planta y Raiz");
      expect(name).not.toMatch(/Edilson|Bezerra/i);
    }
  });

  it("valores oficiais: Orientação 30, Retorno 90, Chat 100, Vídeo 150, planos 99", () => {
    expect(FALLBACK_SERVICES.orientacao_tecnica.amount_brl).toBe(30);
    expect(FALLBACK_SERVICES.retorno_consulta.amount_brl).toBe(90);
    expect(FALLBACK_SERVICES.consulta_chat.amount_brl).toBe(100);
    expect(FALLBACK_SERVICES.consulta_video.amount_brl).toBe(150);
    expect(FALLBACK_SERVICES.plano_paciente.amount_brl).toBe(99);
    expect(FALLBACK_SERVICES.plano_medico.amount_brl).toBe(99);
    expect(FALLBACK_SERVICES.plano_lojista.amount_brl).toBe(99);
  });

  it("serviço sem cadastro usa nome genérico da empresa", () => {
    expect(resolveDisplayName(FALLBACK_SERVICES, "servico_inexistente")).toBe("Serviço Planta y Raiz");
  });

  it("descritor da fatura: maiúsculas, sem acentos, até 16 caracteres", () => {
    expect(sanitizeDescriptor("Planta y Raíz — Orientação Técnica")).toBe("PLANTA Y RAIZ O");
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
});
