import { describe, it, expect } from "vitest";
import {
  applyCitationVerification,
  extractStudyPopulationAndOutcome,
  type PmidLookup,
} from "../../supabase/functions/_shared/pmid-verify";
import type { PubMedArticle } from "../../supabase/functions/_shared/pubmed-live";
import fixtures from "./fixtures/teste9-pubmed.json";

// Registros reais do PubMed citados no teste 9 da Orientação Técnica (10/11/2026).
const authors: Record<string, string> = {
  "38797087": "Gundugurti PR", "37552290": "Gournay LR", "35445839": "Bloomfield MAP",
  "39680411": "Nayak MM", "35861792": "Stanley TB",
};
const articles: PubMedArticle[] = (fixtures as Array<{ pmid: string; title: string; abstract: string }>).map((f) => ({
  pmid: f.pmid, title: f.title, abstract: f.abstract, authors: `${authors[f.pmid]}, et al.`,
  firstAuthor: authors[f.pmid], journal: "Revista", year: 2023, url: `https://pubmed.ncbi.nlm.nih.gov/${f.pmid}/`,
  doi: null, publicationTypes: ["Randomized Controlled Trial"],
}));
const byId = (id: string) => articles.find((a) => a.pmid === id)!;
const question = "Quais ensaios clínicos randomizados avaliaram canabidiol em transtorno de ansiedade generalizada (TAG)?";

describe("Teste 9 — resumo de população e desfecho por estudo", () => {
  it("Gundugurti: desfecho primário GAD-7 e HAM-A, não fluxo cerebral", () => {
    const s = extractStudyPopulationAndOutcome(byId("38797087"));
    expect(s).toContain("desfecho primário: escala GAD-7; escala de Hamilton para ansiedade (HAM-A)");
    expect(s).not.toContain("fluxo sanguíneo");
  });
  it("Gournay: preocupação e sintomas de ansiedade, não fluxo cerebral", () => {
    const s = extractStudyPopulationAndOutcome(byId("37552290"));
    expect(s).toContain("gravidade da preocupação");
    expect(s).not.toContain("fluxo sanguíneo");
  });
  it("Bloomfield: ressonância funcional com faces emocionais", () => {
    expect(extractStudyPopulationAndOutcome(byId("35445839"))).toContain("ressonância magnética funcional");
  });
  it("Stanley: estudantes universitários com ansiedade de prova", () => {
    expect(extractStudyPopulationAndOutcome(byId("35861792"))).toContain("população: estudantes universitários com ansiedade de prova");
  });
  it("Nayak: desfecho primário VAMS", () => {
    expect(extractStudyPopulationAndOutcome(byId("39680411"))).toContain("desfecho primário: escala analógica visual de humor (VAMS)");
  });
});

describe("Teste 9 — corpo da resposta e aviso de TAG", () => {
  const lookup: PmidLookup = { status: "ok", found: new Map(articles.map((a) => [a.pmid, a])), missing: [] };
  const model = [
    "Na busca conferida em 10/11/2026, os registros recuperados trazem o seguinte panorama:",
    articles.map((a) => `- ${a.firstAuthor} (PMID ${a.pmid}) avaliou CBD.`).join("\n"),
    "Como você usa varfarina e escitalopram, é preciso cautela médica.",
  ].join("\n\n");
  const out = applyCitationVerification(model, lookup, new Set(), question);

  it("a lista aparece logo depois do 'seguinte panorama', antes do restante do texto", () => {
    const intro = out.indexOf("panorama");
    const list = out.indexOf("PMID 38797087");
    const rest = out.indexOf("varfarina");
    expect(intro).toBeGreaterThanOrEqual(0);
    expect(list).toBeGreaterThan(intro);
    expect(rest).toBeGreaterThan(list);
  });
  it("avisa que nenhum estudo é específico de TAG, mesmo com GAD-7 no resumo", () => {
    expect(out).toContain("nenhum destes ensaios clínicos é específico de Transtorno de Ansiedade Generalizada (TAG)");
  });
});
