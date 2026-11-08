import { describe, expect, it } from "vitest";
import { lookupPmids, applyCitationVerification } from "../../supabase/functions/_shared/pmid-verify";

// Explicit opt-in: real public metadata only; no patient/session/payment writes.
describe.skipIf(process.env.RUN_PUBMED_LIVE !== "1")("test 6 real PubMed records", () => {
  it("checks Roberts authorship and rejects this real record for CBD anxiety", async () => {
    const lookup = await lookupPmids(["35112940", "29307505", "38924898", "99999999"]);
    expect(lookup.status).toBe("ok");
    expect(lookup.found.get("35112940")?.firstAuthor).toBe("Roberts JM");
    expect(lookup.found.get("29307505")?.firstAuthor).toBe("MacCallum CA");
    expect(lookup.found.get("38924898")?.firstAuthor).toBe("Han K");
    expect(lookup.missing).toContain("99999999");
    const out = applyCitationVerification("Estudo piloto aberto de Berger et al. (2022) — link confirmado: https://pubmed.ncbi.nlm.nih.gov/35112940/", lookup, new Set(["35112940"]), "Quais ensaios clínicos randomizados avaliaram canabidiol em transtorno de ansiedade?");
    expect(out).not.toMatch(/Berger|35112940|Biblioteca interna|link confirmado/);
    expect(out).toContain("Não encontrei ensaio randomizado");
  }, 15000);
});