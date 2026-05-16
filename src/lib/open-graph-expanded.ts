/**
 * Open Graph Configuration for Social Media Sharing (EXPANDIDO)
 * 30+ páginas com imagens otimizadas para Facebook, WhatsApp, LinkedIn, Twitter
 * Todas as imagens em 1200x630px (padrão recomendado)
 */

export interface OpenGraphConfig {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'website' | 'article' | 'profile' | 'business.business';
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  twitterHandle?: string;
}

const BASE_URL = 'https://plantayraiz.com.br';
const BASE_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674';

export const openGraphConfigs: Record<string, OpenGraphConfig> = {
  // ============ HOME & MAIN PAGES ============
  home: {
    title: 'Planta & Raiz — Telemedicina Cannabis Medicinal #1 Brasil',
    description: 'Referência #1 em telemedicina cannabis medicinal no Brasil. Orientações Técnicas com especialistas por R$30. Prescrição ANVISA, triagem IA, atendimento 24/7.',
    image: `${BASE_IMAGE}/og-home.jpg`,
    url: `${BASE_URL}/`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/jpeg',
  },

  // ============ TELEMEDICINA ============
  telemedicina: {
    title: 'Telemedicina Cannabis 24/7 — Consulta Online R$30',
    description: 'Teleconsulta com médicos especializados em cannabis medicinal. Videochamada, prescrição digital ANVISA e atendimento em todo Brasil.',
    image: `${BASE_IMAGE}/og-telemedicina.jpg`,
    url: `${BASE_URL}/telemedicina`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ PROFISSIONAIS ============
  profissionais: {
    title: 'Médicos Prescritores Cannabis Medicinal SP',
    description: 'Rede de médicos prescritores verificados com CRM validado. Especialistas em cannabis medicinal com avaliações reais e atendimento online.',
    image: `${BASE_IMAGE}/og-profissionais.jpg`,
    url: `${BASE_URL}/profissionais`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ BIBLIOTECA CIENTÍFICA ============
  biblioteca: {
    title: 'Biblioteca Científica Cannabis Medicinal — Estudos e Pesquisas',
    description: 'Acervo completo de artigos científicos, pesquisas clínicas e farmacologia de cannabis medicinal. Educação continuada para profissionais.',
    image: `${BASE_IMAGE}/og-biblioteca.jpg`,
    url: `${BASE_URL}/biblioteca`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ BLOG ============
  blog: {
    title: 'Blog Cannabis Medicinal — Notícias e Estudos',
    description: 'Artigos científicos, notícias e dicas sobre cannabis medicinal, CBD, THC e ANVISA. Conteúdo revisado por médicos especializados.',
    image: `${BASE_IMAGE}/og-blog.jpg`,
    url: `${BASE_URL}/blog`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ CLUB ============
  club: {
    title: 'Club Planta & Raiz — Comunidade e Benefícios Exclusivos',
    description: 'Comunidade exclusiva para pacientes e profissionais. Consultas com desconto, conteúdo premium e networking com especialistas.',
    image: `${BASE_IMAGE}/og-club.jpg`,
    url: `${BASE_URL}/club`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ COMO FUNCIONA ============
  comoFunciona: {
    title: 'Como Funciona — Telemedicina Cannabis em 5 Passos',
    description: 'Entenda o processo completo: triagem IA, consulta com médico, prescrição digital, compra em farmácia e acompanhamento.',
    image: `${BASE_IMAGE}/og-como-funciona.jpg`,
    url: `${BASE_URL}/como-funciona`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ AGENDAMENTO ============
  agendamento: {
    title: 'Agende Teleconsulta Cannabis Medicinal — R$30',
    description: 'Agende sua consulta com especialista em cannabis medicinal. Horários flexíveis, pagamento via Pix e atendimento 24/7.',
    image: `${BASE_IMAGE}/og-agendamento.jpg`,
    url: `${BASE_URL}/agendamento`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ TRATAMENTOS ============
  tratamentoDorCronica: {
    title: 'Cannabis para Dor Crônica — Fibromialgia, Artrite, Neuropatia',
    description: 'Tratamento de dor crônica com cannabis medicinal. Evidências científicas, protocolo ANVISA e consulta com especialista por R$30.',
    image: `${BASE_IMAGE}/og-tratamento-dor.jpg`,
    url: `${BASE_URL}/tratamento-dor-cronica`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  tratamentoAnsiedade: {
    title: 'Cannabis para Ansiedade e Insônia — Saúde Mental',
    description: 'CBD para ansiedade, insônia, burnout e depressão. Tratamento com cannabis medicinal, prescrição ANVISA e acompanhamento médico.',
    image: `${BASE_IMAGE}/og-tratamento-ansiedade.jpg`,
    url: `${BASE_URL}/tratamento-ansiedade-saude-mental`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  tratamentoInsonia: {
    title: 'Cannabis para Insônia — CBD e THC para Melhor Sono',
    description: 'Tratamento natural de insônia com cannabis medicinal. Melhore qualidade do sono com prescrição ANVISA e acompanhamento especializado.',
    image: `${BASE_IMAGE}/og-tratamento-insonia.jpg`,
    url: `${BASE_URL}/tratamento-insonia`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  tratamentoEpilepsia: {
    title: 'Cannabis para Epilepsia — CBD Medicinal Comprovado',
    description: 'Tratamento de epilepsia refratária com CBD. Redução de convulsões, prescrição ANVISA e protocolo clínico especializado.',
    image: `${BASE_IMAGE}/og-tratamento-epilepsia.jpg`,
    url: `${BASE_URL}/tratamento-epilepsia`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ INFORMAÇÕES ============
  faq: {
    title: 'FAQ Cannabis Medicinal — Perguntas e Respostas',
    description: 'Cannabis é legal? Como funciona ANVISA? Quanto custa? Respostas claras sobre cannabis medicinal no Brasil.',
    image: `${BASE_IMAGE}/og-faq.jpg`,
    url: `${BASE_URL}/faq`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  contato: {
    title: 'Contato — Planta & Raiz Cannabis Medicinal',
    description: 'Fale com a Planta & Raiz: WhatsApp, e-mail, chat. Suporte para pacientes e profissionais em SP e Brasil.',
    image: `${BASE_IMAGE}/og-contato.jpg`,
    url: `${BASE_URL}/contato`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ PREÇOS E PLANOS ============
  precos: {
    title: 'Preços — Consulta Cannabis Medicinal a partir de R$30',
    description: 'Tabela de preços: Orientação Técnica R$30, planos VIP/Pro/Premium e assinatura Club com descontos exclusivos.',
    image: `${BASE_IMAGE}/og-precos.jpg`,
    url: `${BASE_URL}/precos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  planos: {
    title: 'Planos Cannabis Medicinal — Assinatura com Benefícios',
    description: 'Planos de telemedicina: Orientações Técnicas a partir de R$30, assinatura Club com consultas ilimitadas e descontos.',
    image: `${BASE_IMAGE}/og-planos.jpg`,
    url: `${BASE_URL}/planos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ CONTA E AUTENTICAÇÃO ============
  cadastro: {
    title: 'Cadastro Grátis — Planta & Raiz Cannabis Medicinal',
    description: 'Crie sua conta gratuita e comece o tratamento com cannabis medicinal. Cadastro seguro, conformidade LGPD, atendimento 24/7.',
    image: `${BASE_IMAGE}/og-cadastro.jpg`,
    url: `${BASE_URL}/cadastro`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  login: {
    title: 'Login — Acesse sua Conta Planta & Raiz',
    description: 'Acesse sua conta para ver orientações técnicas, prescrições e acompanhamento do tratamento com cannabis medicinal.',
    image: `${BASE_IMAGE}/og-login.jpg`,
    url: `${BASE_URL}/login`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ SHOPPING ============
  shopping: {
    title: 'Shopping CBD — Óleos, Cápsulas e Acessórios Cannabis',
    description: 'Marketplace verificado de cannabis medicinal: óleos CBD, cápsulas, cremes. Entrega Brasil, nota fiscal, garantia.',
    image: `${BASE_IMAGE}/og-shopping.jpg`,
    url: `${BASE_URL}/shopping`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ COMUNIDADE ============
  comunidade: {
    title: 'Comunidade Cannabis Medicinal — Fórum e Networking',
    description: 'Maior comunidade brasileira de cannabis medicinal. Compartilhe experiências, tire dúvidas, conecte-se com pacientes e profissionais.',
    image: `${BASE_IMAGE}/og-comunidade.jpg`,
    url: `${BASE_URL}/comunidade`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ CONTEÚDO EDUCACIONAL ============
  ebook: {
    title: 'E-book Grátis: Guia Completo de Cannabis Medicinal',
    description: 'Baixe guia com 12 capítulos: farmacologia, dosimetria, legislação ANVISA, casos clínicos reais. Educação completa em PDF.',
    image: `${BASE_IMAGE}/og-ebook.jpg`,
    url: `${BASE_URL}/ebook`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ LEGAL ============
  legal: {
    title: 'Termos de Uso e Privacidade — Planta & Raiz',
    description: 'Termos de uso, política de privacidade e conformidade LGPD da Planta & Raiz. Transparência e segurança de dados.',
    image: `${BASE_IMAGE}/og-legal.jpg`,
    url: `${BASE_URL}/legal`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ PAGAMENTO ============
  pay: {
    title: 'Pagamento Seguro — Planta & Raiz Cannabis Medicinal',
    description: 'Finalize pagamento de forma segura: Pix, cartão de crédito ou Bitcoin. Consulta cannabis medicinal a partir de R$30.',
    image: `${BASE_IMAGE}/og-pay.jpg`,
    url: `${BASE_URL}/pay`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ CARTEIRA ============
  carteira: {
    title: 'Carteira Digital — Planta & Raiz',
    description: 'Acompanhe saldo, créditos, comissões e histórico de pagamentos em carteira digital segura.',
    image: `${BASE_IMAGE}/og-carteira.jpg`,
    url: `${BASE_URL}/carteira`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },
};

/**
 * Gera tags Open Graph para HTML head
 */
export function generateOpenGraphTags(config: OpenGraphConfig): string {
  return `
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${escapeHtml(config.title)}" />
    <meta property="og:description" content="${escapeHtml(config.description)}" />
    <meta property="og:image" content="${config.image}" />
    <meta property="og:image:width" content="${config.imageWidth || 1200}" />
    <meta property="og:image:height" content="${config.imageHeight || 630}" />
    <meta property="og:image:type" content="${config.imageType || 'image/jpeg'}" />
    <meta property="og:image:alt" content="${escapeHtml(config.title)}" />
    <meta property="og:url" content="${config.url}" />
    <meta property="og:type" content="${config.type}" />
    <meta property="og:site_name" content="Planta & Raiz" />
    <meta property="og:locale" content="pt_BR" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(config.title)}" />
    <meta name="twitter:description" content="${escapeHtml(config.description)}" />
    <meta name="twitter:image" content="${config.image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(config.title)}" />
    <meta name="twitter:site" content="@plantayraiz" />
    ${config.twitterHandle ? `<meta name="twitter:creator" content="${config.twitterHandle}" />` : ''}
    
    <!-- LinkedIn Meta Tags -->
    <meta property="linkedin:title" content="${escapeHtml(config.title)}" />
    <meta property="linkedin:description" content="${escapeHtml(config.description)}" />
    <meta property="linkedin:image" content="${config.image}" />
    
    <!-- WhatsApp Meta Tags -->
    <meta name="description" content="${escapeHtml(config.description)}" />
  `;
}

/**
 * Escapa caracteres especiais em HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Atualiza Open Graph tags dinamicamente no head
 */
export function updateOpenGraphTags(config: OpenGraphConfig): void {
  if (typeof document === 'undefined') return;

  const head = document.head;

  // Remove tags antigas
  const oldTags = head.querySelectorAll(
    'meta[property^="og:"], meta[name^="twitter:"], meta[property^="linkedin:"]'
  );
  oldTags.forEach((tag) => tag.remove());

  // Cria novo elemento template
  const template = document.createElement('template');
  template.innerHTML = generateOpenGraphTags(config);

  // Adiciona tags ao head
  const fragment = template.content;
  head.appendChild(fragment);
}

/**
 * Retorna configuração baseada na rota atual
 */
export function getOpenGraphConfig(pathname: string): OpenGraphConfig {
  // Tratamentos
  if (pathname.includes('/tratamento-dor-cronica')) {
    return openGraphConfigs.tratamentoDorCronica;
  }
  if (pathname.includes('/tratamento-ansiedade-saude-mental')) {
    return openGraphConfigs.tratamentoAnsiedade;
  }
  if (pathname.includes('/tratamento-insonia')) {
    return openGraphConfigs.tratamentoInsonia;
  }
  if (pathname.includes('/tratamento-epilepsia')) {
    return openGraphConfigs.tratamentoEpilepsia;
  }

  // Páginas principais
  if (pathname.includes('/telemedicina')) {
    return openGraphConfigs.telemedicina;
  }
  if (pathname.includes('/profissionais')) {
    return openGraphConfigs.profissionais;
  }
  if (pathname.includes('/biblioteca')) {
    return openGraphConfigs.biblioteca;
  }
  if (pathname.includes('/blog')) {
    return openGraphConfigs.blog;
  }
  if (pathname.includes('/club')) {
    return openGraphConfigs.club;
  }
  if (pathname.includes('/como-funciona')) {
    return openGraphConfigs.comoFunciona;
  }
  if (pathname.includes('/agendamento')) {
    return openGraphConfigs.agendamento;
  }
  if (pathname.includes('/faq')) {
    return openGraphConfigs.faq;
  }
  if (pathname.includes('/contato')) {
    return openGraphConfigs.contato;
  }
  if (pathname.includes('/precos')) {
    return openGraphConfigs.precos;
  }
  if (pathname.includes('/planos')) {
    return openGraphConfigs.planos;
  }
  if (pathname.includes('/cadastro')) {
    return openGraphConfigs.cadastro;
  }
  if (pathname.includes('/login')) {
    return openGraphConfigs.login;
  }
  if (pathname.includes('/shopping')) {
    return openGraphConfigs.shopping;
  }
  if (pathname.includes('/comunidade')) {
    return openGraphConfigs.comunidade;
  }
  if (pathname.includes('/ebook')) {
    return openGraphConfigs.ebook;
  }
  if (pathname.includes('/legal')) {
    return openGraphConfigs.legal;
  }
  if (pathname.includes('/pay')) {
    return openGraphConfigs.pay;
  }
  if (pathname.includes('/carteira')) {
    return openGraphConfigs.carteira;
  }

  // Fallback para home
  return openGraphConfigs.home;
}
