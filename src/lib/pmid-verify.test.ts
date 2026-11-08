import { describe, it, expect } from "vitest";
import { extractPmids, applyCitationVerification, buildPatientPmidBlock, type PmidLookup } from "../../supabase/functions/_shared/pmid-verify";

const roberts = { pmid: "35112940", title: "Trauma Symptom Inventory in forensic evaluations.", authors: "Roberts JM, Other A", firstAuthor: "Roberts JM", journal: "J Pers Assess", year: 2022, url: "https://pubmed.ncbi.nlm.nih.gov/35112940/", doi: null, abstract: "", publicationTypes: [] };
const ok: PmidLookup = { status: "ok", found: new Map([["35112940", roberts]]), missing: ["99999999"] };

describe("PMID verification", () => {
  it("extracts PMIDs from text and links", () => {
    expect(extractPmids("confira o PMID 35112940 e pubmed.ncbi.nlm.nih.gov/29307505/")).toEqual(["35112940", "29307505"]);
  });
  it("uses real record metadata, not the model's invented author", () => {
    const out = applyCitationVerification("Berger M [Biblioteca interna] PMID 35112940 mostrou...", ok, new Set());
    expect(out).toContain("Roberts JM");
    expect(out).toContain("J Pers Assess, 2022");
    expect(out).toContain("PMID 35112940 [PubMed]");
    expect(out).not.toContain("[Biblioteca interna]");
  });
  it("labels Biblioteca interna only when the PMID is in the library", () => {
    expect(applyCitationVerification("PMID 35112940", ok, new Set(["35112940"]))).toContain("[Biblioteca interna]");
  });
  it("flags nonexistent PMID", () => {
    expect(applyCitationVerification("PMID 99999999", ok, new Set())).toContain("PMID 99999999: não existe no PubMed");
  });
  it("warns instead of inventing when PubMed is down", () => {
    const out = applyCitationVerification("Segundo o PubMed, PMID 35112940...", { status: "unavailable", found: new Map(), missing: [] }, new Set());
    expect(out).toContain("Não consegui conferir agora");
    expect(out).not.toMatch(/segundo o pubmed/i);
  });
  it("patient-requested PMID block says it does not exist / could not check", () => {
    expect(buildPatientPmidBlock(ok, ["99999999"])).toContain("NÃO EXISTE");
    expect(buildPatientPmidBlock({ status: "unavailable", found: new Map(), missing: [] }, ["1"])).toContain("não consegui conferir");
  });
});
