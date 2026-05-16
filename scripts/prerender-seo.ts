/**
 * SEO Prerender — gera HTML estático após `vite build` para que o Googlebot
 * receba conteúdo completo no primeiro request (corrige problema SPA sem SSR).
 *
 * Não toca em puppeteer/chromium (funciona no build da Hostinger).
 * Injeta o conteúdo SEO dentro de <div id="root"> — React's createRoot
 * substitui esse HTML na hidratação, então o usuário continua vendo a SPA normal.
 *
 * Rotas geradas:
 *  - /tratamentos/:slug  (12 condições médicas)
 *  - Páginas estáticas principais (/, /como-funciona, /precos, /faq, /shopping, etc.)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const DIST = resolve("dist");
const BASE_URL = "https://plantayraiz.com.br";

interface TreatmentPage {
  slug: string;
  title: string;
  description: string;
  h1: string;
  cid: string;
  paragraphs: string[];
  symptoms: string[];
  benefits: string[];
  studies: { title: string; source?: string; year?: string }[];
  faq?: { q: string; a: string }[];
}

const TREATMENTS: TreatmentPage[] = [
  {
    slug: "ansiedade",
    title: "Cannabis Medicinal para Ansiedade | Planta & Raiz",
    description: "Como o CBD ajuda no tratamento da ansiedade. Orientação técnica com Dr. Edilson Bezerra (CRM 10963) a partir de R$30. Regulamentado pela ANVISA.",
    h1: "Tratamento de Ansiedade com Cannabis Medicinal",
    cid: "F41.1",
    paragraphs: [
      "A ansiedade afeta mais de 18 milhões de brasileiros segundo a OMS. O canabidiol (CBD) tem demonstrado propriedades ansiolíticas em estudos clínicos controlados.",
      "O CBD atua nos receptores 5-HT1A (serotonina) e no sistema endocanabinóide, modulando a resposta ao estresse sem os efeitos psicoativos do THC.",
      "Estudos publicados no Journal of Clinical Psychology (2023) demonstram redução de até 79% nos escores de ansiedade (GAD-7) após 8 semanas de tratamento com CBD.",
    ],
    symptoms: ["Ansiedade generalizada", "Transtorno do pânico", "Ansiedade social", "TEPT", "Insônia por ansiedade"],
    benefits: ["Efeito ansiolítico sem dependência", "Melhora no sono", "Redução de crises de pânico", "Compatível com outros tratamentos"],
    studies: [
      { title: "Cannabidiol in Anxiety and Sleep", source: "The Permanente Journal", year: "2023" },
      { title: "CBD for Social Anxiety Disorder", source: "Neuropsychopharmacology", year: "2024" },
    ],
  },
  {
    slug: "dor-cronica",
    title: "Cannabis Medicinal para Dor Crônica | Planta & Raiz",
    description: "Cannabis medicinal no manejo da dor crônica. Orientação técnica a partir de R$30 com Dr. Edilson Bezerra (CRM 10963). 100% online e regulamentado.",
    h1: "Tratamento de Dor Crônica com Cannabis Medicinal",
    cid: "G89.4",
    paragraphs: [
      "A dor crônica afeta 37% da população brasileira (IASP). Cannabis medicinal é uma alternativa segura aos opioides para manejo da dor.",
      "Os canabinoides atuam nos receptores CB1 e CB2 do sistema endocanabinóide, modulando a percepção da dor e reduzindo inflamação.",
      "Meta-análise publicada na JAMA (2024) incluindo 47 estudos mostrou redução significativa da dor em 64% dos pacientes tratados com cannabis medicinal.",
    ],
    symptoms: ["Fibromialgia", "Dor neuropática", "Artrite", "Enxaqueca crônica", "Dor lombar"],
    benefits: ["Redução de até 30% no uso de opioides", "Melhora na qualidade do sono", "Anti-inflamatório natural", "Menor risco de dependência"],
    studies: [
      { title: "Cannabinoids for Chronic Pain: A Systematic Review", source: "JAMA", year: "2023" },
      { title: "Cannabis-Based Medicines in Neuropathic Pain", source: "Cochrane Library", year: "2024" },
    ],
  },
  {
    slug: "epilepsia",
    title: "Cannabis Medicinal para Epilepsia | Planta & Raiz",
    description: "CBD reduz convulsões em epilepsias refratárias. Orientação técnica com Dr. Edilson Bezerra (CRM 10963) a partir de R$30. Regulamentado pela ANVISA.",
    h1: "Tratamento de Epilepsia com Cannabis Medicinal",
    cid: "G40",
    paragraphs: [
      "O Epidiolex (CBD puro) foi o primeiro medicamento à base de cannabis aprovado pela FDA/ANVISA para epilepsias refratárias.",
      "O CBD modula os canais de sódio e cálcio, reduzindo a excitabilidade neuronal responsável pelas crises convulsivas.",
      "Estudo pivotal (Devinsky et al., 2017) demonstrou redução de 39% na frequência de convulsões em pacientes com Síndrome de Dravet.",
    ],
    symptoms: ["Epilepsia refratária", "Síndrome de Dravet", "Síndrome de Lennox-Gastaut", "Crises parciais", "Espasmos infantis"],
    benefits: ["Redução de até 50% nas crises", "Aprovado pela ANVISA (Epidiolex)", "Seguro para uso pediátrico", "Melhora cognitiva associada"],
    studies: [
      { title: "Cannabidiol in Dravet Syndrome", source: "NEJM", year: "2017" },
      { title: "Long-term CBD Use in Pediatric Epilepsy", source: "Epilepsia", year: "2024" },
    ],
  },
  {
    slug: "insonia",
    title: "Cannabis Medicinal para Insônia | Planta & Raiz",
    description: "Cannabis medicinal melhora qualidade do sono sem dependência. Orientação técnica online com Dr. Edilson Bezerra (CRM 10963) a partir de R$30.",
    h1: "Tratamento de Insônia com Cannabis Medicinal",
    cid: "G47.0",
    paragraphs: [
      "A insônia crônica afeta 73 milhões de brasileiros (ABSono). Cannabis medicinal oferece uma alternativa aos hipnóticos tradicionais.",
      "O THC em doses baixas reduz a latência do sono, enquanto o CBD modula o ciclo circadiano e reduz ansiedade pré-sono.",
      "Estudo do Journal of Clinical Sleep Medicine (2023) mostrou melhora de 65% no Pittsburgh Sleep Quality Index após 4 semanas.",
    ],
    symptoms: ["Insônia crônica", "Dificuldade para iniciar o sono", "Despertar noturno", "Sono não reparador", "Apneia leve"],
    benefits: ["Indução natural do sono", "Melhora nos ciclos REM", "Sem efeito ressaca matinal", "Alternativa a benzodiazepínicos"],
    studies: [{ title: "Cannabis, Cannabinoids, and Sleep", source: "Sleep Medicine Reviews", year: "2023" }],
  },
  {
    slug: "depressao",
    title: "Cannabis Medicinal para Depressão | Planta & Raiz",
    description: "Como cannabis medicinal pode auxiliar no tratamento da depressão. Orientação técnica a partir de R$30 com Dr. Edilson Bezerra (CRM 10963).",
    h1: "Cannabis Medicinal no Tratamento da Depressão",
    cid: "F32",
    paragraphs: [
      "A depressão é a principal causa de incapacidade global (OMS). Cannabis medicinal mostra potencial como terapia adjuvante.",
      "O sistema endocanabinóide regula humor, apetite e sono — funções diretamente afetadas pela depressão.",
      "CBD demonstrou propriedades antidepressivas em estudos pré-clínicos, atuando nos receptores 5-HT1A e no BDNF.",
    ],
    symptoms: ["Depressão maior", "Distimia", "Depressão pós-parto", "Sintomas depressivos refratários", "Anedonia"],
    benefits: ["Ação rápida em estudos pré-clínicos", "Modula serotonina e BDNF", "Terapia adjuvante segura", "Menor incidência de efeitos colaterais"],
    studies: [
      { title: "CBD and Antidepressant Mechanisms", source: "Mol Neurobiology", year: "2019" },
      { title: "CBD as Rapid-Acting Antidepressant", source: "Neuropharmacology", year: "2016" },
    ],
  },
  {
    slug: "fibromialgia",
    title: "Cannabis Medicinal para Fibromialgia | Planta & Raiz",
    description: "Cannabis medicinal reduz dor e melhora qualidade de vida em pacientes com fibromialgia. Orientação técnica a partir de R$30 com Dr. Edilson Bezerra.",
    h1: "Tratamento de Fibromialgia com Cannabis Medicinal",
    cid: "M79.7",
    paragraphs: [
      "A fibromialgia afeta 2-4% da população brasileira, predominantemente mulheres. É caracterizada por dor musculoesquelética generalizada.",
      "A teoria da deficiência endocanabinóide (Russo, 2016) sugere que a fibromialgia pode estar relacionada a desequilíbrios no sistema endocanabinóide.",
      "Estudo israelense (Sagy et al., 2019) com 367 pacientes mostrou melhora significativa na dor e qualidade de vida após 6 meses de tratamento.",
    ],
    symptoms: ["Dor musculoesquelética", "Fadiga crônica", "Pontos sensíveis", "Distúrbios do sono", "Névoa cognitiva"],
    benefits: ["Redução da dor difusa", "Melhora no sono", "Redução de inflamação", "Melhora na qualidade de vida"],
    studies: [
      { title: "Medical Cannabis for Fibromyalgia", source: "J Clin Med", year: "2019" },
      { title: "Endocannabinoid Deficiency Theory", source: "Cannabis & Cannabinoid Research", year: "2016" },
    ],
  },
  {
    slug: "parkinson",
    title: "Cannabis Medicinal para Parkinson | Planta & Raiz",
    description: "Cannabis medicinal alivia tremores, rigidez e melhora qualidade de vida em pacientes com Parkinson. Orientação técnica com Dr. Edilson Bezerra (CRM 10963).",
    h1: "Tratamento de Parkinson com Cannabis Medicinal",
    cid: "G20",
    paragraphs: [
      "A doença de Parkinson afeta mais de 200 mil brasileiros. Cannabis medicinal pode aliviar sintomas motores e não-motores.",
      "O CBD possui propriedades neuroprotetoras e anti-inflamatórias que atuam nos gânglios da base, região afetada no Parkinson.",
      "Estudo brasileiro (Zuardi et al., 2009) demonstrou melhora significativa nos sintomas psicóticos e distúrbios do sono em pacientes com Parkinson.",
    ],
    symptoms: ["Tremor", "Rigidez muscular", "Bradicinesia", "Distúrbios do sono REM", "Psicose induzida"],
    benefits: ["Redução de tremores", "Neuroproteção", "Melhora no sono REM", "Redução de psicose"],
    studies: [
      { title: "CBD Improves Psychosis in Parkinson's", source: "J Psychopharmacol", year: "2009" },
      { title: "Cannabis Alleviates Pain and Tremor in Parkinson's", source: "Clin Neuropharmacol", year: "2014" },
    ],
  },
  {
    slug: "autismo",
    title: "Cannabis Medicinal para Autismo (TEA) | Planta & Raiz",
    description: "CBD melhora comportamento, sono e comunicação em pacientes com Transtorno do Espectro Autista. Orientação técnica a partir de R$30 com Dr. Edilson Bezerra.",
    h1: "Cannabis Medicinal no Tratamento do Autismo (TEA)",
    cid: "F84.0",
    paragraphs: [
      "O Transtorno do Espectro Autista (TEA) afeta 1 em cada 36 crianças. Cannabis medicinal tem mostrado resultados promissores.",
      "O sistema endocanabinóide participa do neurodesenvolvimento e regulação da comunicação sináptica, áreas afetadas no TEA.",
      "Estudo israelense (Aran et al., 2019) com 188 pacientes demonstrou melhora em 80% dos casos em comportamento, ansiedade e comunicação.",
    ],
    symptoms: ["Comportamento agressivo", "Ansiedade no TEA", "Distúrbios do sono", "Dificuldade de comunicação", "Hiperatividade"],
    benefits: ["Melhora em 80% dos casos (Aran 2019)", "Redução da ansiedade", "Melhora no sono", "Melhora na comunicação"],
    studies: [
      { title: "CBD-Rich Cannabis Improves Autism Symptoms", source: "Scientific Reports", year: "2019" },
      { title: "CBD and Quality of Life in ASD", source: "J Autism Dev Disorders", year: "2019" },
    ],
  },
  {
    slug: "esclerose-multipla",
    title: "Cannabis Medicinal para Esclerose Múltipla | Planta & Raiz",
    description: "Cannabis medicinal reduz espasticidade e dor na esclerose múltipla. Orientação técnica com Dr. Edilson Bezerra (CRM 10963) a partir de R$30.",
    h1: "Tratamento de Esclerose Múltipla com Cannabis Medicinal",
    cid: "G35",
    paragraphs: [
      "A Esclerose Múltipla afeta mais de 40 mil brasileiros. O Sativex (nabiximols) foi um dos primeiros medicamentos canabinoides aprovados.",
      "Os canabinoides modulam a resposta imune e reduzem a neuroinflamação característica da EM.",
      "Meta-análise (Whiting et al., 2015) demonstrou eficácia significativa do nabiximols na redução da espasticidade em pacientes com EM.",
    ],
    symptoms: ["Espasticidade", "Dor neuropática", "Distúrbios urinários", "Fadiga", "Tremor de intenção"],
    benefits: ["Redução da espasticidade", "Alívio da dor neuropática", "Aprovado mundialmente (Sativex)", "Imunomodulação"],
    studies: [
      { title: "Nabiximols Effective for MS Spasticity", source: "JAMA", year: "2015" },
      { title: "Sativex Improves Spasticity in MS", source: "Eur J Neurology", year: "2011" },
    ],
  },
  {
    slug: "tdah",
    title: "Cannabis Medicinal para TDAH | Planta & Raiz",
    description: "Pesquisas investigam o potencial do CBD no manejo de sintomas do TDAH. Orientação técnica a partir de R$30 com Dr. Edilson Bezerra (CRM 10963).",
    h1: "Cannabis Medicinal e TDAH — Transtorno de Déficit de Atenção",
    cid: "F90",
    paragraphs: [
      "O TDAH afeta cerca de 5% da população adulta brasileira. Pacientes buscam alternativas aos estimulantes tradicionais.",
      "O sistema endocanabinóide modula a liberação de dopamina no córtex pré-frontal, região diretamente envolvida no TDAH.",
      "Estudo piloto (Cooper et al., 2017) mostrou tendência de melhora na hiperatividade e impulsividade com Sativex.",
    ],
    symptoms: ["Desatenção", "Hiperatividade", "Impulsividade", "Disfunção executiva", "Ansiedade associada"],
    benefits: ["Modulação dopaminérgica", "Redução de impulsividade", "Alternativa a estimulantes", "Menos efeitos colaterais cardiovasculares"],
    studies: [{ title: "Cannabinoids and ADHD — Pilot Study", source: "Eur Neuropsychopharmacol", year: "2017" }],
  },
];

// Páginas estáticas adicionais — apenas título/descrição/H1 e parágrafo introdutório
interface StaticPage { path: string; title: string; description: string; h1: string; intro: string[]; }
const STATIC_PAGES: StaticPage[] = [
  {
    path: "/",
    title: "Planta y Raiz | Orientação Técnica de Cannabis Medicinal | Dr. Edilson Bezerra",
    description: "Orientação Técnica de Cannabis Medicinal com Dr. Edilson Bezerra (CRM 10963) a partir de R$30. 100% online e regulamentado pela ANVISA. Atendimento SP e Brasil.",
    h1: "Orientação Técnica de Cannabis Medicinal — Dr. Edilson Bezerra",
    intro: [
      "Planta y Raiz é a plataforma de intermediação digital de Cannabis Medicinal regulamentada pela ANVISA (RDC 660/2022 e 327/2019).",
      "Atendimento 100% online com Dr. Edilson Bezerra da Silva (CRM-SP 10963), médico especialista em Cannabis Medicinal e Farmacologia.",
      "Orientação Técnica a partir de R$30 (PIX, Cartão ou Bitcoin). PDF com selo gov.br válido para importação ANVISA.",
    ],
  },
  {
    path: "/como-funciona",
    title: "Como Funciona — Orientação Técnica de Cannabis Medicinal",
    description: "Em 5 etapas: triagem com a Brisa, pagamento PIX, orientação técnica com Dr. Edilson Bezerra, emissão de PDF e suporte para importação ANVISA.",
    h1: "Como Funciona a Orientação Técnica de Cannabis Medicinal",
    intro: [
      "1. Triagem inicial gratuita com a Enfermeira Brisa (IA) via WhatsApp.",
      "2. Pagamento seguro via PIX, Cartão de Crédito ou Bitcoin a partir de R$30.",
      "3. Orientação Técnica digital com o Dr. Edilson Bezerra (CRM-SP 10963).",
      "4. Emissão do relatório técnico em PDF com selo gov.br.",
      "5. Suporte para importação ANVISA (RDC 660/2022) e indicação de produtos.",
    ],
  },
  {
    path: "/precos",
    title: "Preços — Orientação Técnica de Cannabis a partir de R$30",
    description: "Orientação Técnica de Cannabis Medicinal a partir de R$30. Planos VIP (R$99), Pro (R$299), Premium (R$599) e Enterprise (R$1500). Club com descontos.",
    h1: "Preços de Orientação Técnica de Cannabis Medicinal",
    intro: [
      "Orientação Técnica inicial: R$30 (ou US$10).",
      "Planos Médicos: VIP (R$99), Pro (R$299), Premium (R$599), Enterprise (R$1500).",
      "Club Planta y Raiz (assinatura para pacientes): Basic (R$99), Pro (R$149), Premium (R$199).",
      "Métodos: PIX, Cartão de Crédito e Bitcoin (via Binance QR).",
    ],
  },
  {
    path: "/faq",
    title: "Perguntas Frequentes — Cannabis Medicinal e ANVISA",
    description: "Cannabis medicinal é legal no Brasil? Quanto custa? Quem é o médico? Respostas oficiais da Planta y Raiz sobre Orientação Técnica e RDC 660/2022.",
    h1: "Perguntas Frequentes sobre Cannabis Medicinal",
    intro: [
      "Sim, a Cannabis Medicinal é legal no Brasil via ANVISA (RDC 660/2022 e RDC 327/2019).",
      "A orientação técnica inicial custa R$30 (BRL) ou US$10. Inclui avaliação digital e relatório em PDF com selo gov.br.",
      "Dr. Edilson Bezerra da Silva, CRM-SP 10963, é o médico responsável especializado em Cannabis Medicinal.",
    ],
  },
  {
    path: "/shopping",
    title: "Shopping CBD — Óleos, Cápsulas e Acessórios | Planta y Raiz",
    description: "Shopping verificado de Cannabis Medicinal: óleos CBD, cápsulas, cremes e acessórios. Entrega em todo Brasil com nota fiscal e garantia.",
    h1: "Shopping Planta y Raiz — Produtos de Cannabis Medicinal",
    intro: [
      "Shopping verificado de produtos de Cannabis Medicinal com prescrição.",
      "Óleos CBD, cápsulas, cremes tópicos e acessórios de vaporização.",
      "Entrega em todo o Brasil com nota fiscal, lacre e garantia.",
    ],
  },
  {
    path: "/tratamentos",
    title: "Tratamentos com Cannabis Medicinal — Indicações | Planta y Raiz",
    description: "Tratamentos com cannabis medicinal: ansiedade, dor crônica, epilepsia, fibromialgia, insônia, Parkinson, autismo, esclerose múltipla, depressão e TDAH.",
    h1: "Tratamentos com Cannabis Medicinal",
    intro: [
      "Evidências científicas e prescrição especializada para diversas condições médicas.",
      "Veja os tratamentos disponíveis: ansiedade, dor crônica, epilepsia, fibromialgia, insônia, Parkinson, autismo, esclerose múltipla, depressão e TDAH.",
    ],
  },
];

function buildTreatmentHTML(t: TreatmentPage): string {
  return `
<article>
  <header>
    <p><span>CID: ${t.cid}</span> · <span>Evidências Científicas</span></p>
    <h1>${t.h1}</h1>
    <p>${t.paragraphs[0]}</p>
  </header>

  <section>
    <h2>Sobre o tratamento</h2>
    ${t.paragraphs.map((p) => `<p>${p}</p>`).join("\n    ")}
  </section>

  <section>
    <h2>Sintomas tratados</h2>
    <ul>
      ${t.symptoms.map((s) => `<li>${s}</li>`).join("\n      ")}
    </ul>
  </section>

  <section>
    <h2>Benefícios comprovados</h2>
    <ul>
      ${t.benefits.map((b) => `<li>${b}</li>`).join("\n      ")}
    </ul>
  </section>

  <section>
    <h2>Evidência científica</h2>
    <ol>
      ${t.studies.map((s) => `<li>${s.title}${s.source ? ` — <em>${s.source}</em>` : ""}${s.year ? ` (${s.year})` : ""}</li>`).join("\n      ")}
    </ol>
  </section>

  <section>
    <h2>Pronto para iniciar seu tratamento?</h2>
    <p>Orientação Técnica a partir de R$30 com Dr. Edilson Bezerra (CRM-SP 10963). 100% online.</p>
    <p><a href="/quiz">Iniciar Avaliação Gratuita</a> · <a href="/falar-com-especialista">Falar com Especialista</a></p>
  </section>
</article>`.trim();
}

function buildStaticHTML(p: StaticPage): string {
  return `
<article>
  <header>
    <h1>${p.h1}</h1>
  </header>
  <section>
    ${p.intro.map((line) => `<p>${line}</p>`).join("\n    ")}
  </section>
  <nav>
    <p>Veja também:
      <a href="/tratamentos/ansiedade">Ansiedade</a> ·
      <a href="/tratamentos/dor-cronica">Dor Crônica</a> ·
      <a href="/tratamentos/epilepsia">Epilepsia</a> ·
      <a href="/tratamentos/insonia">Insônia</a> ·
      <a href="/tratamentos/autismo">Autismo</a> ·
      <a href="/tratamentos/parkinson">Parkinson</a>
    </p>
  </nav>
</article>`.trim();
}

function buildMedicalSchema(t: TreatmentPage): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: t.title,
    description: t.description,
    url: `${BASE_URL}/tratamentos/${t.slug}`,
    about: { "@type": "MedicalCondition", name: t.h1, code: { "@type": "MedicalCode", codeValue: t.cid, codingSystem: "ICD-10" } },
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: (t.faq || []).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  });
}

/**
 * Reescreve o HTML base injetando:
 *  - <title> e <meta description> da rota
 *  - <link rel="canonical">
 *  - Conteúdo prerenderizado dentro de <div id="root">
 *  - Schema.org MedicalWebPage adicional
 */
