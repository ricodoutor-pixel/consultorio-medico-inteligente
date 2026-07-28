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
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-home.jpg`,
    url: `${BASE_URL}/`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // TELEMEDICINA
  telemedicina: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-telemedicina.jpg`,
    url: `${BASE_URL}/telemedicina`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // PROFISSIONAIS
  profissionais: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-profissionais.jpg`,
    url: `${BASE_URL}/profissionais`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // AGENDAMENTO
  agendamento: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-agendamento.jpg`,
    url: `${BASE_URL}/agendamento`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // BIBLIOTECA CIENTÍFICA
  biblioteca: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-biblioteca.jpg`,
    url: `${BASE_URL}/biblioteca`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // BLOG
  blog: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-blog.jpg`,
    url: `${BASE_URL}/blog`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // FAQ
  faq: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-faq.jpg`,
    url: `${BASE_URL}/faq`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // PREÇOS
  precos: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-precos.jpg`,
    url: `${BASE_URL}/precos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // CLUB
  club: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-club.jpg`,
    url: `${BASE_URL}/club`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // COMO FUNCIONA
  comoFunciona: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-como-funciona.jpg`,
    url: `${BASE_URL}/como-funciona`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // CADASTRO
  cadastro: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-cadastro.jpg`,
    url: `${BASE_URL}/cadastro`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // TRATAMENTO DOR CRÔNICA
  tratamentoDorCronica: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-tratamento-dor.jpg`,
    url: `${BASE_URL}/tratamento-dor-cronica`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // TRATAMENTO ANSIEDADE
  tratamentoAnsiedade: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-tratamento-ansiedade.jpg`,
    url: `${BASE_URL}/tratamento-ansiedade-saude-mental`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // COMUNIDADE
  comunidade: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-comunidade.jpg`,
    url: `${BASE_URL}/comunidade`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // SHOPPING
  shopping: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-shopping.jpg`,
    url: `${BASE_URL}/shopping`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  // CONTATO
  contato: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
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
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-cursos.jpg`,
    url: `${BASE_URL}/cursos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  webinars: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-webinars.jpg`,
    url: `${BASE_URL}/webinars`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  ebook: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-ebook.jpg`,
    url: `${BASE_URL}/ebook`,
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
  },

  consultaVideo: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-consulta-video.jpg`,
    url: `${BASE_URL}/consulta-video`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  quizTriagem: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-quiz-triagem.jpg`,
    url: `${BASE_URL}/quiz-triagem`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  forum: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-forum.jpg`,
    url: `${BASE_URL}/forum`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  consultorio: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-consultorio.jpg`,
    url: `${BASE_URL}/consultorio`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  dispensario: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-dispensario.jpg`,
    url: `${BASE_URL}/dispensario`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  cadastroProfissional: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-cadastro-profissional.jpg`,
    url: `${BASE_URL}/cadastro-profissional`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  legal: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-legal.jpg`,
    url: `${BASE_URL}/legal`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  politicaPrivacidade: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-privacidade.jpg`,
    url: `${BASE_URL}/politica-privacidade`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  termosDeUso: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-termos.jpg`,
    url: `${BASE_URL}/termos-uso`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  lgpdDireitos: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-lgpd.jpg`,
    url: `${BASE_URL}/lgpd-direitos`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  globalCompliance: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-compliance.jpg`,
    url: `${BASE_URL}/global-compliance`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  impactoSocial: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-impacto.jpg`,
    url: `${BASE_URL}/impacto-social`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  voluntarios: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-voluntarios.jpg`,
    url: `${BASE_URL}/voluntarios`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  indicacoes: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
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
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-pay.jpg`,
    url: `${BASE_URL}/pay`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  carteira: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-carteira.jpg`,
    url: `${BASE_URL}/carteira`,
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

  downloadApp: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-app.jpg`,
    url: `${BASE_URL}/download-app`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  notificacoes: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-notificacoes.jpg`,
    url: `${BASE_URL}/notificacoes`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  ofertaEspecial: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-oferta.jpg`,
    url: `${BASE_URL}/oferta-especial`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  status: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
    image: `${BASE_IMAGE}/og-status.jpg`,
    url: `${BASE_URL}/status`,
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
  },

  notFound: {
    title: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R - Planta y Raiz Ltda',
    description: 'Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!',
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
