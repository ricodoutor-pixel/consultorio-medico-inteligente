import { describe, it, expect } from "vitest";
import { publicPracticeAreas, primaryPracticeArea } from "./practice-areas";

describe("áreas de atuação", () => {
  it("tira Medicina Canabinoide sem RQE", () => {
    expect(publicPracticeAreas(["Infectologia (RQE 5416)", "Medicina Canabinoide", "Clínica Médica"]))
      .toEqual(["Infectologia (RQE 5416)", "Clínica Médica"]);
  });
  it("não usa Medicina Canabinoide como área principal", () => {
    expect(primaryPracticeArea({ specialty: "Medicina Canabinoide", tags: ["Medicina Canabinoide", "Dor Crônica"], category: "Médicos" }))
      .toBe("Dor Crônica");
  });
});

import { doctorAreaLabel } from "./practice-areas";
describe("doctorAreaLabel", () => {
  it("sem RQE vira áreas de atuação e tira canabinoide", () => {
    expect(doctorAreaLabel("Medicina Canabinoide, Saúde Mental (TEA/TDAH)")).toBe("Áreas de atuação: Saúde Mental (TEA/TDAH)");
  });
  it("só canabinoide sem RQE some", () => {
    expect(doctorAreaLabel("Medicina Canabinoide")).toBeNull();
  });
  it("com RQE mantém especialidade", () => {
    expect(doctorAreaLabel("Psiquiatria RQE 12345")).toBe("Psiquiatria RQE 12345");
  });
});
