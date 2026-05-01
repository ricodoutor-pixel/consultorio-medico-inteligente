/**
 * Pinterest Meta Tags for Rich Pins
 * Otimiza compartilhamento no Pinterest
 */

export interface PinterestConfig {
  title: string;
  description: string;
  image: string;
  url: string;
  mediaType: 'article' | 'product' | 'recipe';
  keywords?: string[];
}

export const pinterestConfigs: Record<string, PinterestConfig> = {
  home: {
    title: 'Planta & Raiz — Telemedicina Cannabis Medicinal',
    description: 'Referência no tratamento com cannabis medicinal no Brasil. Orientação Técnicas com especialistas por apenas R$30.',
    image: 'https://plantayraiz.com.br/og-home.jpg',
    url: 'https://plantayraiz.com.br',
    mediaType: 'article',
    keywords: ['cannabis medicinal', 'telemedicina', 'saúde', 'bem-estar'],
  },
  ebook: {
    title: 'E-book Gratuito: Cannabis Medicinal Curso Completo',
    description: 'Guia completo com 12 capítulos sobre farmacologia, dosimetria, conformidade legal ANVISA e casos clínicos reais.',
    image: 'https://plantayraiz.com.br/og-ebook.jpg',
    url: 'https://plantayraiz.com.br/ebook',
    mediaType: 'article',
    keywords: ['e-book', 'cannabis', 'educação', 'saúde'],
  },
  biblioteca: {
    title: 'Biblioteca Científica — Recursos Educacionais',
    description: 'Acesso a artigos científicos, pesquisas, e-books e recursos educacionais sobre cannabis medicinal.',
    image: 'https://plantayraiz.com.br/og-biblioteca.jpg',
    url: 'https://plantayraiz.com.br/biblioteca',
    mediaType: 'article',
    keywords: ['pesquisa', 'ciência', 'educação', 'cannabis'],
  },
  club: {
    title: 'Club Planta & Raiz — Comunidade de Pacientes',
    description: 'Comunidade exclusiva para compartilhar experiências, casos clínicos e conectar com outros pacientes.',
    image: 'https://plantayraiz.com.br/og-club.jpg',
    url: 'https://plantayraiz.com.br/club',
    mediaType: 'article',
    keywords: ['comunidade', 'pacientes', 'rede', 'apoio'],
  },
};

/**
 * Gera tags Pinterest para HTML head
 */
export function generatePinterestTags(config: PinterestConfig): string {
  return `
    <!-- Pinterest Rich Pins Meta Tags -->
    <meta property="pinterest:title" content="${escapeHtml(config.title)}" />
    <meta property="pinterest:description" content="${escapeHtml(config.description)}" />
    <meta property="pinterest:media" content="${config.image}" />
    <meta property="pinterest:url" content="${config.url}" />
    <meta property="pinterest:media-type" content="${config.mediaType}" />
    ${config.keywords ? `<meta name="keywords" content="${config.keywords.join(', ')}" />` : ''}
    
    <!-- Pinterest App Meta Tags -->
    <meta name="pinterest-rich-pin" content="true" />
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
 * Retorna configuração baseada na rota
 */
export function getPinterestConfig(pathname: string): PinterestConfig {
  if (pathname.includes('/ebook')) {
    return pinterestConfigs.ebook;
  }
  if (pathname.includes('/biblioteca')) {
    return pinterestConfigs.biblioteca;
  }
  if (pathname.includes('/club')) {
    return pinterestConfigs.club;
  }
  return pinterestConfigs.home;
}
