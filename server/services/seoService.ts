export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
}

export interface SchemaOrg {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SEOService {
  /**
   * Gera meta tags para página
   */
  static generateMetaTags(page: string, data?: any): MetaTags {
    const baseUrl = 'https://plantayraizmed.manus.space';

    const metaTags: { [key: string]: MetaTags } = {
      home: {
        title: 'Planta & Raiz - Telemedicina e Cannabis Medicinal',
        description:
          'Democratizando o Acesso a Tele-Medicina e ao Uso de Medicamentos e Suprimentos a Base de Cannabis en Todo el Mundo',
        keywords: ['cannabis medicinal', 'telemedicina', 'saúde', 'bem-estar', 'prescrição digital'],
        ogTitle: 'Planta & Raiz - Telemedicina e Cannabis Medicinal',
        ogDescription:
          'Plataforma de telemedicina especializada em cannabis medicinal com especialistas certificados',
        ogImage: `${baseUrl}/og-image.png`,
        ogUrl: baseUrl,
        twitterCard: 'summary_large_image',
        canonical: baseUrl,
      },
      profissionais: {
        title: 'Profissionais de Saúde - Planta & Raiz',
        description: 'Encontre especialistas em cannabis medicinal certificados',
        keywords: ['profissionais', 'especialistas', 'médicos', 'cannabis'],
        ogTitle: 'Profissionais de Saúde - Planta & Raiz',
        ogUrl: `${baseUrl}/profissionais`,
        canonical: `${baseUrl}/profissionais`,
      },
      marketplace: {
        title: 'Marketplace - Produtos de Cannabis Medicinal',
        description: 'Compre produtos de cannabis medicinal de qualidade certificada',
        keywords: ['marketplace', 'produtos', 'cannabis', 'medicinal'],
        ogTitle: 'Marketplace - Planta & Raiz',
        ogUrl: `${baseUrl}/marketplace`,
        canonical: `${baseUrl}/marketplace`,
      },
      biblioteca: {
        title: 'Biblioteca Científica - Cannabis Medicinal',
        description: 'Acesse artigos científicos e informações sobre cannabis medicinal',
        keywords: ['biblioteca', 'artigos', 'pesquisa', 'cannabis', 'científico'],
        ogTitle: 'Biblioteca Científica - Planta & Raiz',
        ogUrl: `${baseUrl}/biblioteca`,
        canonical: `${baseUrl}/biblioteca`,
      },
      telemedicina: {
        title: 'Telemedicina - Consultas Online',
        description: 'Agende consultas online com especialistas em cannabis medicinal',
        keywords: ['telemedicina', 'consulta', 'online', 'médico', 'cannabis'],
        ogTitle: 'Telemedicina - Planta & Raiz',
        ogUrl: `${baseUrl}/telemedicina`,
        canonical: `${baseUrl}/telemedicina`,
      },
    };

    return metaTags[page] || metaTags.home;
  }

  /**
   * Gera Schema.org para SEO estruturado
   */
  static generateSchemaOrg(type: string, data?: any): SchemaOrg {
    const baseUrl = 'https://plantayraizmed.manus.space';

    const schemas: { [key: string]: SchemaOrg } = {
      organization: {
        '@context': 'https://schema.org',
        '@type': 'MedicalBusiness',
        name: 'Planta & Raiz',
        description: 'Plataforma de telemedicina especializada em cannabis medicinal',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        sameAs: [
          'https://www.facebook.com/plantayraiz',
          'https://www.instagram.com/plantayraiz',
          'https://www.linkedin.com/company/plantayraiz',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          telephone: '+55-11-99999-9999',
          email: 'suporte@plantayraiz.com',
        },
      },
      product: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data?.name || 'Produto Cannabis Medicinal',
        description: data?.description || '',
        image: data?.image || `${baseUrl}/product-placeholder.png`,
        brand: {
          '@type': 'Brand',
          name: 'Planta & Raiz',
        },
        offers: {
          '@type': 'Offer',
          url: `${baseUrl}/marketplace/${data?.id}`,
          priceCurrency: 'BRL',
          price: data?.price || '0',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data?.rating || '4.5',
          reviewCount: data?.reviews || '100',
        },
      },
      doctor: {
        '@context': 'https://schema.org',
        '@type': 'MedicalBusiness',
        name: data?.name || 'Especialista',
        description: data?.specialization || 'Especialista em Cannabis Medicinal',
        image: data?.avatar || `${baseUrl}/doctor-placeholder.png`,
        medicalSpecialty: 'Cannabis Medicinal',
        areaServed: 'BR',
        availableLanguage: ['pt-BR', 'es'],
      },
      article: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data?.title || 'Artigo',
        description: data?.description || '',
        image: data?.image || `${baseUrl}/article-placeholder.png`,
        datePublished: data?.publishedDate || new Date().toISOString(),
        author: {
          '@type': 'Person',
          name: data?.author || 'Planta & Raiz',
        },
      },
    };

