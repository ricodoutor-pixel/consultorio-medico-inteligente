import { describe, expect, it } from "vitest";
import { matchesCitationTopic, matchesRequestedEvidence } from "../../supabase/functions/_shared/citation-relevance";
import { normalizeReportAddress } from "../../supabase/functions/_shared/orientation-report-language";
import { formatCheckedAtPtBR, type PubMedArticle } from "../../supabase/functions/_shared/pubmed-live";
import {
  extractStudyPopulationAndOutcome,
  applyCitationVerification,
  type PmidLookup,
} from "../../supabase/functions/_shared/pmid-verify";

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

  it("Item 4: does NOT eat letter o from words ending in ão before você (coagulação, atenção)", () => {
    expect(normalizeReportAddress("Caso ocorra alteração de coagulação você orienta a suspensão?"))
      .toBe("Caso ocorra alteração de coagulação você orienta a suspensão?");
    expect(normalizeReportAddress("Com muita atenção você avalia o caso."))
      .toBe("Com muita atenção você avalia o caso.");
    expect(normalizeReportAddress("Nesta condição você recomenda o retorno."))
      .toBe("Nesta condição você recomenda o retorno.");
  });

  it("Item 4 safeguard: separates any accidentally welded letter to você", () => {
    expect(normalizeReportAddress("alteração de coagulaçãvocê orienta"))
      .toBe("alteração de coagulaçã você orienta");
  });

  it("Item 2: formatCheckedAtPtBR formats date in São Paulo timezone without T or Z", () => {
    const formatted = formatCheckedAtPtBR(new Date("2026-11-09T14:19:34.124Z"));
    expect(formatted).toContain("09/11/2026");
    expect(formatted).toContain("(horário de São Paulo)");
    expect(formatted).not.toContain("T");
    expect(formatted).not.toContain("Z");
  });

  it("Item 2: extractStudyPopulationAndOutcome extracts clinical population and outcome faithfully", () => {
    const sampleArticle: PubMedArticle = {
      pmid: "21307846",
      title: "Neural basis of anxiolytic effects of cannabidiol (CBD) in generalized Social Anxiety Disorder",
      authors: "Crippa JA, Derenusson GN, Ferrari TB, et al.",
      firstAuthor: "Crippa JA",
      journal: "J Psychopharmacol",
      year: 2011,
      url: "https://pubmed.ncbi.nlm.nih.gov/21307846/",
      doi: null,
      abstract: "Patients with social anxiety disorder underwent SPECT neuroimaging to evaluate regional cerebral blood flow and visual analogue mood scale (VAMS) anxiety scores.",
      publicationTypes: ["Randomized Controlled Trial"],
    };
    const popOutcome = extractStudyPopulationAndOutcome(sampleArticle);
    expect(popOutcome).toContain("transtorno de ansiedade social");
    expect(popOutcome).toContain("fluxo sanguíneo cerebral regional");
  });

  it("Item 2: applyCitationVerification cleans dangling intro, adds population, outcome and TAG notice", () => {
    const sampleArticle: PubMedArticle = {
      pmid: "21307846",
      title: "Cannabidiol in Social Anxiety Disorder",
      authors: "Crippa JA, et al.",
      firstAuthor: "Crippa JA",
      journal: "J Psychopharmacol",
      year: 2011,
      url: "https://pubmed.ncbi.nlm.nih.gov/21307846/",
      doi: null,
      abstract: "Patients with social anxiety disorder were evaluated with VAMS.",
      publicationTypes: ["Randomized Controlled Trial"],
    };
    const lookup: PmidLookup = {
      status: "ok",
      found: new Map([["21307846", sampleArticle]]),
      missing: [],
    };
    const modelOutput = "Sobre os estudos avaliados, destaco os seguintes ensaios:\n\nEstudo de Crippa PMID 21307846 avaliou CBD.";
    const result = applyCitationVerification(modelOutput, lookup, new Set(), question);

    // Never leave a dangling promise without a list
    expect(result).not.toContain("destaco os seguintes ensaios:");
    // Contains PubMed citation with title, author, year and URL
    expect(result).toContain("PMID 21307846");
    expect(result).toContain("População e desfecho:");
    // Contains Generalized Anxiety Disorder (TAG) clinical notice
    expect(result).toContain("nenhum destes ensaios clínicos é específico de Transtorno de Ansiedade Generalizada (TAG)");
  });
});
