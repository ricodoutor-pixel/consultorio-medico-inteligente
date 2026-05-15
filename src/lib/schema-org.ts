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
    logo: 'https://plantayraiz.com.br/dr-verdinho-512.png',
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
      streetAddress: 'Av. Paulista, 1000 — Bela Vista',
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
      'https://www.youtube.com/channel/UC_Azx7mmS0_edjCxv4MXQ1Q',
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
 * Gera tags Schema.org JSON-LD para HTML head
 */
export function generateSchemaOrgTags(schemas: SchemaOrgConfig[]): string {
  return schemas
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema.data)}</script>`)
    .join('\n    ');
}

/**
 * Retorna schemas baseado na rota.
 * Inclui Physician + MedicalProcedure em TODAS as rotas para compensar
 * a remoção de tags ld+json que SearchEngineOptimization faz a cada navegação.
 */
export function getSchemaOrgByRoute(pathname: string): SchemaOrgConfig[] {
  const baseSchemas = [
    organizationSchema,
    localBusinessSchema,
    physicianSchema,
    medicalProcedureSchema,
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

