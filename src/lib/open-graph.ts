/**
 * Open Graph Configuration for Social Media Sharing
 * Otimiza compartilhamento no Facebook, WhatsApp e outras redes sociais
 */
import { getPageSEO } from '@/lib/seo-config';


export interface OpenGraphConfig {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'website' | 'article' | 'profile';
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
}

export const openGraphConfigs: Record<string, OpenGraphConfig> = {
  home: {
    title: 'Planta & Raiz — Telemedicina Cannabis Medicinal',
    description: 'Referência no tratamento com cannabis medicinal no Brasil. Orientações Técnicas com especialistas por apenas R$30. Democratizando acesso à medicina personalizada.',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/og-home.jpg',
    url: 'https://plantayraiz.com.br',
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/jpeg',
  },
  ebook: {
    title: 'E-book Gratuito: Cannabis Medicinal Curso Completo',
    description: 'Guia completo com 12 capítulos sobre farmacologia, dosimetria, conformidade legal ANVISA e casos clínicos reais. Baixe agora!',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/og-ebook.jpg',
    url: 'https://plantayraiz.com.br/ebook',
    type: 'article',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/jpeg',
  },
  biblioteca: {
    title: 'Biblioteca Científica — Recursos Educacionais',
    description: 'Acesso a artigos científicos, pesquisas, e-books e recursos educacionais sobre cannabis medicinal. Conteúdo atualizado para profissionais e estudantes.',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/og-biblioteca.jpg',
    url: 'https://plantayraiz.com.br/biblioteca',
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/jpeg',
  },
  club: {
    title: 'Club Planta & Raiz — Comunidade de Pacientes e Profissionais',
    description: 'Comunidade exclusiva para compartilhar experiências, casos clínicos e conectar com outros pacientes e profissionais de saúde.',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/og-club.jpg',
    url: 'https://plantayraiz.com.br/club',
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/jpeg',
  },
  agendamento: {
    title: 'Agende sua Orientação Técnica — Telemedicina Cannabis Medicinal',
    description: 'Consulte com especialistas em cannabis medicinal por apenas R$30. Atendimento online, rápido e seguro. Agende agora!',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/og-agendamento.jpg',
    url: 'https://plantayraiz.com.br/agendamento',
    type: 'website',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/jpeg',
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
    <meta property="og:url" content="${config.url}" />
    <meta property="og:type" content="${config.type}" />
    <meta property="og:site_name" content="Planta & Raiz" />
    <meta property="og:locale" content="pt_BR" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(config.title)}" />
    <meta name="twitter:description" content="${escapeHtml(config.description)}" />
    <meta name="twitter:image" content="${config.image}" />
    <meta name="twitter:site" content="@plantayraiz" />
    
    <!-- WhatsApp Meta Tags -->
    <meta property="og:image:alt" content="${escapeHtml(config.title)}" />
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
  const oldTags = head.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
  oldTags.forEach((tag) => tag.remove());

  // Cria novo elemento template
  const template = document.createElement('template');
  template.innerHTML = generateOpenGraphTags(config);

  // Adiciona tags ao head
  const fragment = template.content;
  head.appendChild(fragment);
}

/**
 * Retorna configuração baseada na rota atual (gera dinamicamente p/ rotas não mapeadas
 * a partir de seo-config para evitar duplicar og:title/description com a home).
 */
export function getOpenGraphConfig(pathname: string): OpenGraphConfig {
  if (pathname === '/' || pathname === '') return openGraphConfigs.home;
  if (pathname.startsWith('/ebook')) return openGraphConfigs.ebook;
  if (pathname.startsWith('/biblioteca')) return openGraphConfigs.biblioteca;
  if (pathname.startsWith('/club')) return openGraphConfigs.club;
  if (pathname.startsWith('/agendamento')) return openGraphConfigs.agendamento;

  // Fallback dinâmico: usa seo-config para garantir og:title/description únicos por rota
  try {
    const seo = getPageSEO(pathname);
    return {
      title: seo.title,
      description: seo.description,
      image: openGraphConfigs.home.image,
      url: seo.canonical,
      type: 'website',
      imageWidth: 1200,
      imageHeight: 630,
      imageType: 'image/jpeg',
    };
  } catch {
    return { ...openGraphConfigs.home, url: `https://plantayraiz.com.br${pathname}` };
  }
}
