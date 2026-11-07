import { describe, it, expect, vi, afterEach } from "vitest";
import { buildSearchQuery, normalizeDoi, validateDoi, validatePubmed } from "../../supabase/functions/_shared/scientific-context";

afterEach(() => vi.unstubAllGlobals());
describe("scientific evidence", () => {
  it("Portuguese cannabidiol anxiety becomes indexed English terms", () => {
    expect(buildSearchQuery("Me passe o link de um estudo sobre canabidiol e ansiedade")).toBe("anxiety cannabidiol");
  });
  it("English cannabidiol and CBD use the same retrieval terms", () => {
    expect(buildSearchQuery("cannabidiol anxiety")).toContain("cannabidiol");
    expect(buildSearchQuery("CBD ansiedade")).toBe("anxiety cannabidiol");
  });
  it("normalizes real imported doi prefixes", () => {
    expect(normalizeDoi("doi: 10.1186/s42238-024-00250-y")).toBe("10.1186/s42238-024-00250-y");
  });
  it("does not validate arbitrary stored links as PubMed", async () => {
    expect(await validatePubmed("https://example.com/paper")).toBe(false);
  });
  it("requires successful Crossref lookup and NCBI record existence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("", { status: 404 })).mockResolvedValueOnce(new Response(JSON.stringify({ result: { "39394179": { uid: "39394179", title: "Review" } } }))));
    expect(await validateDoi("10.1177/15347354241292978")).toBe(false);
    expect(await validatePubmed("https://pubmed.ncbi.nlm.nih.gov/39394179/")).toBe(true);
  });
});