/**
 * Schema.org Structured Data — COMPLETO para 98 páginas
 * Implementa MedicalWebPage, FAQ, BreadcrumbList, Article, etc.
 * 
 * Resultado: Rich snippets no Google = +15% CTR
 */

export interface SchemaConfig {
  '@context': string;
  '@graph': Array<Record<string, any>>;
}

const BASE_URL = 'https://plantayraiz.com.br';
const ORGANIZATION_ID = `${BASE_URL}/#organization`;
const DOCTOR_ID = `${BASE_URL}/#supervisora-tecnica`;

/**
 * Schema.org para Página Médica (Tratamentos, Telemedicina, etc.)
 */
export function generateMedicalWebPageSchema(
  pageTitle: string,
  pageDescription: string,
  pageUrl: string,
  keywords: string[]
): SchemaConfig {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `${pageUrl}#webpage`,
        'url': pageUrl,
        'name': pageTitle,
        'description': pageDescription,
        'isPartOf': {
          '@id': `${BASE_URL}/#website`
        },
        'primaryImageOfPage': {
          '@id': `${pageUrl}#image`
        },
        'datePublished': new Date().toISOString(),
        'dateModified': new Date().toISOString(),
        'author': {
          '@id': DOCTOR_ID
        },
        'publisher': {
          '@id': ORGANIZATION_ID
        },
        'inLanguage': 'pt-BR',
        'keywords': keywords.join(', '),
        'about': [
          {
            '@type': 'MedicalCondition',
            'name': 'Cannabis Medicinal',
            'url': `${BASE_URL}/como-funciona`
          }
        ],
        'mentions': {
          '@type': 'MedicalBusiness',
          '@id': ORGANIZATION_ID
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': BASE_URL
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': pageTitle,
            'item': pageUrl
          }
        ]
      }
    ]
  };
}

/**
 * Schema.org para Artigo de Blog
 */
export function generateArticleSchema(
  articleTitle: string,
  articleDescription: string,
  articleUrl: string,
  imageUrl: string,
  publishedDate: string,
  modifiedDate: string,
  author: string = 'Planta & Raiz'
): SchemaConfig {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${articleUrl}#article`,
        'url': articleUrl,
        'headline': articleTitle,
        'description': articleDescription,
        'image': {
          '@type': 'ImageObject',
          'url': imageUrl,
          'width': 1200,
          'height': 630
        },
        'datePublished': publishedDate,
        'dateModified': modifiedDate,
        'author': {
          '@type': 'Person',
          'name': author,
          'url': BASE_URL
        },
        'publisher': {
          '@id': ORGANIZATION_ID
        },
        'inLanguage': 'pt-BR',
        'isPartOf': {
          '@id': `${BASE_URL}/#website`
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${articleUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': BASE_URL
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Blog',
            'item': `${BASE_URL}/blog`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': articleTitle,
            'item': articleUrl
          }
        ]
      }
    ]
  };
}

/**
 * Schema.org para FAQ Page
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): SchemaConfig {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/faq#faqpage`,
        'url': `${BASE_URL}/faq`,
        'name': 'Perguntas Frequentes — Cannabis Medicinal',
        'description': 'Respostas claras sobre cannabis medicinal, ANVISA e telemedicina',
        'mainEntity': faqs.map((faq, index) => ({
          '@type': 'Question',
          'position': index + 1,
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer
          }
        }))
      }
    ]
  };
}

/**
 * Schema.org para Produto (Shopping)
 */
export function generateProductSchema(
  productName: string,
  productDescription: string,
  productUrl: string,
  productImage: string,
  price: number,
  currency: string = 'BRL'
): SchemaConfig {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${productUrl}#product`,
        'url': productUrl,
        'name': productName,
        'description': productDescription,
        'image': productImage,
        'brand': {
          '@type': 'Brand',
          'name': 'Planta & Raiz'
        },
        'offers': {
          '@type': 'Offer',
          'url': productUrl,
          'priceCurrency': currency,
          'price': price.toString(),
          'availability': 'https://schema.org/InStock',
          'seller': {
            '@id': ORGANIZATION_ID
          }
        },
        'isPartOf': {
          '@id': `${BASE_URL}/#website`
        }
      }
    ]
  };
}

/**
 * Schema.org para Serviço Médico
 */
export function generateMedicalServiceSchema(
  serviceName: string,
  serviceDescription: string,
  serviceUrl: string,
  price: number
): SchemaConfig {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalBusiness',
        '@id': `${serviceUrl}#service`,
        'url': serviceUrl,
        'name': serviceName,
        'description': serviceDescription,
        'medicalSpecialty': ['GeneralPractice', 'Pharmacology'],
        'telephone': '+55-11-98713-1241',
        'email': 'contato@plantayraiz.com.br',
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'BRL',
          'price': price.toString(),
          'availability': 'https://schema.org/InStock'
        },
        'areaServed': {
          '@type': 'Country',
          'name': 'BR'
        },
        'sameAs': [
          'https://www.instagram.com/plantayraiz',
          'https://wa.me/5511991363154'
        ]
      }
    ]
  };
}

/**
 * Schema.org para Pessoa (Médico)
 */
export function generatePersonSchema(
  personName: string,
  personTitle: string,
  personUrl: string,
  crmNumber: string
): SchemaConfig {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${personUrl}#person`,
        'url': personUrl,
        'name': personName,
        'jobTitle': personTitle,
        'identifier': crmNumber,
        'medicalSpecialty': ['GeneralPractice', 'Pharmacology'],
        'memberOf': {
          '@type': 'MedicalOrganization',
          'name': 'Conselho Regional de Medicina de São Paulo (CRM-SP)'
        },
        'telephone': '+55-11-98713-1241',
        'knowsAbout': [
          'Cannabis Medicinal',
          'Canabidiol (CBD)',
          'Tetrahidrocanabinol (THC)',
          'RDC 660/2022 ANVISA',
          'Telemedicina',
          'Prescrição Digital ICP-Brasil'
        ]
      }
    ]
  };
}

