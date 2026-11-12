import { describe, expect, it } from "vitest";
import { intensitySeries, parseTriageNotes } from "./clinical-summary";
import { ANAMNESIS_TEMPLATES, applyTemplate } from "./anamnesis-templates";

const NOTES = `[URGENTE]

Triagem: 123

1. Sinais de alerta (emergência): Nenhum sinal de emergência
2. Queixa principal: Dor lombar crônica (Tempo: 2 anos)
3. Intensidade (0 a 10): 8/10
4. Medicamentos contínuos / alergias: Pregabalina 75 mg; alergia a dipirona
5. Objetivo principal: Reduzir dor e dormir melhor`;

describe("resumo clínico da triagem", () => {
  it("extrai os campos da triagem", () => {
    expect(parseTriageNotes(NOTES)).toEqual({
      redFlags: "Nenhum sinal de emergência",
      complaint: "Dor lombar crônica",
      duration: "2 anos",
      intensity: 8,
      medsAllergies: "Pregabalina 75 mg; alergia a dipirona",
      goal: "Reduzir dor e dormir melhor",
    });
  });

  it("não inventa dados quando não há triagem", () => {
    expect(parseTriageNotes(null).intensity).toBeNull();
    expect(parseTriageNotes("texto livre").medsAllergies).toBeNull();
    expect(parseTriageNotes("3. Intensidade (0 a 10): 15/10").intensity).toBeNull();
  });

  it("monta a série de intensidade em ordem cronológica", () => {
    const series = intensitySeries([
      { created_at: "2026-11-10T12:00:00Z", notes: NOTES.replace("8/10", "5/10") },
      { created_at: "2026-10-01T12:00:00Z", notes: NOTES },
      { created_at: "2026-10-15T12:00:00Z", notes: "sem triagem" },
    ]);
    expect(series.map((p) => p.intensity)).toEqual([8, 5]);
    expect(series[0].label).toBe("01/10");
  });
});

describe("modelos de anamnese", () => {
  it("acrescenta o modelo sem apagar o texto existente", () => {
    const t = ANAMNESIS_TEMPLATES[0];
    expect(applyTemplate("", t)).toBe(t.body);
    expect(applyTemplate("Nota anterior  ", t)).toBe(`Nota anterior\n\n${t.body}`);
  });

  it("tem modelos com identificadores únicos", () => {
    const ids = ANAMNESIS_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
