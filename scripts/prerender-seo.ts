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
  {
    path: "/telemedicina",
    title: "Telemedicina Cannabis Medicinal — Consulta Online | Planta y Raiz",
    description: "Telemedicina especializada em Cannabis Medicinal 100% online. Consulta com Dr. Edilson Bezerra (CRM 10963) por videochamada criptografada, prescrição digital e suporte ANVISA.",
    h1: "Telemedicina de Cannabis Medicinal — 100% Online",
    intro: [
      "Atendimento por videochamada segura (Jitsi WebRTC) com Dr. Edilson Bezerra da Silva — CRM-SP 10963.",
      "Prescrição digital com assinatura ICP-Brasil e selo gov.br, válida em farmácias e para importação ANVISA.",
      "Disponível em todo o Brasil — São Paulo, Rio de Janeiro, Brasília, Belo Horizonte, Salvador, Curitiba, Porto Alegre, Recife, Fortaleza e demais capitais.",
    ],
  },
  {
    path: "/profissionais",
    title: "Médicos Prescritores de Cannabis Medicinal | Planta y Raiz",
    description: "Conheça os médicos prescritores da Planta y Raiz — especialistas em Cannabis Medicinal regulamentados pela ANVISA e CFM. Dr. Edilson Bezerra CRM 10963 e equipe.",
    h1: "Médicos Prescritores de Cannabis Medicinal",
    intro: [
      "Equipe médica especializada em Cannabis Medicinal, treinada na RDC 660/2022 e RDC 327/2019 da ANVISA.",
      "Dr. Edilson Bezerra da Silva (CRM-SP 10963) — coordenador médico, especialista em Cannabis Medicinal e Farmacologia.",
      "Atendimento ético, sigiloso e baseado em evidências científicas.",
    ],
  },
  {
    path: "/biblioteca",
    title: "Biblioteca Científica de Cannabis Medicinal — Strains, Terpenos, Estudos",
    description: "Maior biblioteca científica de Cannabis Medicinal do Brasil: variedades (strains), terpenos, canabinoides (CBD, THC, CBG, CBN), estudos clínicos e indicações terapêuticas.",
    h1: "Biblioteca Científica de Cannabis Medicinal",
    intro: [
      "Mais de 100 variedades catalogadas: Sativa, Indica, Híbridas, Alto CBD e Medicinais.",
      "Perfis de terpenos (mirceno, limoneno, pineno, linalol, cariofileno) e canabinoides (CBD, THC, CBG, CBN, CBC).",
      "Mais de 1.000 estudos científicos sobre modulação do sistema endocanabinoide humano.",
    ],
  },
  {
    path: "/club",
    title: "Club Planta y Raiz — Assinatura de Cannabis Medicinal",
    description: "Club Planta y Raiz: assinatura mensal com descontos em produtos CBD, orientação técnica recorrente, conteúdo exclusivo e comunidade. Planos a partir de R$99/mês.",
    h1: "Club Planta y Raiz — Sua Assinatura de Bem-Estar Canabinoide",
    intro: [
      "Assinatura mensal com benefícios exclusivos para pacientes de Cannabis Medicinal.",
      "Planos: Basic R$99, Pro R$149, Premium R$199 — descontos no shopping, orientação técnica recorrente e comunidade ativa.",
      "Sem taxa de intermediação para o assinante e cancelamento a qualquer momento.",
    ],
  },
  {
    path: "/blog",
    title: "Blog Cannabis Medicinal — Notícias, Pesquisas e Casos | Planta y Raiz",
    description: "Blog oficial da Planta y Raiz com artigos sobre Cannabis Medicinal, CBD, THC, regulamentação ANVISA, casos clínicos e novidades em medicina canabinoide.",
    h1: "Blog Cannabis Medicinal — Planta y Raiz",
    intro: [
      "Artigos atualizados sobre Cannabis Medicinal, regulamentação brasileira e pesquisas científicas.",
      "Casos clínicos reais, depoimentos de pacientes e novidades em produtos CBD e THC medicinal.",
    ],
  },
  {
    path: "/agendamento",
    title: "Agendar Consulta de Cannabis Medicinal Online — Planta y Raiz",
    description: "Agende sua consulta online de Cannabis Medicinal com médico especialista. Atendimento por videochamada com PIX a partir de R$30. Confirmação imediata via WhatsApp.",
    h1: "Agende sua Orientação Técnica de Cannabis Medicinal",
    intro: [
      "Agendamento 100% online com confirmação imediata pelo WhatsApp.",
      "Atendimento por videochamada segura com Dr. Edilson Bezerra (CRM-SP 10963).",
      "Pagamento via PIX, Cartão de Crédito ou Bitcoin — a partir de R$30.",
    ],
  },
  {
    path: "/tratamento-dor-cronica",
    title: "Tratamento de Dor Crônica com Cannabis Medicinal | Planta y Raiz",
    description: "Tratamento de dor crônica (fibromialgia, lombalgia, neuropatia, artrite) com Cannabis Medicinal. Orientação técnica com Dr. Edilson Bezerra. CBD e THC regulamentados.",
    h1: "Tratamento de Dor Crônica com Cannabis Medicinal",
    intro: [
      "A Cannabis Medicinal é uma alternativa baseada em evidências para o manejo da dor crônica.",
      "Indicações: fibromialgia, dor lombar crônica, neuropatia diabética, dor oncológica, artrite e enxaqueca.",
      "Orientação técnica especializada com Dr. Edilson Bezerra (CRM-SP 10963).",
    ],
  },
  {
    path: "/tratamento-ansiedade-saude-mental",
    title: "Cannabis Medicinal para Ansiedade e Saúde Mental | Planta y Raiz",
    description: "Tratamento de ansiedade, depressão, insônia e TEPT com Cannabis Medicinal (CBD). Atendimento online com Dr. Edilson Bezerra (CRM 10963) regulamentado ANVISA.",
    h1: "Cannabis Medicinal para Ansiedade, Depressão e Saúde Mental",
    intro: [
      "O CBD (canabidiol) possui propriedades ansiolíticas e antidepressivas comprovadas em estudos clínicos.",
      "Indicações: ansiedade generalizada, transtorno do pânico, depressão, insônia e TEPT.",
      "Atendimento ético e baseado em evidências com Dr. Edilson Bezerra (CRM-SP 10963).",
    ],
  },
  {
    path: "/faq",
    title: "FAQ — Cannabis Medicinal, ANVISA e Legalidade | Planta y Raiz",
    description: "Cannabis medicinal é legal? Como funciona a prescrição ANVISA? Quanto custa? Tire suas dúvidas com respostas claras do Dr. Edilson Bezerra (CRM-SP 10963).",
    h1: "Perguntas Frequentes sobre Cannabis Medicinal",
    intro: [
      "Cannabis Medicinal é legal no Brasil — regulamentada pela ANVISA via RDC 660/2022 (importação) e RDC 327/2019 (produtos nacionais).",
      "Orientação Técnica a partir de R$30 com Dr. Edilson Bezerra (CRM-SP 10963). PDF com selo gov.br.",
      "Dúvidas sobre dosagem, indicações, importação, prescrição e segurança são respondidas por médico habilitado.",
    ],
  },
  {
    path: "/contato",
    title: "Contato — Planta y Raiz Cannabis Medicinal",
    description: "Fale com a Planta y Raiz: WhatsApp da Enfª Brisa, e-mail e chat. Suporte para pacientes e médicos em São Paulo e em todo o Brasil.",
    h1: "Fale Conosco — Planta y Raiz",
    intro: [
      "WhatsApp Enfª Brisa: +55 11 99136-3154 — triagem e suporte 24/7.",
      "Atendimento humano com Dr. Edilson Bezerra (CRM-SP 10963) para Cannabis Medicinal.",
      "Suporte para pacientes, médicos parceiros e importação ANVISA.",
    ],
  },
  {
    path: "/cadastro-profissional",
    title: "Cadastro de Médicos Prescritores — Planta y Raiz",
    description: "Sou médico e quero prescrever Cannabis Medicinal: cadastre-se na Planta y Raiz, valide seu CRM e atenda pacientes em todo o Brasil com suporte ANVISA.",
    h1: "Cadastro de Médicos Prescritores de Cannabis Medicinal",
    intro: [
      "Plataforma de telemedicina para médicos prescritores de Cannabis Medicinal.",
      "Validação automática de CRM via Brasil API, treinamento RDC 660/2022 e RDC 327/2019.",
      "Repasses semanais via Pix com split automático — 80% a 92% para o médico.",
    ],
  },
  {
    path: "/falar-com-especialista",
    title: "Falar com Especialista em Cannabis Medicinal | Planta y Raiz",
    description: "Fale agora com um médico especialista em Cannabis Medicinal. Atendimento online com Dr. Edilson Bezerra (CRM-SP 10963) a partir de R$30 via Pix.",
    h1: "Falar com Especialista em Cannabis Medicinal",
    intro: [
      "Atendimento direto com Dr. Edilson Bezerra (CRM-SP 10963), especialista em Cannabis Medicinal e Farmacologia.",
      "Orientação Técnica online a partir de R$30 — PDF com selo gov.br válido para importação ANVISA.",
      "Resposta em até 24h via WhatsApp ou videochamada.",
    ],
  },
  {
    path: "/afiliados",
    title: "Programa de Afiliados — Planta y Raiz Cannabis Medicinal",
    description: "Indique pacientes e ganhe comissões recorrentes. Programa de afiliados Planta y Raiz: 3 gerações (25%, 15%, 10%), saque mínimo R$100 via Pix.",
    h1: "Programa de Afiliados Planta y Raiz",
    intro: [
      "Indique pacientes e parceiros e receba comissões em 3 gerações: 25%, 15% e 10%.",
      "Dashboard em tempo real, saque mínimo R$100 via Pix e materiais prontos para divulgação.",
      "Indicado para profissionais de saúde, criadores de conteúdo e pacientes satisfeitos.",
    ],
  },
  {
    path: "/consulta-rapida",
    title: "Consulta Rápida de Cannabis Medicinal Online | Planta y Raiz",
    description: "Consulta rápida online para Cannabis Medicinal em menos de 30 minutos. Orientação Técnica com Dr. Edilson Bezerra (CRM-SP 10963) por apenas R$30 via Pix.",
    h1: "Consulta Rápida de Cannabis Medicinal",
    intro: [
      "Atendimento em até 30 minutos para casos urgentes (insônia, dor, ansiedade, importação ANVISA).",
      "Pagamento Pix instantâneo a partir de R$30 — videochamada ou WhatsApp.",
      "Relatório técnico (PDF) emitido em até 24h.",
    ],
  },
  {
    path: "/quiz-triagem",
    title: "Quiz de Triagem para Cannabis Medicinal | Planta y Raiz",
    description: "Faça o quiz de triagem da Enfª Brisa e descubra em 2 minutos se a Cannabis Medicinal pode ajudar no seu caso. Gratuito, anônimo e baseado em evidências.",
    h1: "Quiz de Triagem para Cannabis Medicinal",
    intro: [
      "Triagem gratuita conduzida pela Enfª Brisa (IA clínica) em menos de 2 minutos.",
      "Avaliação baseada em sintomas, histórico e indicações da RDC 660/2022.",
      "Você recebe um relatório personalizado e, se elegível, agenda Orientação Técnica com Dr. Edilson Bezerra.",
    ],
  },
  {
    path: "/ebook-gratis",
    title: "E-book Grátis: Guia de Cannabis Medicinal | Planta y Raiz",
    description: "Baixe gratuitamente o guia completo de Cannabis Medicinal — 12 capítulos sobre farmacologia, dosimetria, ANVISA, casos clínicos e legislação.",
    h1: "E-book Grátis — Guia Completo de Cannabis Medicinal",
    intro: [
      "12 capítulos sobre farmacologia, dosimetria, RDC 660/2022, casos clínicos reais e legislação ANVISA.",
      "Material gratuito revisado por Dr. Edilson Bezerra (CRM-SP 10963).",
      "Indicado para pacientes, médicos, farmacêuticos e estudantes.",
    ],
  },
  {
    path: "/ebook-medicina-canabinoide",
    title: "E-book: Medicina Canabinoide do Brasil | Planta y Raiz",
    description: "E-book completo de Medicina Canabinoide — sistema endocanabinoide, CBD, THC, terpenos, dosagem, indicações e protocolos clínicos da Planta y Raiz.",
    h1: "Medicina Canabinoide — E-book Planta y Raiz",
    intro: [
      "Conteúdo aprofundado sobre o sistema endocanabinoide humano, fitocanabinoides e terpenos.",
      "Protocolos clínicos para ansiedade, dor crônica, epilepsia, autismo, insônia e mais.",
      "Material complementar para profissionais de saúde e pacientes informados.",
    ],
  },
  {
    path: "/dispensario",
    title: "Dispensário de Cannabis Medicinal Online | Planta y Raiz",
    description: "Dispensário verificado de Cannabis Medicinal com produtos importados e nacionais — óleos CBD, full-spectrum, broad-spectrum, isolado e flores medicinais.",
    h1: "Dispensário Planta y Raiz",
    intro: [
      "Produtos verificados de Cannabis Medicinal com prescrição e suporte ANVISA.",
      "Óleos CBD/THC, full-spectrum, broad-spectrum, isolado, cápsulas, cremes e flores medicinais.",
      "Entrega em todo o Brasil com nota fiscal, lacre e garantia.",
    ],
  },
  {
    path: "/acompanhamento",
    title: "Acompanhamento do Tratamento de Cannabis | Planta y Raiz",
    description: "Acompanhe seu tratamento com Cannabis Medicinal em tempo real — dosagem, sintomas, evolução clínica e próximos passos com a Enfª Brisa e Dr. Edilson Bezerra.",
    h1: "Acompanhamento do Tratamento",
    intro: [
      "Dashboard com dosagem, sintomas e evolução clínica registrados pela Enfª Brisa.",
      "Reavaliação periódica com Dr. Edilson Bezerra (CRM-SP 10963).",
      "Alertas inteligentes para ajuste de dose, reposição e renovação de prescrição.",
    ],
  },
  {
    path: "/cursos",
    title: "Cursos de Cannabis Medicinal | Planta y Raiz",
    description: "Cursos online de Cannabis Medicinal para médicos, farmacêuticos e pacientes. Conteúdo baseado em evidências e regulamentação ANVISA (RDC 660 e 327).",
    h1: "Cursos de Cannabis Medicinal — Planta y Raiz",
    intro: [
      "Formação continuada em Cannabis Medicinal para profissionais de saúde.",
      "Conteúdo prático sobre dosagem, indicações, interações e regulamentação.",
      "Certificados reconhecidos por entidades de educação continuada.",
    ],
  },
  {
    path: "/forum",
    title: "Fórum Cannabis Medicinal — Comunidade | Planta y Raiz",
    description: "Maior fórum brasileiro de Cannabis Medicinal: dúvidas, depoimentos, indicações de produtos e troca de experiências entre pacientes e profissionais.",
    h1: "Fórum Cannabis Medicinal",
    intro: [
      "Comunidade brasileira de pacientes e profissionais de Cannabis Medicinal.",
      "Discuta tratamentos, produtos, importação ANVISA e regulamentação.",
      "Moderação por equipe médica da Planta y Raiz.",
    ],
  },
  {
    path: "/comunidade",
    title: "Comunidade Planta y Raiz — Cannabis Medicinal Brasil",
    description: "Comunidade Planta y Raiz: pacientes, médicos, farmacêuticos e familiares unidos pelo acesso à Cannabis Medicinal regulamentada no Brasil.",
    h1: "Comunidade Planta y Raiz",
    intro: [
      "Comunidade ativa de pacientes, familiares e profissionais de Cannabis Medicinal.",
      "Eventos, grupos de apoio, lives com médicos e suporte emocional.",
      "Espaço seguro, moderado e em conformidade com a LGPD.",
    ],
  },
  {
    path: "/webinars",
    title: "Webinars de Cannabis Medicinal | Planta y Raiz",
    description: "Webinars ao vivo sobre Cannabis Medicinal com Dr. Edilson Bezerra (CRM-SP 10963) e convidados. Temas: dosimetria, indicações, importação ANVISA e mais.",
    h1: "Webinars de Cannabis Medicinal",
    intro: [
      "Aulas ao vivo com Dr. Edilson Bezerra (CRM-SP 10963) e convidados especialistas.",
      "Temas: dosimetria, indicações clínicas, importação ANVISA, casos reais e novidades.",
      "Acesso gratuito mediante cadastro — gravações disponíveis para assinantes Club.",
    ],
  },
  {
    path: "/voluntarios",
    title: "Programa de Voluntários — Planta y Raiz",
    description: "Programa de voluntariado da Planta y Raiz: ajude pacientes em situação de vulnerabilidade a acessar Cannabis Medicinal com Orientação Técnica gratuita.",
    h1: "Voluntários Planta y Raiz",
    intro: [
      "Programa de voluntariado para democratizar o acesso à Cannabis Medicinal.",
      "Pacientes em vulnerabilidade social recebem Orientação Técnica gratuita.",
      "Médicos, farmacêuticos e influenciadores podem se cadastrar como voluntários.",
    ],
  },
  {
    path: "/impacto",
    title: "Impacto Social — Planta y Raiz Cannabis Medicinal",
    description: "Relatório de impacto social da Planta y Raiz: pacientes atendidos, prescrições emitidas, redução de custos com importação ANVISA e democratização do acesso.",
    h1: "Impacto Social da Planta y Raiz",
    intro: [
      "Democratização do acesso à Cannabis Medicinal regulamentada no Brasil.",
      "Mais de 10 mil pacientes atendidos com Orientação Técnica acessível.",
      "Redução média de 60% no custo de importação ANVISA via parcerias.",
    ],
  },
  {
    path: "/legal",
    title: "Termos, Privacidade e LGPD | Planta y Raiz",
    description: "Termos de uso, política de privacidade, política de reembolso e conformidade LGPD da Planta y Raiz. Transparência total no tratamento dos seus dados.",
    h1: "Termos, Privacidade e Conformidade Legal",
    intro: [
      "Planta y Raiz opera em conformidade com a LGPD, CFM e ANVISA (RDC 660/2022 e 327/2019).",
      "Dados criptografados em repouso (AES-256) e em trânsito (TLS 1.3).",
      "Direito ao esquecimento e portabilidade de dados garantidos.",
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
