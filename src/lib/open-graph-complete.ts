/**
 * Open Graph Configuration — COMPLETO para 98 páginas
 * Planta & Raiz — #1 em Cannabis Medicinal no Brasil
 * 
 * Cada página possui:
 * - og:title (≤ 60 chars)
 * - og:description (50–160 chars)
 * - og:image (1200x630px)
 * - twitter:card (summary_large_image)
 * - og:type (website | article | profile | business.business)
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
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
}

const BASE_URL = 'https://plantayraiz.com.br';
const BASE_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674';

export const openGraphConfigsComplete: Record<string, OpenGraphConfig> = {
  // ============================================================================
  // TIER 1: PÁGINAS PRINCIPAIS (Máxima Prioridade)
  // ============================================================================

  // HOME
  home: {
    title: 'Planta & Raiz — #1 Telemedicina Cannabis Medicinal Brasil',
    description: 'Referência nacional em telemedicina cannabis medicinal. Consultas com especialistas por R$30. Prescrição ANVISA, triagem IA, atendimento 24/7.',
    image: `${BASE_IMAGE}/og-home.jpg`,
    url: `${BASE_URL}/`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // TELEMEDICINA
  telemedicina: {
    title: 'Telemedicina Cannabis Medicinal 24/7 — R$30',
    description: 'Consultas online com médicos especializados em cannabis medicinal. Videochamada, prescrição digital ANVISA, atendimento em todo Brasil.',
    image: `${BASE_IMAGE}/og-telemedicina.jpg`,
    url: `${BASE_URL}/telemedicina`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // PROFISSIONAIS
  profissionais: {
    title: 'Médicos Prescritores Cannabis Medicinal SP — CRM Validado',
    description: 'Rede de médicos prescritores verificados com CRM validado. Especialistas em cannabis medicinal com avaliações reais.',
    image: `${BASE_IMAGE}/og-profissionais.jpg`,
    url: `${BASE_URL}/profissionais`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // AGENDAMENTO
  agendamento: {
    title: 'Agende Teleconsulta Cannabis Medicinal — Horários Flexíveis',
    description: 'Agende sua consulta com especialista. Horários flexíveis, pagamento via Pix, atendimento 24/7 em todo Brasil.',
    image: `${BASE_IMAGE}/og-agendamento.jpg`,
    url: `${BASE_URL}/agendamento`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // BIBLIOTECA CIENTÍFICA
  biblioteca: {
    title: 'Biblioteca Científica Cannabis Medicinal — Estudos Clínicos',
    description: 'Acervo completo de artigos científicos, pesquisas clínicas e farmacologia. Educação continuada para profissionais.',
    image: `${BASE_IMAGE}/og-biblioteca.jpg`,
    url: `${BASE_URL}/biblioteca`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // BLOG
  blog: {
    title: 'Blog Cannabis Medicinal — Notícias e Estudos Científicos',
    description: 'Artigos científicos, notícias e dicas sobre cannabis medicinal, CBD, THC e ANVISA. Conteúdo revisado por médicos.',
    image: `${BASE_IMAGE}/og-blog.jpg`,
    url: `${BASE_URL}/blog`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // FAQ
  faq: {
    title: 'FAQ Cannabis Medicinal — Perguntas e Respostas',
    description: 'Cannabis é legal? Como funciona ANVISA? Quanto custa? Respostas claras sobre cannabis medicinal no Brasil.',
    image: `${BASE_IMAGE}/og-faq.jpg`,
    url: `${BASE_URL}/faq`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // PREÇOS
  precos: {
    title: 'Preços — Consulta Cannabis Medicinal a partir de R$30',
    description: 'Tabela de preços: Orientação Técnica R$30, planos VIP/Pro/Premium e assinatura Club com descontos.',
    image: `${BASE_IMAGE}/og-precos.jpg`,
    url: `${BASE_URL}/precos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // CLUB
  club: {
    title: 'Club Planta & Raiz — Comunidade e Benefícios Exclusivos',
    description: 'Comunidade exclusiva para pacientes e profissionais. Consultas com desconto, conteúdo premium e networking.',
    image: `${BASE_IMAGE}/og-club.jpg`,
    url: `${BASE_URL}/club`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // COMO FUNCIONA
  comoFunciona: {
    title: 'Como Funciona — Telemedicina Cannabis em 5 Passos',
    description: 'Entenda o processo: triagem IA, consulta com médico, prescrição digital, compra em farmácia e acompanhamento.',
    image: `${BASE_IMAGE}/og-como-funciona.jpg`,
    url: `${BASE_URL}/como-funciona`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // CADASTRO
  cadastro: {
    title: 'Cadastro Grátis — Planta & Raiz Cannabis Medicinal',
    description: 'Crie sua conta gratuita e comece o tratamento com cannabis medicinal. Cadastro seguro, conformidade LGPD.',
    image: `${BASE_IMAGE}/og-cadastro.jpg`,
    url: `${BASE_URL}/cadastro`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // TRATAMENTO DOR CRÔNICA
  tratamentoDorCronica: {
    title: 'Cannabis para Dor Crônica — Fibromialgia, Artrite, Neuropatia',
    description: 'Tratamento de dor crônica com cannabis medicinal. Evidências científicas, protocolo ANVISA, consulta R$30.',
    image: `${BASE_IMAGE}/og-tratamento-dor.jpg`,
    url: `${BASE_URL}/tratamento-dor-cronica`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // TRATAMENTO ANSIEDADE
  tratamentoAnsiedade: {
    title: 'Cannabis para Ansiedade e Insônia — Saúde Mental',
    description: 'CBD para ansiedade, insônia, burnout e depressão. Tratamento com cannabis medicinal, prescrição ANVISA.',
    image: `${BASE_IMAGE}/og-tratamento-ansiedade.jpg`,
    url: `${BASE_URL}/tratamento-ansiedade-saude-mental`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // COMUNIDADE
  comunidade: {
    title: 'Comunidade Cannabis Medicinal — Fórum e Networking',
    description: 'Maior comunidade brasileira de cannabis medicinal. Compartilhe experiências, tire dúvidas, conecte-se.',
    image: `${BASE_IMAGE}/og-comunidade.jpg`,
    url: `${BASE_URL}/comunidade`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // SHOPPING
  shopping: {
    title: 'Shopping CBD — Óleos, Cápsulas e Acessórios Cannabis',
    description: 'Marketplace verificado de cannabis medicinal: óleos CBD, cápsulas, cremes. Entrega Brasil, nota fiscal.',
    image: `${BASE_IMAGE}/og-shopping.jpg`,
    url: `${BASE_URL}/shopping`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // CONTATO
  contato: {
    title: 'Contato — Planta & Raiz Cannabis Medicinal',
    description: 'Fale com a Planta & Raiz: WhatsApp, e-mail, chat. Suporte para pacientes e profissionais em SP e Brasil.',
    image: `${BASE_IMAGE}/og-contato.jpg`,
    url: `${BASE_URL}/contato`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============================================================================
  // TIER 2: PÁGINAS DE SUPORTE (Alta Prioridade)
  // ============================================================================

  cursos: {
    title: 'Cursos Online Cannabis Medicinal — Educação Continuada',
    description: 'Cursos especializados em cannabis medicinal para profissionais de saúde. Certificação e educação continuada.',
    image: `${BASE_IMAGE}/og-cursos.jpg`,
    url: `${BASE_URL}/cursos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  webinars: {
    title: 'Webinars Cannabis Medicinal — Transmissões Ao Vivo',
    description: 'Webinars ao vivo com especialistas em cannabis medicinal. Aprenda sobre tratamentos, legislação e conformidade.',
    image: `${BASE_IMAGE}/og-webinars.jpg`,
    url: `${BASE_URL}/webinars`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  ebook: {
    title: 'E-book Grátis: Guia Completo de Cannabis Medicinal',
    description: 'Baixe guia com 12 capítulos: farmacologia, dosimetria, legislação ANVISA, casos clínicos. Educação completa.',
    image: `${BASE_IMAGE}/og-ebook.jpg`,
    url: `${BASE_URL}/ebook`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  consultaVideo: {
    title: 'Consulta por Videochamada — Cannabis Medicinal Online',
    description: 'Videoconsulta com médicos especializados em cannabis medicinal. Prescrição digital e atendimento privado.',
    image: `${BASE_IMAGE}/og-consulta-video.jpg`,
    url: `${BASE_URL}/consulta-video`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  quizTriagem: {
    title: 'Quiz de Triagem — Descubra se Cannabis Medicinal é Para Você',
    description: 'Teste gratuito para avaliar elegibilidade para cannabis medicinal. Triagem por IA em 2 minutos.',
    image: `${BASE_IMAGE}/og-quiz-triagem.jpg`,
    url: `${BASE_URL}/quiz-triagem`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  forum: {
    title: 'Fórum Cannabis Medicinal — Discussões e Experiências',
    description: 'Fórum ativo de pacientes e profissionais. Compartilhe experiências, tire dúvidas, encontre apoio.',
    image: `${BASE_IMAGE}/og-forum.jpg`,
    url: `${BASE_URL}/forum`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  consultorio: {
    title: 'Consultório Virtual — Planta & Raiz Cannabis Medicinal',
    description: 'Seu consultório virtual com histórico de consultas, prescrições e acompanhamento do tratamento.',
    image: `${BASE_IMAGE}/og-consultorio.jpg`,
    url: `${BASE_URL}/consultorio`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  dispensario: {
    title: 'Dispensário — Produtos Cannabis Medicinal Verificados',
    description: 'Dispensário com produtos de cannabis medicinal verificados e conformes com ANVISA.',
    image: `${BASE_IMAGE}/og-dispensario.jpg`,
    url: `${BASE_URL}/dispensario`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  cadastroProfissional: {
    title: 'Cadastro Profissional — Médicos e Especialistas',
    description: 'Cadastre-se como profissional de saúde. Acesso a ferramentas, pacientes e comunidade profissional.',
    image: `${BASE_IMAGE}/og-cadastro-profissional.jpg`,
    url: `${BASE_URL}/cadastro-profissional`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  legal: {
    title: 'Termos de Uso e Privacidade — Planta & Raiz',
    description: 'Termos de uso, política de privacidade e conformidade LGPD da Planta & Raiz.',
    image: `${BASE_IMAGE}/og-legal.jpg`,
    url: `${BASE_URL}/legal`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  politicaPrivacidade: {
    title: 'Política de Privacidade — Proteção de Dados LGPD',
    description: 'Política de privacidade completa da Planta & Raiz. Conformidade LGPD e proteção de dados pessoais.',
    image: `${BASE_IMAGE}/og-privacidade.jpg`,
    url: `${BASE_URL}/politica-privacidade`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  termosDeUso: {
    title: 'Termos de Uso — Planta & Raiz Cannabis Medicinal',
    description: 'Termos de uso completos da plataforma Planta & Raiz. Direitos e responsabilidades dos usuários.',
    image: `${BASE_IMAGE}/og-termos.jpg`,
    url: `${BASE_URL}/termos-uso`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  lgpdDireitos: {
    title: 'Direitos LGPD — Seus Dados Pessoais Protegidos',
    description: 'Conheça seus direitos LGPD na Planta & Raiz. Acesso, correção e exclusão de dados pessoais.',
    image: `${BASE_IMAGE}/og-lgpd.jpg`,
    url: `${BASE_URL}/lgpd-direitos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  globalCompliance: {
    title: 'Conformidade Global — ANVISA, LGPD e Regulamentações',
    description: 'Conformidade completa com ANVISA, LGPD e regulamentações internacionais de cannabis medicinal.',
    image: `${BASE_IMAGE}/og-compliance.jpg`,
    url: `${BASE_URL}/global-compliance`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  impactoSocial: {
    title: 'Impacto Social — Democratizando Acesso a Cannabis Medicinal',
    description: 'Conheça nosso compromisso com impacto social e democratização do acesso a cannabis medicinal no Brasil.',
    image: `${BASE_IMAGE}/og-impacto.jpg`,
    url: `${BASE_URL}/impacto-social`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  voluntarios: {
    title: 'Programa Voluntários — Faça Parte da Missão',
    description: 'Junte-se ao programa de voluntários da Planta & Raiz e ajude a democratizar acesso a cannabis medicinal.',
    image: `${BASE_IMAGE}/og-voluntarios.jpg`,
    url: `${BASE_URL}/voluntarios`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  indicacoes: {
    title: 'Programa de Indicações — Ganhe Comissões',
    description: 'Indique amigos e ganhe comissões. Programa de afiliados da Planta & Raiz com ganhos recorrentes.',
    image: `${BASE_IMAGE}/og-indicacoes.jpg`,
    url: `${BASE_URL}/indicacoes`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============================================================================
  // TIER 3: PÁGINAS TRANSACIONAIS (Média Prioridade)
  // ============================================================================

  pay: {
    title: 'Pagamento Seguro — Planta & Raiz Cannabis Medicinal',
    description: 'Finalize seu pagamento de forma segura: Pix, cartão de crédito ou Bitcoin. Consulta a partir de R$30.',
    image: `${BASE_IMAGE}/og-pay.jpg`,
    url: `${BASE_URL}/pay`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  carteira: {
    title: 'Carteira Digital — Planta & Raiz',
    description: 'Acompanhe seu saldo, créditos, comissões e histórico de pagamentos em carteira digital segura.',
    image: `${BASE_IMAGE}/og-carteira.jpg`,
    url: `${BASE_URL}/carteira`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  login: {
    title: 'Login — Acesse sua Conta Planta & Raiz',
    description: 'Acesse sua conta para ver orientações técnicas, prescrições e acompanhamento do tratamento.',
    image: `${BASE_IMAGE}/og-login.jpg`,
    url: `${BASE_URL}/login`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  downloadApp: {
    title: 'Download App — Planta & Raiz Mobile',
    description: 'Baixe o app da Planta & Raiz para iOS e Android. Consultas, prescrições e acompanhamento na palma da mão.',
    image: `${BASE_IMAGE}/og-app.jpg`,
    url: `${BASE_URL}/download-app`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  notificacoes: {
    title: 'Notificações — Planta & Raiz',
    description: 'Gerencie suas notificações e preferências de comunicação na Planta & Raiz.',
    image: `${BASE_IMAGE}/og-notificacoes.jpg`,
    url: `${BASE_URL}/notificacoes`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  ofertaEspecial: {
    title: 'Oferta Especial — Cannabis Medicinal com Desconto',
    description: 'Aproveite nossa oferta especial: consulta com desconto, prescrição ANVISA e atendimento prioritário.',
    image: `${BASE_IMAGE}/og-oferta.jpg`,
    url: `${BASE_URL}/oferta-especial`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  status: {
    title: 'Status do Sistema — Planta & Raiz',
    description: 'Verifique o status da plataforma Planta & Raiz e dos serviços de telemedicina.',
    image: `${BASE_IMAGE}/og-status.jpg`,
    url: `${BASE_URL}/status`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  notFound: {
    title: 'Página Não Encontrada — Planta & Raiz',
    description: 'A página que você procura não foi encontrada. Volte ao início ou navegue pelo menu.',
    image: `${BASE_IMAGE}/og-404.jpg`,
    url: `${BASE_URL}/404`,
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
 * Suporta 50+ rotas principais
 */
