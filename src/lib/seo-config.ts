/**
 * Dynamic SEO config per route — titles, descriptions, keywords
 * Optimized for E-E-A-T, local SEO (São Paulo) and long-tail keywords
 *
 * Rules: title ≤ 60 chars, description 50–160 chars, ÚNICO por rota.
 */

export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  h1?: string;
}

const BASE = "https://plantayraiz.com.br";
const BRAND = "Planta y Raiz";

export const routeSEOMap: Record<string, PageSEO> = {
  // ===== 12 PÁGINAS PRIORITÁRIAS — E-E-A-T MÁXIMO (São Paulo + Brasil) =====
  "/": {
    title: `Cannabis Medicinal a partir de R$30 | ${BRAND}`,
    description:
      "Comece seu tratamento com cannabis medicinal por R$30: orientação técnica via WhatsApp, telemedicina 24/7 e conformidade ANVISA, CFM e LGPD.",
    keywords: "cannabis medicinal, telemedicina, CBD, THC, saúde digital, triagem IA, supervisão técnica Dra. Suelen Naves Rodrigues (CRM 49354/PR)",
    canonical: `${BASE}/`,
    h1: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
  },
  "/nossa-historia": {
    title: `Nossa História — Quem Somos | ${BRAND}`,
    description:
      "Conheça a história da Planta y Raiz (Bezerra Med Soluções Integradas): a clínica digital que levou cannabis medicinal a todo o Brasil com respaldo técnico.",
    keywords: "história Planta y Raiz, Bezerra Med Soluções Integradas, clínica cannabis medicinal Brasil, autoridade cannabis medicinal",
    canonical: `${BASE}/nossa-historia`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Nossa História e DNA",
  },
  "/profissionais": {
    title: `Médicos Prescritores de Cannabis | ${BRAND}`,
    description:
      "Encontre médicos prescritores de cannabis medicinal verificados por CRM, com agenda online, valores transparentes e atendimento por telemedicina.",
    keywords: "médico cannabis medicinal São Paulo, prescritor CBD Brasil, especialistas medicina canabinoide, CRM cannabis SP",
    canonical: `${BASE}/profissionais`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Médicos Prescritores Especialistas",
  },
  "/telemedicina": {
    title: `Telemedicina Canabinoide 24/7 | ${BRAND}`,
    description:
      "Teleconsulta de cannabis medicinal por vídeo ou chat, com receita e assinatura digital válida em todo o Brasil. Atendimento 24 horas por dia.",
    keywords: "consulta telemedicina canabinoide, telemedicina cannabis São Paulo, videoconsulta cannabis Brasil, acesso seguro cannabis medicinal",
    canonical: `${BASE}/telemedicina`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Telemedicina 24/7 com Especialistas",
  },
  "/shopping": {
    title: `Shopping de Produtos Canabinoides | ${BRAND}`,
    description:
      "Solicite óleos e produtos de cannabis medicinal via farmácias parceiras autorizadas pela ANVISA, com verificação de prescrição conforme RDC 660.",
    keywords: "comprar cannabis medicinal São Paulo, óleo CBD Brasil, marketplace cannabis medicinal, produtos canabinoides ANVISA",
    canonical: `${BASE}/shopping`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Shopping Verificado e Seguro",
  },
  "/saude-verde": {
    title: `Programa Saúde Verde | ${BRAND}`,
    description:
      "O Saúde Verde reúne rede de parceiros, agendamento facilitado e assinatura para acompanhamento contínuo do tratamento canabinoide.",
    keywords: "saúde verde cannabis medicinal, plano cannabis São Paulo, programa cannabis Brasil, assinatura cannabis medicinal",
    canonical: `${BASE}/saude-verde`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Programa Saúde Verde",
  },
  "/biblioteca": {
    title: `Biblioteca Científica de Cannabis | ${BRAND}`,
    description:
      "Acesse estudos, artigos do PubMed e evidências sobre cannabidiol, THC e medicina canabinoide, organizados por indicação clínica.",
    keywords: "biblioteca cannabis medicinal, estudos canabinoides Brasil, farmacologia CBD, pesquisa cannabis medicinal São Paulo",
    canonical: `${BASE}/biblioteca`,
    h1: "Biblioteca Científica de Cannabis Medicinal",
  },
  "/comunidade": {
    title: `Comunidade de Pacientes | ${BRAND}`,
    description:
      "Participe da comunidade Planta y Raiz: relatos de pacientes, dúvidas sobre cannabis medicinal e conteúdo revisado por profissionais de saúde.",
    keywords: "comunidade cannabis medicinal Brasil, fórum cannabis São Paulo, grupo pacientes canabinoides, suporte cannabis medicinal",
    canonical: `${BASE}/comunidade`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Comunidade Oficial Planta y Raiz",
  },
  "/dashboard": {
    title: `Meu Painel de Tratamento | ${BRAND}`,
    description:
      "Acompanhe consultas, prescrições, evolução do tratamento e documentos do seu acompanhamento canabinoide em um só painel.",
    keywords: "painel paciente cannabis medicinal, dashboard cannabis São Paulo, gestão tratamento canabinoide Brasil",
    canonical: `${BASE}/dashboard`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Meu Painel de Tratamento",
  },
  "/afiliados": {
    title: `Programa de Afiliados | ${BRAND}`,
    description:
      "Indique pacientes e profissionais e receba comissões recorrentes em três gerações. Painel com links, métricas e saques via Pix.",
    keywords: "afiliados cannabis medicinal Brasil, indicação cannabis São Paulo, programa parceiros canabinoides",
    canonical: `${BASE}/afiliados`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Programa de Afiliados Planta y Raiz",
  },
  "/planos": {
    title: `Planos e Assinaturas R$99/mês | ${BRAND}`,
    description:
      "Três planos universais de R$99/mês para pacientes, médicos e lojistas, com benefícios de acompanhamento e vantagens na plataforma.",
    keywords: "planos cannabis medicinal São Paulo, assinatura cannabis Brasil, preço telemedicina canabinoide, club Planta y Raiz",
    canonical: `${BASE}/planos`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Planos e Assinaturas a partir de R$30",
  },
  "/tratamentos": {
    title: `Tratamentos e Indicações Clínicas | ${BRAND}`,
    description:
      "Veja como a cannabis medicinal é usada em dor crônica, ansiedade, insônia, epilepsia e outras indicações previstas pela ANVISA.",
    keywords: "tratamento cannabis medicinal Brasil, cannabis medicinal São Paulo, melhor tratamento canabinoide, indicações CBD ANVISA",
    canonical: `${BASE}/tratamentos`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Tratamentos e Indicações Clínicas",
  },

  // ===== Demais páginas (SEO padrão) =====
  "/como-funciona": {
    title: `Como Funciona o Atendimento | ${BRAND}`,
    description:
      "Passo a passo do atendimento: triagem com a Enfermeira Brisa, orientação técnica por R$30, teleconsulta e receita com assinatura digital.",
    keywords: "como funciona cannabis medicinal, teleconsulta passo a passo, prescrição ANVISA",
    canonical: `${BASE}/como-funciona`,
  },
  "/faq": {
    title: `Perguntas Frequentes sobre Cannabis | ${BRAND}`,
    description:
      "Respostas às dúvidas mais comuns sobre legalidade, prescrição, importação, preços e prazos do tratamento com cannabis medicinal no Brasil.",
    keywords: "FAQ cannabis medicinal, perguntas CBD, cannabis legal Brasil, ANVISA cannabis",
    canonical: `${BASE}/faq`,
  },
  "/ebook": {
    title: `Ebook Gratuito de Medicina Canabinoide | ${BRAND}`,
    description:
      "Baixe grátis o ebook de medicina canabinoide: fundamentos, indicações, dosagem e regulação ANVISA explicados de forma prática.",
    keywords: "ebook cannabis medicinal, guia CBD grátis, curso cannabis medicinal, farmacologia",
    canonical: `${BASE}/ebook`,
  },
  "/tratamento-dor-cronica": {
    title: `Cannabis para Dor Crônica | ${BRAND}`,
    description:
      "Como a cannabis medicinal atua em dor crônica, fibromialgia, artrite e dor neuropática — evidências, indicações e como iniciar o tratamento.",
    keywords: "dor crônica cannabis medicinal, fibromialgia CBD, artrite cannabis SP, dor neuropática",
    canonical: `${BASE}/tratamento-dor-cronica`,
    h1: "Tratamento de Dor Crônica com Cannabis Medicinal em São Paulo",
  },
  "/tratamento-ansiedade-saude-mental": {
    title: `Cannabis para Ansiedade e Insônia | ${BRAND}`,
    description:
      "CBD para ansiedade, insônia e burnout: o que dizem os estudos, quais produtos são autorizados e como conseguir prescrição por telemedicina.",
    keywords: "ansiedade cannabis medicinal, CBD insônia, burnout CBD, saúde mental cannabis SP",
    canonical: `${BASE}/tratamento-ansiedade-saude-mental`,
    h1: "Tratamento com Cannabis Medicinal para Ansiedade e Insônia em São Paulo",
  },
  "/blog": {
    title: `Blog de Cannabis Medicinal | ${BRAND}`,
    description:
      "Artigos, notícias regulatórias e conteúdo clínico sobre cannabis medicinal, CBD, THC e novidades da ANVISA revisados pela equipe técnica.",
    keywords: "blog cannabis medicinal, notícias CBD, artigos THC medicinal, ANVISA",
    canonical: `${BASE}/blog`,
  },
  "/contato": {
    title: `Contato e Suporte | ${BRAND}`,
    description:
      "Fale com a equipe Planta y Raiz por WhatsApp, e-mail ou formulário e receba orientação sobre seu tratamento canabinoide.",
    keywords: "contato planta raiz, suporte cannabis medicinal, WhatsApp planta raiz",
    canonical: `${BASE}/contato`,
  },
  "/precos": {
    title: `Preços: Orientação R$30 e Consultas | ${BRAND}`,
    description:
      "Tabela oficial: orientação técnica R$30, retorno R$90, consulta por chat R$100 e consulta por vídeo R$150 com receita assinada digitalmente.",
    keywords: "preço cannabis medicinal, valor consulta CBD, planos telemedicina cannabis",
    canonical: `${BASE}/precos`,
  },
  "/club": {
    title: `Club Planta y Raiz — Benefícios | ${BRAND}`,
    description:
      "O Club Planta y Raiz oferece acompanhamento contínuo, descontos em produtos e prioridade no atendimento por assinatura mensal.",
    keywords: "club cannabis medicinal, assinatura CBD, benefícios planta raiz",
    canonical: `${BASE}/club`,
  },
  "/cadastro": {
    title: `Cadastro Gratuito de Paciente | ${BRAND}`,
    description:
      "Crie sua conta gratuita para agendar orientação técnica, acessar o ebook e acompanhar seu tratamento com cannabis medicinal.",
    keywords: "cadastro cannabis medicinal, criar conta planta raiz, registro telemedicina",
    canonical: `${BASE}/cadastro`,
  },
  "/login": {
    title: `Entrar na Plataforma | ${BRAND}`,
    description:
      "Acesse sua conta Planta y Raiz para ver consultas, prescrições e o histórico do seu tratamento canabinoide com segurança.",
    keywords: "login planta raiz, acessar conta cannabis medicinal",
    canonical: `${BASE}/login`,
  },
  "/agendamento": {
    title: `Agendar Teleconsulta Canabinoide | ${BRAND}`,
    description:
      "Escolha o profissional, o horário e o formato (chat ou vídeo) e agende sua teleconsulta de cannabis medicinal em poucos minutos.",
    keywords: "agendar consulta cannabis, teleconsulta CBD, agendamento médico cannabis",
    canonical: `${BASE}/agendamento`,
  },
  "/legal": {
    title: `Documentos Legais e LGPD | ${BRAND}`,
    description:
      "Termos de uso, política de privacidade e informações de conformidade LGPD, ANVISA e CFM da plataforma de intermediação Planta y Raiz.",
    keywords: "termos uso planta raiz, política privacidade, LGPD cannabis medicinal",
    canonical: `${BASE}/legal`,
  },
  "/pay": {
    title: `Pagamento Seguro Pix e Cartão | ${BRAND}`,
    description:
      "Finalize o pagamento da sua orientação ou consulta por Pix ou cartão via Mercado Pago, com confirmação automática no WhatsApp.",
    keywords: "pagamento cannabis medicinal, checkout planta raiz, pix consulta CBD",
    canonical: `${BASE}/pay`,
  },
  "/carteira": {
    title: `Carteira e Créditos | ${BRAND}`,
    description:
      "Consulte saldo, Planta-Coins, comissões de indicação e histórico financeiro da sua conta na plataforma Planta y Raiz.",
    keywords: "carteira planta raiz, saldo cannabis medicinal, créditos consulta",
    canonical: `${BASE}/carteira`,
  },
  "/monitor-cardiaco": {
    title: `Monitor Cardíaco por IA | ${BRAND}`,
    description:
      "Meça batimentos e indicadores de bem-estar pela câmera do celular (PPG) e integre os dados ao seu acompanhamento canabinoide.",
    keywords: "monitor cardíaco IA, check-up rápido cannabis, saúde digital cannabis medicinal, PPG batimentos celular",
    canonical: `${BASE}/monitor-cardiaco`,
    h1: "Monitor Cardíaco IA — Saúde Digital Integrada à Cannabis Medicinal",
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
  const parent = routeSEOMap[base];

  const segments = pathname.split("/").filter(Boolean);
  const label = segments
    .map((s) => s.replace(/[-_]+/g, " "))
    .join(" · ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Derived, unique metadata for sub-routes of a mapped parent
  if (parent) {
    return {
      title: `${label} | ${BRAND}`.slice(0, 60),
      description: `${label} — ${parent.description}`.slice(0, 158),
      keywords: parent.keywords,
      canonical: `${BASE}${pathname}`,
    };
  }

  // Default fallback — unique per route
  return {
    title: label ? `${label} | ${BRAND}`.slice(0, 60) : `Cannabis Medicinal Online | ${BRAND}`,
    description: label
      ? `${label} na Planta y Raiz: cannabis medicinal com telemedicina 24/7, orientação técnica a partir de R$30 e conformidade ANVISA, CFM e LGPD.`.slice(0, 158)
      : "Cannabis medicinal com telemedicina 24/7, orientação técnica a partir de R$30 e conformidade ANVISA, CFM e LGPD na Planta y Raiz.",
    keywords: "cannabis medicinal, telemedicina, CBD, THC, ANVISA, consulta online",
    canonical: `${BASE}${pathname}`,
  };
}
