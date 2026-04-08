/**
 * Schema.org JSON-LD for Google Search and Rich Snippets
 * Estrutura de dados para melhorar visibilidade no Google
 */

export interface SchemaOrgConfig {
  type: 'Organization' | 'LocalBusiness' | 'MedicalBusiness' | 'Article';
  data: Record<string, any>;
}

/**
 * Schema.org Organization
 */
export const organizationSchema: SchemaOrgConfig = {
  type: 'Organization',
  data: {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'Planta & Raiz',
    alternateName: 'Planta y Raiz',
    description: 'Referência no tratamento com cannabis medicinal no Brasil. Telemedicina com especialistas.',
    url: 'https://plantayraiz.com.br',
    logo: 'https://plantayraiz.com.br/logo.png',
    image: 'https://plantayraiz.com.br/og-home.jpg',
    
    // Contato
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+55-11-99136-3154',
      email: 'contato@plantayraiz.com.br',
      areaServed: 'BR',
      availableLanguage: ['pt-BR', 'en'],
    },
    
    // Localização
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plataforma Digital',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      postalCode: '01310-100',
      addressCountry: 'BR',
    },
    
    // Redes Sociais
    sameAs: [
      'https://www.facebook.com/plantayraiz',
      'https://www.instagram.com/plantayraiz',
      'https://www.linkedin.com/company/plantayraiz',
      'https://www.youtube.com/@plantayraiz',
      'https://www.tiktok.com/@plantayraiz',
    ],
    
    // Médicos e Profissionais
    medicalSpecialty: [
      'CannabinoidMedicine',
      'Psychiatry',
      'Neurology',
      'Rheumatology',
      'Oncology',
    ],
    
    // Serviços
    areaServed: {
      '@type': 'Country',
      name: 'Brazil',
    },
    
    // Certificações
    knowsAbout: [
      'Cannabis Medicinal',
      'Telemedicina',
      'Conformidade ANVISA',
      'Conformidade LGPD',
      'Conformidade CFM',
    ],
  },
};

/**
 * Schema.org Local Business
 */
export const localBusinessSchema: SchemaOrgConfig = {
  type: 'LocalBusiness',
  data: {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'Planta & Raiz — Telemedicina Cannabis Medicinal',
    image: 'https://plantayraiz.com.br/og-home.jpg',
    description: 'Consultas online com especialistas em cannabis medicinal. Apenas R$30 por consulta.',
    
    // Avaliações
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    
    // Preços
    priceRange: '$$',
    
    // Horário de funcionamento
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '20:00',
      validFrom: '2026-01-01',
    },
    
    // Ação de reserva
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://plantayraiz.com.br/agendamento',
        actionPlatform: ['DesktopWebPlatform', 'MobileWebPlatform'],
      },
    },
  },
};

/**
 * Schema.org Article (para E-book)
 */
export const articleSchema: SchemaOrgConfig = {
  type: 'Article',
  data: {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: 'E-book Gratuito: Cannabis Medicinal Curso Completo',
    description: 'Guia completo com 12 capítulos sobre farmacologia, dosimetria, conformidade legal ANVISA e casos clínicos reais.',
    image: 'https://plantayraiz.com.br/og-ebook.jpg',
    datePublished: '2026-01-01',
    dateModified: '2026-04-08',
    
    // Autor
    author: {
      '@type': 'Organization',
      name: 'Planta & Raiz',
      url: 'https://plantayraiz.com.br',
    },
    
    // Publicador
    publisher: {
      '@type': 'Organization',
      name: 'Planta & Raiz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://plantayraiz.com.br/logo.png',
      },
    },
    
    // Palavras-chave
    keywords: 'cannabis medicinal, telemedicina, ANVISA, CFM, LGPD, farmacologia, dosimetria',
    
    // Artigos relacionados
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Biblioteca Científica Planta & Raiz',
      url: 'https://plantayraiz.com.br/biblioteca',
    },
  },
};

/**
 * Gera tags Schema.org JSON-LD para HTML head
 */
export function generateSchemaOrgTags(schemas: SchemaOrgConfig[]): string {
  return schemas
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema.data)}</script>`)
    .join('\n    ');
}

/**
 * Retorna schemas baseado na rota
 */
export function getSchemaOrgByRoute(pathname: string): SchemaOrgConfig[] {
  const baseSchemas = [organizationSchema, localBusinessSchema];

  if (pathname.includes('/ebook')) {
    return [...baseSchemas, articleSchema];
  }
  if (pathname.includes('/biblioteca')) {
    return [...baseSchemas, articleSchema];
  }

  return baseSchemas;
}
