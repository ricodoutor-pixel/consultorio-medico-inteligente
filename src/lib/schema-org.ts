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
    '@type': 'MedicalOrganization',
    '@id': 'https://plantayraiz.com.br/#org',
    name: 'Planta y Raiz — Cannabis Medicinal',
    alternateName: ['Planta & Raiz', 'Mega Clínica Digital Planta y Raiz'],
    description:
      'A maior plataforma de cannabis medicinal do Brasil, com sede em São Paulo e atendimento nacional via telemedicina 24/7.',
    url: 'https://plantayraiz.com.br',
    logo: 'https://plantayraiz.com.br/dr-verdinho-512.png',
    image: 'https://plantayraiz.com.br/og-home.jpg',
    slogan: 'Cannabis Medicinal em São Paulo e Brasil — Telemedicina 24/7',

    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+55-11-99136-3154',
      email: 'contato@plantayraiz.com.br',
      areaServed: ['BR', 'São Paulo'],
      availableLanguage: ['pt-BR', 'en', 'es'],
    },

    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Paulista, 1000 — Bela Vista',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      postalCode: '01310-100',
      addressCountry: 'BR',
    },

    // Alcance local (SP) + nacional (Brasil)
    areaServed: [
      { '@type': 'City', name: 'São Paulo' },
      { '@type': 'State', name: 'São Paulo' },
      { '@type': 'Country', name: 'Brazil' },
    ],

    // Especialidade — Medicina Canabinoide
    medicalSpecialty: [
      'CannabinoidMedicine',
      'Psychiatry',
      'Neurology',
      'Rheumatology',
      'Oncology',
      'PainMedicine',
    ],

    knowsAbout: [
      'Cannabis Medicinal',
      'Telemedicina Canabinoide',
      'RDC 660/2022 ANVISA',
      'RDC 327/2019 ANVISA',
      'Conformidade LGPD',
      'Conformidade CFM',
    ],

    // Autoridade — estrelas nos resultados de busca
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '3200',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        author: { '@type': 'Person', name: 'Mariana S.' },
        reviewBody:
          'Atendimento humano e rápido em São Paulo. Recebi a prescrição ANVISA no mesmo dia pela telemedicina.',
      },
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        author: { '@type': 'Person', name: 'Carlos R.' },
        reviewBody:
          'Melhor plataforma de cannabis medicinal do Brasil. Equipe especialista e suporte 24/7 pela Brisa IA.',
      },
    ],

    sameAs: [
      'https://www.facebook.com/plantayraiz',
      'https://www.instagram.com/plantayraiz',
      'https://www.linkedin.com/company/plantayraiz',
      'https://www.youtube.com/channel/UC_Azx7mmS0_edjCxv4MXQ1Q',
      'https://www.tiktok.com/@plantayraiz',
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
    description: 'Orientações Técnicas online com especialistas em cannabis medicinal. Apenas R$30 por consulta.',
    
    // Avaliações
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '3200',
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
        url: 'https://plantayraiz.com.br/dr-verdinho-512.png',
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
 * Schema.org Physician — Dr. Edilson Bezerra (CRM-SP 10963)
 * Persistido em todas as rotas após o React inicializar (substitui o que existia em index.html).
 */
export const physicianSchema: SchemaOrgConfig = {
  type: 'Organization',
  data: {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    '@id': 'https://plantayraiz.com.br/#dr-edilson',
    name: 'Dr. Edilson Bezerra da Silva',
    jobTitle: 'Médico Especialista em Cannabis Medicinal',
    identifier: 'CRM-SP 10963',
    medicalSpecialty: ['GeneralPractice', 'Pharmacology'],
    memberOf: {
      '@type': 'MedicalOrganization',
      name: 'Conselho Regional de Medicina de São Paulo (CRM-SP)',
    },
    telephone: '+55-11-98713-1241',
    url: 'https://plantayraiz.com.br',
    knowsAbout: [
      'Cannabis Medicinal',
      'Canabidiol (CBD)',
      'Tetrahidrocanabinol (THC)',
      'RDC 660/2022 ANVISA',
      'RDC 327/2019 ANVISA',
      'Telemedicina',
      'Prescrição Digital ICP-Brasil',
    ],
  },
};

/**
 * Schema.org MedicalProcedure — Orientação Técnica
 */
export const medicalProcedureSchema: SchemaOrgConfig = {
  type: 'MedicalBusiness',
  data: {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: 'Orientação Técnica em Cannabis Medicinal',
    procedureType: 'https://schema.org/TherapeuticProcedure',
    description: 'Consulta digital com médico habilitado para avaliação clínica e emissão de relatório técnico em PDF, válido para importação ANVISA via RDC 660/2022.',
    performer: { '@id': 'https://plantayraiz.com.br/#dr-edilson' },
    offers: {
      '@type': 'Offer',
      price: '30.00',
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: 'https://plantayraiz.com.br',
    },
  },
};

/**
 * Schema.org FAQPage — perguntas frequentes da rota /faq
 */
export const faqPageSchema: SchemaOrgConfig = {
  type: 'Article',
  data: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Cannabis Medicinal é legal no Brasil?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A ANVISA regulamenta o acesso via RDC 660/2022 (importação por pessoa física) e RDC 327/2019 (produtos nacionais), mediante prescrição médica.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quanto custa a Orientação Técnica?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A Orientação Técnica inicial custa R$30 (BRL) ou US$10. Inclui avaliação digital e relatório em PDF com selo gov.br.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quem é o médico responsável?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Dr. Edilson Bezerra da Silva, CRM-SP 10963, especialista em Cannabis Medicinal, atende toda a plataforma.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como recebo minha prescrição?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A prescrição digital é emitida com selo gov.br e enviada via WhatsApp e e-mail. É válida em farmácias parceiras e para importação via ANVISA.',
        },
      },
      {
        '@type': 'Question',
        name: 'O atendimento é seguro e em conformidade com a LGPD?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. Todos os dados são criptografados em repouso (AES-256) e em trânsito (TLS 1.3). A plataforma cumpre integralmente a LGPD e o CFM.',
        },
      },
    ],
  },
};

