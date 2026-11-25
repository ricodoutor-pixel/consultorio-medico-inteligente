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
