import { describe, expect, it } from "vitest";
import { matchesCitationTopic, matchesRequestedEvidence } from "../../supabase/functions/_shared/citation-relevance";
import { normalizeReportAddress } from "../../supabase/functions/_shared/orientation-report-language";

const question = "Quais ensaios clínicos randomizados avaliaram canabidiol em transtorno de ansiedade?";
describe("orientation test 6", () => {
  it("requires both cannabidiol and anxiety, not just one keyword", () => {
    expect(matchesCitationTopic({ title: "Cannabidiol for pain", abstract: "" }, question)).toBe(false);
    expect(matchesCitationTopic({ title: "Anxiety after trauma", abstract: "" }, question)).toBe(false);
    expect(matchesCitationTopic({ title: "Cannabidiol", abstract: "Anxiolytic effects in anxiety" }, question)).toBe(true);
  });
  it("requires randomized trial publication type rather than inferring it from a review", () => {
    const article = { title: "CBD and anxiety", abstract: "Review of randomized trials" };
    expect(matchesRequestedEvidence({ ...article, publicationTypes: ["Review"] }, question)).toBe(false);
    expect(matchesRequestedEvidence({ ...article, publicationTypes: ["Randomized Controlled Trial"] }, question)).toBe(true);
  });
  it("normalizes the reported malformed physician question without compounded articles", () => {
    expect(normalizeReportAddress("Quais alternativas terapêuticas seguras o você/a você recomenda?"))
      .toBe("Quais alternativas terapêuticas seguras você recomenda?");
    expect(normalizeReportAddress("O senhor(a) recomenda? O senhor/a senhora recomenda?"))
      .toBe("você recomenda? você recomenda?");
  });
});