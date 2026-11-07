import { describe, expect, it } from "vitest";
import {
  isFarewell,
  shouldAutoClose,
  CLOSING_QUESTION_PATTERN,
  FAREWELL_MESSAGE,
} from "../../supabase/functions/_shared/orientation-farewell";

const CLOSING_QUESTION = "Posso ajudar em mais alguma coisa antes de encerrar?";

describe("isFarewell", () => {
  it("reconhece confirmações de que o paciente não precisa de mais nada", () => {
    expect(isFarewell("Não, é só isso")).toBe(true);
    expect(isFarewell("não preciso de mais nada")).toBe(true);
    expect(isFarewell("Só isso, obrigada!")).toBe(true);
    expect(isFarewell("pode encerrar")).toBe(true);
    expect(isFarewell("quero encerrar")).toBe(true);
    expect(isFarewell("mais nada, obrigado")).toBe(true);
    expect(isFarewell("tchau")).toBe(true);
  });

  it("não trata perguntas ou agradecimentos comuns como despedida", () => {
    expect(isFarewell("e qual a dose recomendada?")).toBe(false);
    expect(isFarewell("obrigado, e sobre o exame?")).toBe(false);
    expect(isFarewell("preciso de mais uma informação")).toBe(false);
    expect(isFarewell("")).toBe(false);
  });
});

describe("shouldAutoClose", () => {
  it("fecha a sala só quando o agente fez a pergunta de encerramento", () => {
    expect(shouldAutoClose("Não, é só isso", CLOSING_QUESTION)).toBe(true);
    expect(shouldAutoClose("não preciso de mais nada", "Posso ajudar em algo mais?")).toBe(true);
  });

  it("encerra despedida clara sem exigir pergunta anterior", () => {
    expect(shouldAutoClose("Não preciso de mais nada. Até logo!", null)).toBe(true);
    expect(shouldAutoClose("Obrigada, doutor, entendi tudo. Não preciso de mais nada. Até logo!", "O canabidiol é estudado para o sono.")).toBe(true);
    expect(shouldAutoClose("Não, é só isso mesmo. Obrigada!", null)).toBe(true);
    expect(shouldAutoClose("tchau", null)).toBe(true);
  });

  it("não encerra despedida acompanhada de nova dúvida", () => {
    expect(shouldAutoClose("Obrigada, mas qual o horário do médico?", null)).toBe(false);
    expect(shouldAutoClose("Tchau, mas e a dose?", CLOSING_QUESTION)).toBe(false);
    expect(shouldAutoClose("Até logo, como marco a consulta", null)).toBe(false);
  });

  it("a despedida final não contém pergunta nova", () => {
    expect(FAREWELL_MESSAGE).not.toMatch(/\?/);
    expect(CLOSING_QUESTION_PATTERN.test(CLOSING_QUESTION)).toBe(true);
  });
});
