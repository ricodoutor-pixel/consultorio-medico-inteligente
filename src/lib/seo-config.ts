/**
 * Dynamic SEO config per route — titles, descriptions, keywords
 * Optimized for E-E-A-T, local SEO (São Paulo) and long-tail keywords
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
    title: "Teleconsulta Cannabis Medicinal SP | Orientação Técnica CBD R$30 — Planta & Raiz",
    description: "Médicos prescritores de cannabis medicinal em São Paulo. Orientação Técnica online a partir de R$30 com prescrição digital ANVISA, triagem por IA e farmácia parceira. Agende agora!",
    keywords: "telemedicina cannabis medicinal, consulta CBD R$30, médicos prescritores de cannabis, prescrição ANVISA online, cannabis medicinal São Paulo, dor crônica cannabis, saúde mental cannabis",
    canonical: `${BASE}/`,
    h1: "Teleconsulta de Cannabis Medicinal em São Paulo — Médicos Prescritores a R$30",
  },
  "/profissionais": {
    title: "Médicos Especialistas em Cannabis Medicinal | São Paulo — Planta & Raiz",
    description: "Encontre médicos prescritores de cannabis medicinal verificados em São Paulo. CRM validado, avaliações reais e consulta a partir de R$30 via Pix.",
    keywords: "médico cannabis medicinal SP, prescritor CBD, especialista THC São Paulo, CRM cannabis",
    canonical: `${BASE}/profissionais`,
  },
  "/como-funciona": {
    title: "Como Funciona a Teleconsulta de Cannabis Medicinal | Planta & Raiz",
    description: "Passo a passo completo: da triagem por IA à prescrição digital ANVISA. Teleconsulta em 5 etapas, pagamento via Pix e atendimento 24/7.",
    keywords: "como funciona cannabis medicinal, teleconsulta passo a passo, prescrição digital ANVISA",
    canonical: `${BASE}/como-funciona`,
  },
  "/shopping": {
    title: "Shopping Cannabis Medicinal | CBD, Óleos e Acessórios — Planta & Raiz",
    description: "Marketplace verificado de produtos de cannabis medicinal: óleos CBD, cápsulas, cremes e acessórios. Entrega em todo Brasil com nota fiscal.",
    keywords: "comprar CBD, óleo cannabis medicinal, marketplace cannabis, produtos CBD Brasil",
    canonical: `${BASE}/shopping`,
  },
  "/faq": {
    title: "Perguntas Frequentes sobre Cannabis Medicinal | ANVISA, Legalidade — Planta & Raiz",
    description: "Tire suas dúvidas: cannabis medicinal é legal? Como funciona a prescrição ANVISA? Quanto custa? Respostas completas sobre tratamento com CBD e THC.",
    keywords: "FAQ cannabis medicinal, perguntas frequentes CBD, cannabis legal Brasil, ANVISA cannabis",
    canonical: `${BASE}/faq`,
  },
  "/telemedicina": {
    title: "Telemedicina Cannabis Medicinal 24/7 | Orientação Técnica Online SP — Planta & Raiz",
    description: "Atendimento médico online 24/7 especializado em cannabis medicinal. Videoconsulta ou chat com prescritores em São Paulo. Protocolo ANVISA automático.",
    keywords: "telemedicina cannabis, consulta online cannabis medicinal, videochamada médico CBD",
    canonical: `${BASE}/telemedicina`,
  },
  "/biblioteca": {
    title: "Biblioteca Científica de Cannabis Medicinal | Estudos e Pesquisas — Planta & Raiz",
    description: "Acervo científico completo sobre cannabis medicinal: estudos clínicos, farmacologia, dosimetria e conformidade ANVISA. Educação médica continuada.",
    keywords: "estudos cannabis medicinal, pesquisa CBD, farmacologia canabinoides, biblioteca científica",
    canonical: `${BASE}/biblioteca`,
  },
  "/tratamentos": {
    title: "Tratamentos com Cannabis Medicinal | Ansiedade, Dor, Epilepsia — Planta & Raiz",
    description: "Conheça os tratamentos com cannabis medicinal para ansiedade, dor crônica, epilepsia, fibromialgia, insônia e Parkinson. Evidências científicas e protocolo ANVISA.",
    keywords: "tratamento cannabis medicinal, CBD ansiedade, cannabis dor crônica, epilepsia canabidiol",
    canonical: `${BASE}/tratamentos`,
  },
  "/ebook": {
    title: "E-book Grátis: Guia Completo de Cannabis Medicinal | Planta & Raiz",
    description: "Baixe gratuitamente o guia completo sobre cannabis medicinal: farmacologia, dosimetria, legislação ANVISA e casos clínicos reais. 12 capítulos.",
    keywords: "ebook cannabis medicinal, guia CBD grátis, curso cannabis medicinal, farmacologia canabinoides",
    canonical: `${BASE}/ebook`,
  },
  "/tratamento-dor-cronica": {
    title: "Tratamento de Dor Crônica com Cannabis Medicinal SP | Planta & Raiz",
    description: "Tratamento especializado de dor crônica com cannabis medicinal em São Paulo. Fibromialgia, artrite, dores neuropáticas. Teleconsulta a partir de R$30 com prescrição ANVISA.",
    keywords: "dor crônica cannabis medicinal, tratamento fibromialgia CBD, artrite cannabis SP, dor neuropática canabidiol, médico dor crônica São Paulo",
    canonical: `${BASE}/tratamento-dor-cronica`,
    h1: "Tratamento de Dor Crônica com Cannabis Medicinal em São Paulo",
  },
  "/tratamento-ansiedade-saude-mental": {
    title: "Tratamento de Ansiedade e Insônia com Cannabis Medicinal SP | Planta & Raiz",
    description: "Tratamento especializado de ansiedade, insônia e burnout com cannabis medicinal em São Paulo. CBD para saúde mental. Teleconsulta a partir de R$30 com prescrição ANVISA.",
    keywords: "ansiedade cannabis medicinal, CBD insônia, tratamento burnout CBD, saúde mental cannabis SP, canabidiol ansiedade São Paulo, CBD para dormir",
    canonical: `${BASE}/tratamento-ansiedade-saude-mental`,
    h1: "Tratamento com Cannabis Medicinal para Ansiedade e Insônia em São Paulo",
  },
  "/blog": {
    title: "Blog de Cannabis Medicinal | Notícias, Estudos e Dicas — Planta & Raiz",
    description: "Artigos científicos, notícias e dicas sobre cannabis medicinal, CBD, THC e legislação ANVISA. Conteúdo revisado por médicos especializados.",
    keywords: "blog cannabis medicinal, notícias CBD, artigos THC medicinal, ANVISA atualizações",
    canonical: `${BASE}/blog`,
  },
  "/contato": {
    title: "Contato | Fale com a Planta & Raiz — Cannabis Medicinal SP",
    description: "Entre em contato com a Planta & Raiz. Suporte por WhatsApp, email ou chat. Atendimento em São Paulo e todo o Brasil.",
    keywords: "contato planta raiz, suporte cannabis medicinal, WhatsApp planta raiz",
    canonical: `${BASE}/contato`,
  },
  "/planos": {
    title: "Planos e Preços | Teleconsulta Cannabis a partir de R$30 — Planta & Raiz",
    description: "Conheça os planos de teleconsulta da Planta & Raiz. Orientações Técnicas a partir de R$30, assinatura Club com benefícios e descontos exclusivos.",
    keywords: "preço consulta cannabis medicinal, planos telemedicina, assinatura cannabis",
    canonical: `${BASE}/planos`,
  },
  "/club": {
    title: "Club Planta & Raiz | Assinatura com Benefícios Exclusivos",
    description: "Assine o Club Planta & Raiz: consultas ilimitadas, descontos em produtos, conteúdo premium e comunidade exclusiva de cannabis medicinal.",
    keywords: "club cannabis medicinal, assinatura CBD, benefícios exclusivos planta raiz",
    canonical: `${BASE}/club`,
  },
  "/cadastro": {
    title: "Cadastro | Comece seu Tratamento com Cannabis Medicinal — Planta & Raiz",
    description: "Crie sua conta gratuita na Planta & Raiz e comece seu tratamento com cannabis medicinal. Cadastro rápido e seguro.",
    keywords: "cadastro cannabis medicinal, criar conta planta raiz, registro telemedicina",
    canonical: `${BASE}/cadastro`,
  },
  "/login": {
    title: "Login | Acesse sua Conta — Planta & Raiz",
    description: "Acesse sua conta na Planta & Raiz. Orientações Técnicas, prescrições e acompanhamento do seu tratamento com cannabis medicinal.",
    keywords: "login planta raiz, acessar conta cannabis medicinal",
    canonical: `${BASE}/login`,
  },
  "/agendamento": {
    title: "Agendar Orientação Técnica Cannabis Medicinal | São Paulo — Planta & Raiz",
    description: "Agende sua teleconsulta com médico especialista em cannabis medicinal. Horários flexíveis, pagamento via Pix e atendimento em São Paulo e todo Brasil.",
    keywords: "agendar consulta cannabis, marcar teleconsulta CBD, agendamento médico cannabis SP",
    canonical: `${BASE}/agendamento`,
  },
  "/comunidade": {
    title: "Comunidade Cannabis Medicinal | Fórum e Suporte — Planta & Raiz",
    description: "Junte-se à maior comunidade de cannabis medicinal do Brasil. Compartilhe experiências, tire dúvidas e conecte-se com pacientes e profissionais.",
    keywords: "comunidade cannabis medicinal, fórum CBD, grupo pacientes cannabis",
    canonical: `${BASE}/comunidade`,
  },
  "/legal": {
    title: "Termos de Uso e Política de Privacidade | Planta & Raiz",
    description: "Termos de uso, política de privacidade e conformidade LGPD da Planta & Raiz. Transparência e segurança dos seus dados.",
    keywords: "termos uso planta raiz, política privacidade, LGPD cannabis medicinal",
    canonical: `${BASE}/legal`,
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

  // Default fallback
  return {
    title: "Planta & Raiz — Teleconsulta Cannabis Medicinal SP | Protocolo ANVISA",
    description: "A maior plataforma de telemedicina em cannabis medicinal do Brasil. Orientações Técnicas a partir de R$30, prescrição digital ANVISA e IA de acolhimento 24/7.",
    keywords: "cannabis medicinal, telemedicina, CBD, THC, ANVISA, consulta online",
    canonical: `${BASE}${pathname}`,
  };
}