/**
 * BreadcrumbList — gerado dinamicamente por rota.
 * Sempre começa em Home; demais segmentos viram crumbs legíveis.
 */
const BREADCRUMB_LABELS: Record<string, string> = {
  afiliados: 'Afiliados',
  biblioteca: 'Biblioteca',
  cadastro: 'Cadastro',
  club: 'Club Planta y Raiz',
  comunidade: 'Comunidade',
  login: 'Login',
  'monitor-cardiaco': 'Monitor Cardíaco',
  'nossa-historia': 'Nossa História',
  planos: 'Planos',
  profissionais: 'Profissionais',
  'saude-verde': 'Saúde Verde',
  shopping: 'Shopping',
  telemedicina: 'Telemedicina',
  tratamentos: 'Tratamentos',
  'como-funciona': 'Como Funciona',
  faq: 'FAQ',
  ebook: 'E-book',
  blog: 'Blog',
  contato: 'Contato',
  precos: 'Preços',
};

export function buildBreadcrumbSchema(pathname: string): SchemaOrgConfig {
  const segments = pathname.split('/').filter(Boolean);
  const items: any[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://plantayraiz.com.br/' },
  ];
  let acc = '';
  segments.forEach((seg, idx) => {
    acc += `/${seg}`;
    const name = BREADCRUMB_LABELS[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({
      '@type': 'ListItem',
      position: idx + 2,
      name,
      item: `https://plantayraiz.com.br${acc}`,
    });
  });
  return {
    type: 'Article',
    data: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    },
  };
}

/**
 * Gera tags Schema.org JSON-LD para HTML head
 */
export function generateSchemaOrgTags(schemas: SchemaOrgConfig[]): string {
  return schemas
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema.data)}</script>`)
    .join('\n    ');
}

/**
 * Retorna schemas baseado na rota.
 * Inclui Physician + MedicalProcedure + BreadcrumbList em TODAS as rotas.
 */
export function getSchemaOrgByRoute(pathname: string): SchemaOrgConfig[] {
  const baseSchemas: SchemaOrgConfig[] = [
    organizationSchema,
    localBusinessSchema,
    physicianSchema,
    medicalProcedureSchema,
    buildBreadcrumbSchema(pathname),
  ];

  if (pathname === '/faq' || pathname.startsWith('/faq/')) {
    return [...baseSchemas, faqPageSchema];
  }
  if (pathname.includes('/ebook')) {
    return [...baseSchemas, articleSchema];
  }
  if (pathname.includes('/biblioteca')) {
    return [...baseSchemas, articleSchema];
  }

  return baseSchemas;
}


