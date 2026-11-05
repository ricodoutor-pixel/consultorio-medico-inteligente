import { describe, expect, it } from "vitest";
import { hasEmergency, invalidTriageFields, canEnterOrientation } from "../../supabase/functions/_shared/orientation-triage";
const complete = { nome: "Paciente Teste", idade: "30", queixa: "Dificuldade de sono", tempo: "1 mes", intensidade: "leve", medicamentos: "nenhum", canabinoides: "nunca", comorbidades: "nenhuma", objetivo: "sono", red_flags: "nenhum" };
describe("Orientação pagamento primeiro", () => {
  it("aceita Nenhum desses e variantes sem alerta", () => {
    for (const value of ["Nenhum desses", "nenhum_desses", "[]", "Não", [], "nenhum"]) expect(hasEmergency({ red_flags: value })).toBe(false);
  });
  it("valida idade de 0 a 120", () => {
    expect(invalidTriageFields({ idade: "0" }, false)).toEqual([]);
    expect(invalidTriageFields({ idade: "120" }, false)).toEqual([]);
    expect(invalidTriageFields({ idade: "121" }, false)).toEqual(["idade"]);
    expect(invalidTriageFields({ idade: "-1" }, false)).toEqual(["idade"]);
  });
  it("exige queixa com 3 caracteres", () => {
    expect(invalidTriageFields({ queixa: "ab" }, false)).toEqual(["queixa"]);
    expect(invalidTriageFields({ queixa: "dor" }, false)).toEqual([]);
  });
  it("bloqueia sala sem pagamento aprovado", () => expect(canEnterOrientation({ status: "pending" }, complete)).toBe(false));
  it("bloqueia sala sem as 10 respostas", () => expect(canEnterOrientation({ status: "approved" }, {})).toBe(false));
  it("emergências nunca liberam sala", () => {
    for (const red_flags of ["dor_peito_falta_ar", "desmaio_confusao", "sangramento_ativo", "autoagressao"]) expect(canEnterOrientation({ status: "approved" }, { ...complete, red_flags })).toBe(false);
  });
  it("aprovação e triagem válida liberam sala", () => expect(canEnterOrientation({ status: "approved" }, complete)).toBe(true));
});