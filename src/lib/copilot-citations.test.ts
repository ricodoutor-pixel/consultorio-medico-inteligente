import { describe, it, expect } from "vitest";
import { verifyCopilotResponse } from "../../supabase/functions/_shared/copilot-citations";
import type { PmidLookup } from "../../supabase/functions/_shared/pmid-verify";

const article = { pmid: "29307505", title: "Practical considerations in medical cannabis administration and dosing.", firstAuthor: "MacCallum CA", authors: "MacCallum CA, Russo EB", journal: "Eur J Intern Med", year: 2018, url: "https://pubmed.ncbi.nlm.nih.gov/29307505/", abstract: "", doi: null, publicationTypes: [] };
const confirmed: PmidLookup = { status: "ok", found: new Map([[article.pmid, article]]), missing: [] };

describe("copilot citations before delivery", () => {
  it("awaits verification before producing the response envelope", async () => {
    let release: (value: PmidLookup) => void = () => {};
    const lookup = new Promise<PmidLookup>(resolve => { release = resolve; });
    let delivered = false;
    const pending = verifyCopilotResponse("Autor inventado. PMID 29307505", () => lookup).then(value => { delivered = true; return value; });
    await Promise.resolve();
    expect(delivered).toBe(false);
    release(confirmed);
    const response = await pending;
    expect(response).toMatchObject({ success: true, source: "google/gemini-3.8-flash" });
    expect(response.result).toContain("MacCallum CA");
    expect(response.result).toContain("Eur J Intern Med, 2018");
    expect(response.result).not.toContain("Autor inventado");
  });
  it("omits invented metadata for nonexistent PMIDs", async () => {
    const response = await verifyCopilotResponse("Inventado et al. PMID 99999999", async () => confirmed);
    expect(response.result).toContain("citação omitida");
    expect(response.result).not.toContain("Inventado");
  });
  it("does not expose citation metadata when PubMed is unavailable", async () => {
    const response = await verifyCopilotResponse("Autor inventado https://pubmed.ncbi.nlm.nih.gov/29307505/", async () => ({ status: "unavailable", found: new Map(), missing: [] }));
    expect(response.result).toContain("não consegui conferir");
    expect(response.result).not.toContain("Autor inventado");
    expect(response.result).not.toContain("https://");
  });
  it("preserves uncited SOAP notes without an external lookup", async () => {
    const response = await verifyCopilotResponse("S: relato\nO:\nA:\nP: revisão médica", async () => { throw new Error("unnecessary lookup"); });
    expect(response.result).toBe("S: relato\nO:\nA:\nP: revisão médica");
  });
});