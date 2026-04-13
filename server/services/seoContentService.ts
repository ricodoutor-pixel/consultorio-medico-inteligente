/**
 * Estratégia 5: SEO Galático com IA de Conteúdo
 * Geração e gestão de artigos otimizados para SEO
 */

export interface SEOKeyword {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  intent: 'informational' | 'commercial' | 'transactional';
  priority: number;
}

export interface SEOArticle {
  title: string;
  slug: string;
  content: string;
  keywords: string[];
  metaDescription: string;
  category: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  wordCount: number;
}

export const CANNABIS_SEO_KEYWORDS: SEOKeyword[] = [
  { keyword: 'cannabis medicinal benefícios', searchVolume: 12000, difficulty: 35, intent: 'informational', priority: 1 },
  { keyword: 'canabidiol para ansiedade', searchVolume: 8500, difficulty: 30, intent: 'informational', priority: 1 },
  { keyword: 'tratamento com CBD para dor', searchVolume: 6200, difficulty: 28, intent: 'commercial', priority: 2 },
  { keyword: 'cannabis para insônia', searchVolume: 5800, difficulty: 25, intent: 'informational', priority: 1 },
  { keyword: 'como usar óleo de cannabis', searchVolume: 4500, difficulty: 20, intent: 'informational', priority: 2 },
  { keyword: 'receita de cannabis medicinal', searchVolume: 9000, difficulty: 40, intent: 'transactional', priority: 1 },
  { keyword: 'médico cannabis perto de mim', searchVolume: 7500, difficulty: 45, intent: 'transactional', priority: 1 },
  { keyword: 'cannabis legal no Brasil', searchVolume: 11000, difficulty: 32, intent: 'informational', priority: 2 },
  { keyword: 'efeitos colaterais do CBD', searchVolume: 3800, difficulty: 22, intent: 'informational', priority: 3 },
  { keyword: 'cannabis para epilepsia', searchVolume: 4200, difficulty: 28, intent: 'informational', priority: 2 },
  { keyword: 'óleo CBD preço', searchVolume: 6000, difficulty: 38, intent: 'commercial', priority: 1 },
  { keyword: 'telemedicina cannabis', searchVolume: 3200, difficulty: 15, intent: 'transactional', priority: 1 },
  { keyword: 'prescrição cannabis online', searchVolume: 2800, difficulty: 18, intent: 'transactional', priority: 1 },
  { keyword: 'anvisa cannabis medicinal', searchVolume: 5500, difficulty: 30, intent: 'informational', priority: 2 },
  { keyword: 'CBD para autismo', searchVolume: 3600, difficulty: 25, intent: 'informational', priority: 2 },
  { keyword: 'cannabis para fibromialgia', searchVolume: 2900, difficulty: 22, intent: 'informational', priority: 3 },
  { keyword: 'importar cannabis medicinal', searchVolume: 4800, difficulty: 35, intent: 'transactional', priority: 1 },
  { keyword: 'consulta médico cannabis online', searchVolume: 3100, difficulty: 12, intent: 'transactional', priority: 1 },
  { keyword: 'THC medicinal', searchVolume: 3400, difficulty: 28, intent: 'informational', priority: 3 },
  { keyword: 'cannabis para Parkinson', searchVolume: 2200, difficulty: 20, intent: 'informational', priority: 3 },
];

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildArticlePrompt(keyword: SEOKeyword): string {
  return `Escreva um artigo científico completo sobre "${keyword.keyword}" para pacientes.
Requisitos:
- 2000-3000 palavras
- Linguagem acessível
- Baseado em estudos científicos reais
- Inclua benefícios, riscos e como usar
- Otimizado para SEO com keyword "${keyword.keyword}"
- Estrutura: Introdução, O que é, Benefícios, Riscos, Como usar, Conclusão
- Inclua CTA para agendar consulta na Planta e Raiz

Retorne em JSON:
{
  "title": "...",
  "content": "...",
  "keywords": ["...", "..."],
  "metaDescription": "...",
  "category": "..."
}`;
}

export function getKeywordsByPriority(priority: number): SEOKeyword[] {
  return CANNABIS_SEO_KEYWORDS.filter(k => k.priority === priority)
    .sort((a, b) => b.searchVolume - a.searchVolume);
}

export function getKeywordsByIntent(intent: SEOKeyword['intent']): SEOKeyword[] {
  return CANNABIS_SEO_KEYWORDS.filter(k => k.intent === intent);
}

export function buildSchemaOrgArticle(article: SEOArticle): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: article.title,
    description: article.metaDescription,
    keywords: article.keywords.join(', '),
    datePublished: article.publishedAt?.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Planta e Raiz',
      url: 'https://plantayraiz.com.br',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Planta e Raiz',
    },
    wordCount: article.wordCount,
    inLanguage: 'pt-BR',
  };
}
