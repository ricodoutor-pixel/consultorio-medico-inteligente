/**
 * Dynamic SEO config per route — titles, descriptions, keywords
 * Optimized for E-E-A-T, local SEO (São Paulo) and long-tail keywords
 *
 * Rules: title ≤ 60 chars, description 50–160 chars, único por rota.
 */

export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  h1?: string;
}

const BASE = "https://plantayraiz.com.br";

export const routeSEOMap: Record<string, PageSEO> = {
  // ===== 12 PÁGINAS PRIORITÁRIAS — E-E-A-T MÁXIMO (São Paulo + Brasil) =====
  "/": {
    title: "Cannabis Medicinal em São Paulo e Brasil | Planta y Raiz",
    description: "A maior plataforma de cannabis medicinal do Brasil: telemedicina 24/7, médicos prescritores com CRM validado em São Paulo e prescrição ANVISA digital a partir de R$30.",
    keywords: "cannabis medicinal São Paulo, tratamento cannabis medicinal Brasil, melhor clínica cannabis medicinal, consulta telemedicina canabinoide, especialistas medicina canabinoide",
    canonical: `${BASE}/`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Tratamento Especializado e Telemedicina 24/7",
  },
  "/nossa-historia": {
    title: "Nossa História | Cannabis Medicinal SP e Brasil — Planta y Raiz",
    description: "Conheça a história da Planta y Raiz: fundada por médicos sobreviventes da pandemia, hoje é a maior plataforma de cannabis medicinal em São Paulo e no Brasil.",
    keywords: "história Planta y Raiz, Dr Edilson Bezerra cannabis, clínica cannabis medicinal SP, autoridade cannabis medicinal Brasil",
    canonical: `${BASE}/nossa-historia`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Nossa História e DNA",
  },
  "/profissionais": {
    title: "Médicos Prescritores de Cannabis Medicinal SP e Brasil",
    description: "Time de médicos prescritores de cannabis medicinal em São Paulo e em todo Brasil. CRM validado, avaliações reais e teleconsulta com prescrição ANVISA a partir de R$30.",
    keywords: "médico cannabis medicinal São Paulo, prescritor CBD Brasil, especialistas medicina canabinoide, CRM cannabis SP",
    canonical: `${BASE}/profissionais`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Médicos Prescritores Especialistas",
  },
  "/telemedicina": {
    title: "Telemedicina de Cannabis Medicinal em SP e Brasil 24/7",
    description: "Consulta telemedicina canabinoide com especialistas em São Paulo e atendimento em todo Brasil. Videochamada segura, prescrição ANVISA imediata e suporte 24/7.",
    keywords: "consulta telemedicina canabinoide, telemedicina cannabis São Paulo, videoconsulta cannabis Brasil, acesso seguro cannabis medicinal",
    canonical: `${BASE}/telemedicina`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Telemedicina 24/7 com Especialistas",
  },
  "/shopping": {
    title: "Shopping de Cannabis Medicinal SP e Brasil | Planta y Raiz",
    description: "Marketplace verificado de cannabis medicinal em São Paulo com entrega em todo Brasil: óleos CBD, cápsulas, cremes e acessórios com nota fiscal e garantia ANVISA.",
    keywords: "comprar cannabis medicinal São Paulo, óleo CBD Brasil, marketplace cannabis medicinal, produtos canabinoides ANVISA",
    canonical: `${BASE}/shopping`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Shopping Verificado e Seguro",
  },
  "/saude-verde": {
    title: "Saúde Verde | Cannabis Medicinal em SP e Brasil",
    description: "Programa Saúde Verde da Planta y Raiz: planos de saúde digital com cannabis medicinal, telemedicina, descontos e acompanhamento contínuo em São Paulo e Brasil.",
    keywords: "saúde verde cannabis medicinal, plano cannabis São Paulo, programa cannabis Brasil, assinatura cannabis medicinal",
    canonical: `${BASE}/saude-verde`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Programa Saúde Verde",
  },
  "/biblioteca": {
    title: "Biblioteca Científica de Cannabis Medicinal — SP e Brasil",
    description: "Acervo científico de cannabis medicinal: estudos clínicos, farmacologia, dosimetria e protocolos ANVISA revisados por especialistas em São Paulo e Brasil.",
    keywords: "biblioteca cannabis medicinal, estudos canabinoides Brasil, farmacologia CBD, pesquisa cannabis medicinal São Paulo",
    canonical: `${BASE}/biblioteca`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Biblioteca Científica",
  },
  "/comunidade": {
    title: "Comunidade Cannabis Medicinal SP e Brasil | Planta y Raiz",
    description: "Maior comunidade de pacientes e médicos de cannabis medicinal em São Paulo e Brasil: experiências reais, suporte 24/7 e conteúdo revisado por especialistas.",
    keywords: "comunidade cannabis medicinal Brasil, fórum cannabis São Paulo, grupo pacientes canabinoides, suporte cannabis medicinal",
    canonical: `${BASE}/comunidade`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Comunidade Oficial Planta y Raiz",
  },
  "/dashboard": {
    title: "Meu Painel | Cannabis Medicinal SP e Brasil — Planta y Raiz",
    description: "Seu painel de tratamento com cannabis medicinal: prescrições ANVISA, agendamentos, histórico clínico e suporte 24/7 com especialistas em SP e Brasil.",
    keywords: "painel paciente cannabis medicinal, dashboard cannabis São Paulo, gestão tratamento canabinoide Brasil",
    canonical: `${BASE}/dashboard`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Meu Painel de Tratamento",
  },
  "/afiliados": {
    title: "Afiliados Cannabis Medicinal SP e Brasil | Planta y Raiz",
    description: "Programa de afiliados da maior plataforma de cannabis medicinal do Brasil. Indique pacientes em São Paulo e todo país e ganhe comissões recorrentes.",
    keywords: "afiliados cannabis medicinal Brasil, indicação cannabis São Paulo, programa parceiros canabinoides",
    canonical: `${BASE}/afiliados`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Programa de Afiliados Planta y Raiz",
  },
  "/planos": {
    title: "Planos de Cannabis Medicinal SP e Brasil — desde R$30",
    description: "Planos de tratamento com cannabis medicinal em São Paulo e Brasil: orientação técnica desde R$30, assinatura Club e planos VIP, Pro e Premium com benefícios.",
    keywords: "planos cannabis medicinal São Paulo, assinatura cannabis Brasil, preço telemedicina canabinoide, club Planta y Raiz",
    canonical: `${BASE}/planos`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Planos e Assinaturas a partir de R$30",
  },
  "/tratamentos": {
    title: "Tratamento com Cannabis Medicinal em SP e Brasil",
    description: "Tratamento com cannabis medicinal no Brasil para ansiedade, dor crônica, insônia, epilepsia, fibromialgia e Parkinson. Especialistas em São Paulo, prescrição ANVISA.",
    keywords: "tratamento cannabis medicinal Brasil, cannabis medicinal São Paulo, melhor tratamento canabinoide, indicações CBD ANVISA",
    canonical: `${BASE}/tratamentos`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Tratamentos e Indicações Clínicas",
  },

  // ===== Demais páginas (SEO padrão) =====
  "/como-funciona": {
    title: "Como Funciona — Cannabis Medicinal SP e Brasil",
    description: "Da triagem por IA à prescrição digital ANVISA: teleconsulta em 5 etapas, pagamento via Pix e atendimento 24/7 com médicos especialistas em SP e Brasil.",
    keywords: "como funciona cannabis medicinal, teleconsulta passo a passo, prescrição ANVISA",
    canonical: `${BASE}/como-funciona`,
  },
  "/faq": {
    title: "FAQ Cannabis Medicinal — ANVISA e Legalidade",
    description: "Cannabis medicinal é legal? Como funciona a prescrição ANVISA? Quanto custa? Respostas claras sobre tratamento com CBD e THC no Brasil.",
    keywords: "FAQ cannabis medicinal, perguntas CBD, cannabis legal Brasil, ANVISA cannabis",
    canonical: `${BASE}/faq`,
  },
  "/ebook": {
    title: "E-book Grátis: Guia de Cannabis Medicinal",
    description: "Baixe o guia completo de cannabis medicinal: farmacologia, dosimetria, legislação ANVISA e casos clínicos reais em 12 capítulos.",
    keywords: "ebook cannabis medicinal, guia CBD grátis, curso cannabis medicinal, farmacologia",
    canonical: `${BASE}/ebook`,
  },
  "/tratamento-dor-cronica": {
    title: "Cannabis para Dor Crônica em São Paulo",
    description: "Tratamento de dor crônica com cannabis medicinal: fibromialgia, artrite e dores neuropáticas. Teleconsulta a partir de R$30 com prescrição ANVISA.",
    keywords: "dor crônica cannabis medicinal, fibromialgia CBD, artrite cannabis SP, dor neuropática",
    canonical: `${BASE}/tratamento-dor-cronica`,
    h1: "Tratamento de Dor Crônica com Cannabis Medicinal em São Paulo",
  },
  "/tratamento-ansiedade-saude-mental": {
    title: "Cannabis para Ansiedade e Insônia — SP",
    description: "Tratamento de ansiedade, insônia e burnout com cannabis medicinal. CBD para saúde mental, teleconsulta a partir de R$30 com prescrição ANVISA.",
    keywords: "ansiedade cannabis medicinal, CBD insônia, burnout CBD, saúde mental cannabis SP",
    canonical: `${BASE}/tratamento-ansiedade-saude-mental`,
    h1: "Tratamento com Cannabis Medicinal para Ansiedade e Insônia em São Paulo",
  },
  "/blog": {
    title: "Blog Cannabis Medicinal — Notícias e Estudos",
    description: "Artigos científicos, notícias e dicas sobre cannabis medicinal, CBD, THC e ANVISA. Conteúdo revisado por médicos especializados.",
    keywords: "blog cannabis medicinal, notícias CBD, artigos THC medicinal, ANVISA",
    canonical: `${BASE}/blog`,
  },
  "/contato": {
    title: "Contato — Planta y Raiz Cannabis Medicinal",
    description: "Fale com a Planta y Raiz: WhatsApp, e-mail e chat. Suporte para pacientes e médicos em São Paulo e em todo o Brasil.",
    keywords: "contato planta raiz, suporte cannabis medicinal, WhatsApp planta raiz",
    canonical: `${BASE}/contato`,
  },
  "/precos": {
    title: "Preços de Consulta de Cannabis Medicinal",
    description: "Tabela de preços da Planta y Raiz: Orientação Técnica a partir de R$30, planos VIP, Pro e Premium e assinatura Club com descontos.",
    keywords: "preço cannabis medicinal, valor consulta CBD, planos telemedicina cannabis",
    canonical: `${BASE}/precos`,
  },
  "/club": {
    title: "Club Planta y Raiz — Assinatura com Benefícios",
    description: "Assine o Club Planta y Raiz: consultas com desconto, produtos exclusivos, conteúdo premium e comunidade de cannabis medicinal.",
    keywords: "club cannabis medicinal, assinatura CBD, benefícios planta raiz",
    canonical: `${BASE}/club`,
  },
  "/cadastro": {
    title: "Cadastro — Planta y Raiz Cannabis Medicinal",
    description: "Crie sua conta gratuita e comece o tratamento com cannabis medicinal. Cadastro rápido, seguro e em conformidade com a LGPD.",
    keywords: "cadastro cannabis medicinal, criar conta planta raiz, registro telemedicina",
    canonical: `${BASE}/cadastro`,
  },
  "/login": {
    title: "Login — Acesse sua Conta Planta y Raiz",
    description: "Acesse sua conta na Planta y Raiz para ver Orientações Técnicas, prescrições e o acompanhamento do seu tratamento com cannabis medicinal.",
    keywords: "login planta raiz, acessar conta cannabis medicinal",
    canonical: `${BASE}/login`,
  },
  "/agendamento": {
    title: "Agendar Teleconsulta de Cannabis Medicinal",
    description: "Agende sua teleconsulta com médico especialista em cannabis medicinal. Horários flexíveis, pagamento via Pix e atendimento em todo o Brasil.",
    keywords: "agendar consulta cannabis, teleconsulta CBD, agendamento médico cannabis",
    canonical: `${BASE}/agendamento`,
  },
  "/legal": {
    title: "Termos de Uso e Privacidade — Planta y Raiz",
    description: "Termos de uso, política de privacidade e conformidade LGPD da Planta y Raiz. Transparência e segurança no tratamento dos seus dados.",
    keywords: "termos uso planta raiz, política privacidade, LGPD cannabis medicinal",
    canonical: `${BASE}/legal`,
  },
  "/pay": {
    title: "Pagamento Seguro — Planta y Raiz",
    description: "Finalize seu pagamento de Orientação Técnica de cannabis medicinal de forma segura via Pix, cartão de crédito ou Bitcoin.",
    keywords: "pagamento cannabis medicinal, checkout planta raiz, pix consulta CBD",
    canonical: `${BASE}/pay`,
  },
  "/carteira": {
    title: "Carteira Digital — Planta y Raiz",
    description: "Acompanhe seu saldo, créditos, comissões e histórico de pagamentos da Planta y Raiz em uma carteira digital segura.",
    keywords: "carteira planta raiz, saldo cannabis medicinal, créditos consulta",
    canonical: `${BASE}/carteira`,
  },
};

/**
 * Get SEO config for a given pathname, with fallback
 */
export function getPageSEO(pathname: string): PageSEO {
  // Exact match
  if (routeSEOMap[pathname]) return routeSEOMap[pathname];

  // Match base route (e.g. /tratamentos/ansiedade → /tratamentos)
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  if (routeSEOMap[base]) return routeSEOMap[base];

  // Default fallback — rota-aware no canonical para evitar duplicação
  const slug = pathname.replace(/^\//, "").replace(/\W+/g, " ").trim();
  const titleSuffix = slug ? ` — ${slug.charAt(0).toUpperCase() + slug.slice(1)}` : "";
  return {
    title: `Planta y Raiz — Cannabis Medicinal${titleSuffix}`.slice(0, 60),
    description: "Teleconsulta de cannabis medicinal a partir de R$30 com prescrição ANVISA, triagem por IA e atendimento 24/7 em todo o Brasil.",
    keywords: "cannabis medicinal, telemedicina, CBD, THC, ANVISA, consulta online",
    canonical: `${BASE}${pathname}`,
  };
}
