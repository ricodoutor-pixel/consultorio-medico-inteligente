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

  it("não fecha no meio da conversa sem a pergunta de encerramento", () => {
    expect(shouldAutoClose("Não, é só isso", "O canabidiol é estudado para o sono.")).toBe(false);
    expect(shouldAutoClose("tchau", null)).toBe(false);
  });

  it("a despedida final não contém pergunta nova", () => {
    expect(FAREWELL_MESSAGE).not.toMatch(/\?/);
    expect(CLOSING_QUESTION_PATTERN.test(CLOSING_QUESTION)).toBe(true);
  });
});