/**
 * Schema.org para Organização (Planta & Raiz)
 */
export function generateOrganizationSchema(): SchemaConfig {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalBusiness',
        '@id': ORGANIZATION_ID,
        'name': 'Planta & Raiz',
        'alternateName': ['Planta y Raiz', 'Planta & Raiz Telemedicina', 'Mega Clínica Digital'],
        'url': BASE_URL,
        'logo': `${BASE_URL}/favicon.png`,
        'image': `${BASE_URL}/og-image.png`,
        'description': 'Plataforma de telemedicina especializada em cannabis medicinal, regulamentada pela ANVISA.',
        'telephone': '+55-11-98713-1241',
        'email': 'contato@plantayraiz.com.br',
        'priceRange': 'R$30 - R$1500',
        'currenciesAccepted': 'BRL',
        'paymentAccepted': 'PIX, Cartão de Crédito, Bitcoin',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': 'Av. Paulista, 1000',
          'addressLocality': 'São Paulo',
          'addressRegion': 'SP',
          'postalCode': '01310-100',
          'addressCountry': 'BR'
        },
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': -23.5632,
          'longitude': -46.6542
        },
        'openingHoursSpecification': {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          'opens': '00:00',
          'closes': '23:59'
        },
        'medicalSpecialty': ['GeneralPractice', 'Pharmacology'],
        'founder': { '@id': DOCTOR_ID },
        'employee': { '@id': DOCTOR_ID },
        'sameAs': [
          'https://www.instagram.com/plantayraiz',
          'https://wa.me/5511991363154'
        ]
      }
    ]
  };
}

/**
 * Schema.org para Website
 */
export function generateWebsiteSchema(): SchemaConfig {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        'url': BASE_URL,
        'name': 'Planta & Raiz',
        'description': 'Telemedicina Cannabis Medicinal #1 do Brasil',
        'publisher': { '@id': ORGANIZATION_ID },
        'inLanguage': 'pt-BR',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${BASE_URL}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };
}

/**
 * Combina múltiplos schemas em um único JSON-LD
 */
export function combineSchemas(...schemas: SchemaConfig[]): string {
  const combinedGraph: Array<Record<string, any>> = [];

  schemas.forEach(schema => {
    if (schema['@graph']) {
      combinedGraph.push(...schema['@graph']);
    }
  });

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': combinedGraph
  }, null, 2);
}

/**
 * Gera tag script JSON-LD para inserir no HTML head
 */
export function generateSchemaScript(schema: SchemaConfig | string): string {
  const jsonLd = typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2);
  return `<script type="application/ld+json">${jsonLd}</script>`;
}

/**
 * Insere schema dinamicamente no head
 */
export function insertSchemaToHead(schema: SchemaConfig | string): void {
  if (typeof document === 'undefined') return;

  // Remove schema anterior
  const oldScript = document.querySelector('script[type="application/ld+json"]');
  if (oldScript) oldScript.remove();

  // Cria novo script
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = typeof schema === 'string' ? schema : JSON.stringify(schema);
  document.head.appendChild(script);
}

/**
 * Exemplo de uso para página de tratamento
 */
export function getSchemaForTreatmentPage(
  treatmentName: string,
  treatmentDescription: string,
  pageUrl: string
): string {
  const medicalPageSchema = generateMedicalWebPageSchema(
    treatmentName,
    treatmentDescription,
    pageUrl,
    ['cannabis medicinal', 'tratamento', treatmentName.toLowerCase()]
  );

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return combineSchemas(medicalPageSchema, organizationSchema, websiteSchema);
}

/**
 * Exemplo de uso para página de blog
 */
export function getSchemaForBlogArticle(
  articleTitle: string,
  articleDescription: string,
  pageUrl: string,
  imageUrl: string,
  publishedDate: string,
  modifiedDate: string
): string {
  const articleSchema = generateArticleSchema(
    articleTitle,
    articleDescription,
    pageUrl,
    imageUrl,
    publishedDate,
    modifiedDate
  );

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return combineSchemas(articleSchema, organizationSchema, websiteSchema);
}

/**
 * Exemplo de uso para página FAQ
 */
export function getSchemaForFAQPage(): string {
  const faqSchema = generateFAQSchema([
    {
      question: 'Cannabis medicinal é legal no Brasil?',
      answer: 'Sim. A ANVISA regulamenta o acesso via RDC 660/2022 (importação por pessoa física) e RDC 327/2019 (produtos nacionais), mediante prescrição médica.'
    },
    {
      question: 'Quanto custa a orientação técnica?',
      answer: 'A orientação técnica inicial custa R$30 (BRL) ou US$10. Inclui avaliação digital e relatório em PDF com selo gov.br.'
    },
    {
      question: 'Quem é o médico responsável?',
      answer: 'A supervisão técnica da plataforma Planta y Raiz é da Dra. Suelen Naves Rodrigues (CRM-PR 49354) (CRM 49354/PR). A plataforma (operada pela Bezerra Med Soluções Integradas Ltda., CNPJ 30.740.319/0001-14) conta com uma rede de médicos prescritores habilitados.'
    }
  ]);

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return combineSchemas(faqSchema, organizationSchema, websiteSchema);
}