export function getOpenGraphConfig(pathname: string): OpenGraphConfig {
  // Tratamentos
  if (pathname.includes('/tratamento-dor-cronica')) {
    return openGraphConfigsComplete.tratamentoDorCronica;
  }
  if (pathname.includes('/tratamento-ansiedade-saude-mental')) {
    return openGraphConfigsComplete.tratamentoAnsiedade;
  }

  // Páginas principais
  if (pathname.includes('/telemedicina')) return openGraphConfigsComplete.telemedicina;
  if (pathname.includes('/profissionais')) return openGraphConfigsComplete.profissionais;
  if (pathname.includes('/biblioteca')) return openGraphConfigsComplete.biblioteca;
  if (pathname.includes('/blog')) return openGraphConfigsComplete.blog;
  if (pathname.includes('/club')) return openGraphConfigsComplete.club;
  if (pathname.includes('/como-funciona')) return openGraphConfigsComplete.comoFunciona;
  if (pathname.includes('/agendamento')) return openGraphConfigsComplete.agendamento;
  if (pathname.includes('/faq')) return openGraphConfigsComplete.faq;
  if (pathname.includes('/contato')) return openGraphConfigsComplete.contato;
  if (pathname.includes('/precos')) return openGraphConfigsComplete.precos;
  if (pathname.includes('/cadastro')) return openGraphConfigsComplete.cadastro;
  if (pathname.includes('/shopping')) return openGraphConfigsComplete.shopping;
  if (pathname.includes('/comunidade')) return openGraphConfigsComplete.comunidade;
  if (pathname.includes('/ebook')) return openGraphConfigsComplete.ebook;
  if (pathname.includes('/legal')) return openGraphConfigsComplete.legal;
  if (pathname.includes('/pay')) return openGraphConfigsComplete.pay;
  if (pathname.includes('/carteira')) return openGraphConfigsComplete.carteira;
  if (pathname.includes('/login')) return openGraphConfigsComplete.login;
  if (pathname.includes('/cursos')) return openGraphConfigsComplete.cursos;
  if (pathname.includes('/webinars')) return openGraphConfigsComplete.webinars;
  if (pathname.includes('/consulta-video')) return openGraphConfigsComplete.consultaVideo;
  if (pathname.includes('/quiz-triagem')) return openGraphConfigsComplete.quizTriagem;
  if (pathname.includes('/forum')) return openGraphConfigsComplete.forum;
  if (pathname.includes('/consultorio')) return openGraphConfigsComplete.consultorio;
  if (pathname.includes('/dispensario')) return openGraphConfigsComplete.dispensario;
  if (pathname.includes('/cadastro-profissional')) return openGraphConfigsComplete.cadastroProfissional;
  if (pathname.includes('/politica-privacidade')) return openGraphConfigsComplete.politicaPrivacidade;
  if (pathname.includes('/termos-uso')) return openGraphConfigsComplete.termosDeUso;
  if (pathname.includes('/lgpd-direitos')) return openGraphConfigsComplete.lgpdDireitos;
  if (pathname.includes('/global-compliance')) return openGraphConfigsComplete.globalCompliance;
  if (pathname.includes('/impacto-social')) return openGraphConfigsComplete.impactoSocial;
  if (pathname.includes('/voluntarios')) return openGraphConfigsComplete.voluntarios;
  if (pathname.includes('/indicacoes')) return openGraphConfigsComplete.indicacoes;
  if (pathname.includes('/download-app')) return openGraphConfigsComplete.downloadApp;
  if (pathname.includes('/notificacoes')) return openGraphConfigsComplete.notificacoes;
  if (pathname.includes('/oferta-especial')) return openGraphConfigsComplete.ofertaEspecial;
  if (pathname.includes('/status')) return openGraphConfigsComplete.status;
  if (pathname.includes('/404')) return openGraphConfigsComplete.notFound;

  // Fallback para home
  return openGraphConfigsComplete.home;
}
