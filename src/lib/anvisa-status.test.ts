import { describe, expect, it } from "vitest";
import { anvisaProtocolOf, anvisaStatusLabel } from "./anvisa-status";
import { EDILSON_ON_SUPERVISION, OT_FIRST_STEP_NOTICE } from "./edilson-on";

describe("receitas: a plataforma nunca afirma aprovação da ANVISA", () => {
  it("status simulado antigo aparece como não verificado", () => {
    expect(anvisaStatusLabel("APROVADO_INSTANTANEO")).toBe("Autorização ANVISA não verificada");
    expect(anvisaStatusLabel(undefined)).toBe("Autorização ANVISA não verificada");
    expect(anvisaStatusLabel("INFORMADO_PELO_PACIENTE")).toContain("não verificado");
  });

  it("sem protocolo informado não há número padrão", () => {
    expect(anvisaProtocolOf({})).toBeNull();
    expect(anvisaProtocolOf({ anvisa_code: "  " })).toBeNull();
    expect(anvisaProtocolOf({ anvisa_protocol: "123" })).toBe("123");
  });
});

describe("identidade pública: Enfª Brisa", () => {
  it("é assistente virtual com supervisão técnica da Dra. Suelen, sem nome de médico como persona (decisão 25/11/2026)", () => {
    expect(EDILSON_ON_SUPERVISION).toContain("Enfª Brisa é uma assistente virtual");
    expect(EDILSON_ON_SUPERVISION).toContain("supervisão técnica da Dra. Suelen Naves Rodrigues (CRM 49354/PR)");
    expect(EDILSON_ON_SUPERVISION).not.toMatch(/Edilson|10963|CRM-(CE|SP)/);
  });

  it("deixa claro que a Orientação é só o início do cuidado", () => {
    expect(OT_FIRST_STEP_NOTICE).toContain("apenas o início");
    expect(OT_FIRST_STEP_NOTICE).toContain("não é consulta");
  });
});
