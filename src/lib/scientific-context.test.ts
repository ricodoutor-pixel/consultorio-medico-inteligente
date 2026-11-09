import { describe, it, expect, vi, afterEach } from "vitest";
import { buildSearchQuery, normalizeDoi, validateDoi, validatePubmed, fetchScientificEvidence } from "../../supabase/functions/_shared/scientific-context";

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
  it("excludes an internal CBD anxiety claim when PMID 35112940 resolves to unrelated forensic metadata", async () => {
    // Local test-only values; no hosted database or patient data is accessed.
    const testEnv: Record<string, string> = { SUPABASE_URL: "https://example.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-only" };
    vi.stubGlobal("Deno", { env: { get: (name: string) => testEnv[name] } });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        title: "Cannabidiol randomized trial for anxiety by Berger", authors: "Berger", year: 2022,
        url: "https://pubmed.ncbi.nlm.nih.gov/35112940/", abstract: "Cannabidiol improves anxiety", doi: null,
      }])))
      .mockResolvedValueOnce(new Response(`<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>35112940</PMID><Article><ArticleTitle>Trauma in forensic evaluations</ArticleTitle><Abstract><AbstractText>Forensic assessment of trauma</AbstractText></Abstract><AuthorList><Author><LastName>Roberts</LastName><Initials>JM</Initials></Author></AuthorList><PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>`));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchScientificEvidence("Quais ensaios clínicos randomizados avaliaram canabidiol em transtorno de ansiedade?"))
      .toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});