function injectSEO(
  template: string,
  opts: { title: string; description: string; canonical: string; bodyHTML: string; extraJsonLd?: string }
): string {
  let html = template;

  // Substitui <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${opts.title}</title>`);

  // Substitui meta description
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="description" content="${opts.description.replace(/"/g, "&quot;")}">`
  );

  // Insere/atualiza canonical antes de </head>
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${opts.canonical}">`);
  } else {
    html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${opts.canonical}">\n  </head>`);
  }

  // og:url + og:title + og:description (canonical por página)
  const ogTags = `
    <meta property="og:title" content="${opts.title.replace(/"/g, "&quot;")}">
    <meta property="og:description" content="${opts.description.replace(/"/g, "&quot;")}">
    <meta property="og:url" content="${opts.canonical}">`;
  html = html.replace(/<\/head>/i, `${ogTags}\n  </head>`);

  // Schema.org extra (MedicalWebPage etc.)
  if (opts.extraJsonLd) {
    html = html.replace(
      /<\/head>/i,
      `  <script type="application/ld+json">${opts.extraJsonLd}</script>\n  </head>`
    );
  }

  // Injeta conteúdo SSR dentro de <div id="root"> — React vai substituir na hidratação
  html = html.replace(
    /<div id="root">\s*<\/div>/i,
    `<div id="root"><div id="prerender-seo" data-prerendered="true">${opts.bodyHTML}</div></div>`
  );

  return html;
}

