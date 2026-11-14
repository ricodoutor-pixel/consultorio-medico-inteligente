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

describe("identidade pública: Dr. Edilson Bezerra ON", () => {
  it("é IA supervisionada com registro boliviano, nunca CRM brasileiro", () => {
    expect(EDILSON_ON_SUPERVISION).toContain("Dr. Edilson Bezerra ON");
    expect(EDILSON_ON_SUPERVISION).toContain("inteligência artificial");
    expect(EDILSON_ON_SUPERVISION).toContain("Bolívia");
    expect(EDILSON_ON_SUPERVISION).not.toMatch(/CRM-(CE|SP)/);
  });

  it("deixa claro que a Orientação é só o início do cuidado", () => {
    expect(OT_FIRST_STEP_NOTICE).toContain("apenas o início");
    expect(OT_FIRST_STEP_NOTICE).toContain("não é consulta");
  });
});