    return schemas[type] || schemas.organization;
  }

  /**
   * Gera sitemap XML
   */
  static generateSitemap(): string {
    const entries: SitemapEntry[] = [
      { loc: 'https://plantayraizmed.manus.space/', changefreq: 'daily', priority: 1.0 },
      { loc: 'https://plantayraizmed.manus.space/profissionais', changefreq: 'daily', priority: 0.9 },
      { loc: 'https://plantayraizmed.manus.space/marketplace', changefreq: 'daily', priority: 0.9 },
      { loc: 'https://plantayraizmed.manus.space/biblioteca', changefreq: 'weekly', priority: 0.8 },
      { loc: 'https://plantayraizmed.manus.space/telemedicina', changefreq: 'daily', priority: 0.9 },
      { loc: 'https://plantayraizmed.manus.space/planos', changefreq: 'monthly', priority: 0.7 },
      { loc: 'https://plantayraizmed.manus.space/legal', changefreq: 'yearly', priority: 0.5 },
      { loc: 'https://plantayraizmed.manus.space/faq', changefreq: 'monthly', priority: 0.6 },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    entries.forEach((entry) => {
      xml += '  <url>\n';
      xml += `    <loc>${entry.loc}</loc>\n`;
      if (entry.lastmod) xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      if (entry.changefreq) xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      if (entry.priority) xml += `    <priority>${entry.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    return xml;
  }

  /**
   * Gera robots.txt
   */
  static generateRobotsTxt(): string {
    return `User-agent: *
Allow: /
Allow: /profissionais
Allow: /marketplace
Allow: /biblioteca
Allow: /telemedicina
Allow: /planos
Disallow: /admin
Disallow: /api
Disallow: /private

Sitemap: https://plantayraizmed.manus.space/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /
`;
  }

  /**
   * Gera meta tags para redes sociais
   */
  static generateSocialMetaTags(page: string, data?: any): { [key: string]: string } {
    const metaTags = this.generateMetaTags(page, data);

    return {
      'og:title': metaTags.ogTitle || metaTags.title,
      'og:description': metaTags.ogDescription || metaTags.description,
      'og:image': metaTags.ogImage || '',
      'og:url': metaTags.ogUrl || '',
      'og:type': 'website',
      'twitter:card': metaTags.twitterCard || 'summary',
      'twitter:title': metaTags.twitterTitle || metaTags.title,
      'twitter:description': metaTags.twitterDescription || metaTags.description,
      'twitter:image': metaTags.twitterImage || metaTags.ogImage || '',
    };
  }

  /**
   * Calcula score de SEO
   */
  static calculateSEOScore(metaTags: MetaTags, content: string): number {
    let score = 0;

    // Title (10 pontos)
    if (metaTags.title && metaTags.title.length > 30 && metaTags.title.length < 60) score += 10;

    // Description (10 pontos)
    if (metaTags.description && metaTags.description.length > 120 && metaTags.description.length < 160)
      score += 10;

    // Keywords (10 pontos)
    if (metaTags.keywords && metaTags.keywords.length >= 3) score += 10;

    // OG Tags (15 pontos)
    if (metaTags.ogTitle && metaTags.ogDescription && metaTags.ogImage) score += 15;

    // Twitter Tags (10 pontos)
    if (metaTags.twitterCard && metaTags.twitterTitle && metaTags.twitterDescription) score += 10;

    // Canonical (10 pontos)
    if (metaTags.canonical) score += 10;

    // Content length (15 pontos)
    if (content && content.length > 300) score += 15;

    // Headings (10 pontos)
    if (content && (content.includes('<h1>') || content.includes('<h2>'))) score += 10;

    return Math.min(score, 100);
  }
}
