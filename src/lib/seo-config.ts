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
  "/": {
    title: "Cannabis Medicinal Online R$30 — Planta y Raiz",
    description: "Teleconsulta com médicos prescritores de cannabis medicinal a partir de R$30. Prescrição digital ANVISA, triagem por IA e atendimento em SP e Brasil.",
    keywords: "telemedicina cannabis medicinal, consulta CBD R$30, prescrição ANVISA online, médico cannabis SP",
    canonical: `${BASE}/`,
    h1: "Teleconsulta de Cannabis Medicinal em São Paulo — Médicos Prescritores a R$30",
  },
  "/profissionais": {
    title: "Médicos Prescritores de Cannabis Medicinal SP",
    description: "Médicos prescritores de cannabis medicinal verificados, com CRM validado e avaliações reais. Consulta online a partir de R$30 via Pix.",
    keywords: "médico cannabis medicinal SP, prescritor CBD, especialista THC, CRM cannabis",
    canonical: `${BASE}/profissionais`,
  },
  "/como-funciona": {
    title: "Como Funciona a Teleconsulta — Planta y Raiz",
    description: "Da triagem por IA à prescrição digital ANVISA: teleconsulta em 5 etapas, pagamento via Pix e atendimento 24/7 com médicos especialistas.",
    keywords: "como funciona cannabis medicinal, teleconsulta passo a passo, prescrição ANVISA",
    canonical: `${BASE}/como-funciona`,
  },
  "/shopping": {
    title: "Shopping CBD — Óleos e Acessórios | Planta y Raiz",
    description: "Marketplace verificado de cannabis medicinal: óleos CBD, cápsulas, cremes e acessórios. Entrega em todo Brasil com nota fiscal e garantia.",
    keywords: "comprar CBD, óleo cannabis medicinal, marketplace cannabis, produtos CBD Brasil",
    canonical: `${BASE}/shopping`,
  },
  "/faq": {
    title: "FAQ Cannabis Medicinal — ANVISA e Legalidade",
    description: "Cannabis medicinal é legal? Como funciona a prescrição ANVISA? Quanto custa? Respostas claras sobre tratamento com CBD e THC no Brasil.",
    keywords: "FAQ cannabis medicinal, perguntas CBD, cannabis legal Brasil, ANVISA cannabis",
    canonical: `${BASE}/faq`,
  },
  "/telemedicina": {
    title: "Telemedicina Cannabis 24/7 — Planta y Raiz",
    description: "Atendimento médico online 24/7 especializado em cannabis medicinal. Videoconsulta com prescritores e protocolo ANVISA automático.",
    keywords: "telemedicina cannabis, consulta online cannabis medicinal, videochamada médico CBD",
    canonical: `${BASE}/telemedicina`,
  },
  "/biblioteca": {
    title: "Biblioteca Científica de Cannabis Medicinal",
    description: "Acervo científico de cannabis medicinal: estudos clínicos, farmacologia, dosimetria e conformidade ANVISA. Educação médica continuada.",
    keywords: "estudos cannabis medicinal, pesquisa CBD, farmacologia canabinoides, biblioteca científica",
    canonical: `${BASE}/biblioteca`,
  },
  "/tratamentos": {
    title: "Tratamentos com Cannabis Medicinal — Indicações",
    description: "Tratamentos com cannabis medicinal para ansiedade, dor crônica, epilepsia, fibromialgia, insônia e Parkinson. Evidências e protocolo ANVISA.",
    keywords: "tratamento cannabis medicinal, CBD ansiedade, cannabis dor crônica, epilepsia canabidiol",
    canonical: `${BASE}/tratamentos`,
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
  "/planos": {
    title: "Planos e Preços — Cannabis a partir de R$30",
    description: "Planos de teleconsulta da Planta y Raiz: Orientações Técnicas a partir de R$30 e assinatura Club com benefícios e descontos exclusivos.",
    keywords: "preço consulta cannabis medicinal, planos telemedicina, assinatura cannabis",
    canonical: `${BASE}/planos`,
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
  "/comunidade": {
    title: "Comunidade Cannabis Medicinal — Fórum",
    description: "Maior comunidade brasileira de cannabis medicinal: compartilhe experiências, tire dúvidas e conecte-se com pacientes e profissionais.",
    keywords: "comunidade cannabis medicinal, fórum CBD, grupo pacientes cannabis",
    canonical: `${BASE}/comunidade`,
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
