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
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-home.jpg`,
    url: `${BASE_URL}/`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/jpeg',
  },

  // ============ TELEMEDICINA ============
  telemedicina: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-telemedicina.jpg`,
    url: `${BASE_URL}/telemedicina`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ PROFISSIONAIS ============
  profissionais: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-profissionais.jpg`,
    url: `${BASE_URL}/profissionais`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ BIBLIOTECA CIENTÍFICA ============
  biblioteca: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-biblioteca.jpg`,
    url: `${BASE_URL}/biblioteca`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ BLOG ============
  blog: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-blog.jpg`,
    url: `${BASE_URL}/blog`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ CLUB ============
  club: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-club.jpg`,
    url: `${BASE_URL}/club`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ COMO FUNCIONA ============
  comoFunciona: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-como-funciona.jpg`,
    url: `${BASE_URL}/como-funciona`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ AGENDAMENTO ============
  agendamento: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-agendamento.jpg`,
    url: `${BASE_URL}/agendamento`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ TRATAMENTOS ============
  tratamentoDorCronica: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-tratamento-dor.jpg`,
    url: `${BASE_URL}/tratamento-dor-cronica`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  tratamentoAnsiedade: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-tratamento-ansiedade.jpg`,
    url: `${BASE_URL}/tratamento-ansiedade-saude-mental`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  tratamentoInsonia: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-tratamento-insonia.jpg`,
    url: `${BASE_URL}/tratamento-insonia`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  tratamentoEpilepsia: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-tratamento-epilepsia.jpg`,
    url: `${BASE_URL}/tratamento-epilepsia`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ INFORMAÇÕES ============
  faq: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-faq.jpg`,
    url: `${BASE_URL}/faq`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  contato: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-contato.jpg`,
    url: `${BASE_URL}/contato`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ PREÇOS E PLANOS ============
  precos: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-precos.jpg`,
    url: `${BASE_URL}/precos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  planos: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-planos.jpg`,
    url: `${BASE_URL}/planos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ CONTA E AUTENTICAÇÃO ============
  cadastro: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-cadastro.jpg`,
    url: `${BASE_URL}/cadastro`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  login: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-login.jpg`,
    url: `${BASE_URL}/login`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ SHOPPING ============
  shopping: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-shopping.jpg`,
    url: `${BASE_URL}/shopping`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ COMUNIDADE ============
  comunidade: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-comunidade.jpg`,
    url: `${BASE_URL}/comunidade`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ CONTEÚDO EDUCACIONAL ============
  ebook: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-ebook.jpg`,
    url: `${BASE_URL}/ebook`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ LEGAL ============
  legal: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-legal.jpg`,
    url: `${BASE_URL}/legal`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ PAGAMENTO ============
  pay: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-pay.jpg`,
    url: `${BASE_URL}/pay`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // ============ CARTEIRA ============
  carteira: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
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
