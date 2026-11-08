import { describe, it, expect, vi, afterEach } from "vitest";
import { buildPrivatePubMedQuery, parsePubMedArticles, searchLivePubMed } from "../../supabase/functions/_shared/pubmed-live";

afterEach(() => vi.unstubAllGlobals());
const xml = `<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID Version="1">30624194</PMID><Article><ArticleTitle>Cannabidiol in Anxiety and Sleep: A Large Case Series</ArticleTitle><Journal><JournalIssue><PubDate><Year>2019</Year></PubDate></JournalIssue></Journal><AuthorList><Author><LastName>Shannon</LastName><Initials>S</Initials></Author></AuthorList><Abstract><AbstractText Label="RESULTS">Observed results, not a randomized trial.</AbstractText></Abstract><PublicationTypeList><PublicationType UI="D002363">Case Reports</PublicationType></PublicationTypeList></Article></MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="doi">10.7812/TPP/18-041</ArticleId></ArticleIdList></PubmedData></PubmedArticle></PubmedArticleSet>`;
describe("shared PubMed knowledge retrieval", () => {
  it("sends only fixed clinical terms, never patient identifiers", () => {
    const query = buildPrivatePubMedQuery("Maria Segredo CPF 123.456.789-00 maria@example.com +5511999999999 ansiedade CBD");
    expect(query).toContain('"anxiety"[Title/Abstract]');
    for (const identifier of ["Maria", "Segredo", "123.456", "example.com", "551199"]) expect(query).not.toContain(identifier);
  });
  it("does not send unknown original text to PubMed", () => {
    expect(buildPrivatePubMedQuery("Meu nome é Pessoa Segredo e moro na Rua Particular 123")).toBeNull();
  });
  it("retrieves cannabis medicinal and correlated cannabinoids from PubMed", () => {
    const query = buildPrivatePubMedQuery("medical cannabis CBD");
    expect(query).toContain('"medical cannabis"[Title/Abstract]');
    expect(query).toContain("cannabinoids[Title/Abstract]");
    expect(query).toContain("cannabidiol[Title/Abstract]");
  });
  it("preserves genuine abstract, PMID, authors, year and publication type", () => {
    expect(parsePubMedArticles(xml)[0]).toMatchObject({ pmid: "30624194", year: 2019, authors: "Shannon S", firstAuthor: "Shannon S", url: "https://pubmed.ncbi.nlm.nih.gov/30624194/", abstract: "Observed results, not a randomized trial.", publicationTypes: ["Case Reports"] });
  });
  it("reads the journal title from the PubMed record", () => {
    const withJournal = xml.replace("<Journal><JournalIssue>", "<Journal><Title>The Permanente Journal</Title><JournalIssue>");
    expect(parsePubMedArticles(withJournal)[0].journal).toBe("The Permanente Journal");
  });
  it("leaves missing abstracts empty rather than substituting journal or title", () => {
    expect(parsePubMedArticles(xml.replace(/<Abstract>.*?<\/Abstract>/, ""))[0].abstract).toBe("");
  });
  it("reads the measured result count and fetches real records", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ esearchresult: { count: "8273", idlist: ["30624194"] } }))).mockResolvedValueOnce(new Response(xml));
    vi.stubGlobal("fetch", fetchMock);
    const result = await searchLivePubMed("CBD ansiedade sono");
    expect(result.total).toBe(8273);
    expect(result.articles[0].url).toBe("https://pubmed.ncbi.nlm.nih.gov/30624194/");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });
  it("API failure is unavailable, never zero publications", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 429 })));
    const result = await searchLivePubMed("CBD epilepsia");
    expect(result.status).toBe("unavailable");
    expect(result.total).toBeNull();
  });
});