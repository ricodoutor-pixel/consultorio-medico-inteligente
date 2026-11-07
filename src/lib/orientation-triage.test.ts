import { describe, expect, it } from "vitest";
import { hasEmergency, invalidTriageFields, canEnterOrientation } from "../../supabase/functions/_shared/orientation-triage";

// Triagem curta v3: 5 telas, 6 chaves (objetivo opcional). Nome/idade vêm do cadastro.
const complete = {
  red_flags: "nenhum",
  queixa: "Dificuldade de sono",
  tempo: "1 a 6 meses",
  intensidade: "5",
  medicamentos: "Nenhum",
  objetivo: "Dormir melhor",
};

describe("Orientação pagamento primeiro — triagem de 5 perguntas", () => {
  it("aceita 'Não, nenhum destes sinais' e variantes sem alerta", () => {
    for (const value of ["Não, nenhum destes sinais", "Nenhum desses", "nenhum_desses", "[]", "Não", [], "nenhum"]) {
      expect(hasEmergency({ red_flags: value })).toBe(false);
    }
  });
  it("marca emergência quando o paciente confirma um sinal", () => {
    expect(hasEmergency({ red_flags: "sim_emergencia" })).toBe(true);
    expect(hasEmergency({ red_flags: "dor_peito_falta_ar" })).toBe(true);
  });
  it("exige queixa com 3 caracteres", () => {
    expect(invalidTriageFields({ queixa: "ab" }, false)).toEqual(["queixa"]);
    expect(invalidTriageFields({ queixa: "dor" }, false)).toEqual([]);
  });
  it("objetivo é opcional: falta dele não bloqueia", () => {
    const { objetivo: _omit, ...semObjetivo } = complete;
    expect(invalidTriageFields(semObjetivo)).toEqual([]);
  });
  it("exige as 5 respostas obrigatórias", () => {
    expect(invalidTriageFields({})).toEqual(["red_flags", "queixa", "tempo", "intensidade", "medicamentos"]);
  });
  it("bloqueia sala sem pagamento aprovado", () => expect(canEnterOrientation({ status: "pending" }, complete)).toBe(false));
  it("bloqueia sala sem as respostas obrigatórias", () => expect(canEnterOrientation({ status: "approved" }, {})).toBe(false));
  it("emergência nunca libera sala", () => {
    expect(canEnterOrientation({ status: "approved" }, { ...complete, red_flags: "sim_emergencia" })).toBe(false);
  });
  it("aprovação e triagem válida liberam sala", () => expect(canEnterOrientation({ status: "approved" }, complete)).toBe(true));
});