function writeRoute(path: string, html: string) {
  const cleanPath = path === "/" ? "/index.html" : `${path}/index.html`;
  const fullPath = resolve(DIST, cleanPath.replace(/^\//, ""));
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, html, "utf-8");
}

function main() {
  const templatePath = resolve(DIST, "index.html");
  if (!existsSync(templatePath)) {
    console.warn("⚠️  dist/index.html não encontrado — pulando prerender SEO (rode vite build primeiro).");
    return;
  }
  const template = readFileSync(templatePath, "utf-8");

  let count = 0;

  // Páginas estáticas principais
  for (const p of STATIC_PAGES) {
    const html = injectSEO(template, {
      title: p.title,
      description: p.description,
      canonical: `${BASE_URL}${p.path === "/" ? "" : p.path}`,
      bodyHTML: buildStaticHTML(p),
    });
    writeRoute(p.path, html);
    count++;
  }

  // Páginas de tratamento (/tratamentos/:slug)
  for (const t of TREATMENTS) {
    const html = injectSEO(template, {
      title: t.title,
      description: t.description,
      canonical: `${BASE_URL}/tratamentos/${t.slug}`,
      bodyHTML: buildTreatmentHTML(t),
      extraJsonLd: buildMedicalSchema(t),
    });
    writeRoute(`/tratamentos/${t.slug}`, html);
    count++;
  }

  console.log(`✅ SEO Prerender: ${count} páginas geradas em dist/`);
}

main();
