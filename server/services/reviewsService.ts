import { invokeLLM } from '../_core/llm';

interface ReviewInput {
  rating: number;
  title: string;
  content: string;
  reviewerId: string;
  reviewerName: string;
  targetId: string;
  targetType: 'professional' | 'product' | 'consultation';
}

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  reviewerId: string;
  reviewerName: string;
  targetId: string;
  targetType: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  verified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analisar sentimento de review com IA
 */
export async function analyzeReviewSentiment(content: string): Promise<'positive' | 'neutral' | 'negative'> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analisador de sentimento. Analise o texto e responda apenas com: positive, neutral ou negative',
        },
        {
          role: 'user',
          content: content,
        },
      ],
    });

    const msgContent = response.choices[0]?.message?.content;
    const sentiment = typeof msgContent === 'string' ? msgContent.toLowerCase().trim() : 'neutral';
    
    if (sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative') {
      return sentiment;
    }
    
    return 'neutral';
  } catch (error) {
    console.error('[Reviews] Erro ao analisar sentimento:', error);
    return 'neutral';
  }
}

/**
 * Detectar spam ou conteúdo inapropriado
 */
export async function detectInappropriateContent(content: string): Promise<boolean> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um moderador. Responda apenas com sim ou não se o texto é inapropriado.',
        },
        {
          role: 'user',
          content: content,
        },
      ],
    });

    const msgContent = response.choices[0]?.message?.content;
    const result = typeof msgContent === 'string' ? msgContent.toLowerCase().trim() : 'não';
    return result === 'sim';
  } catch (error) {
    console.error('[Reviews] Erro ao detectar conteúdo inapropriado:', error);
    return false;
  }
}

/**
 * Gerar resumo de review com IA
 */
export async function generateReviewSummary(review: ReviewInput): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um resumidor. Crie um resumo em uma frase.',
        },
        {
          role: 'user',
          content: `Título: ${review.title}\nConteúdo: ${review.content}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : review.title;
  } catch (error) {
    console.error('[Reviews] Erro ao gerar resumo:', error);
    return review.title;
  }
}

/**
 * Validar qualidade do review
 */
export async function validateReviewQuality(review: ReviewInput): Promise<{
  isValid: boolean;
  score: number;
  issues: string[];
}> {
  const issues: string[] = [];
  let score = 100;

  if (review.content.length < 10) {
    issues.push('Conteúdo muito curto');
    score -= 30;
  }

  if (review.content.length > 5000) {
    issues.push('Conteúdo muito longo');
    score -= 20;
  }

  if (review.title.length < 3) {
    issues.push('Título muito curto');
    score -= 20;
  }

  const isInappropriate = await detectInappropriateContent(review.content);
  if (isInappropriate) {
    issues.push('Conteúdo inapropriado detectado');
    score -= 50;
  }

  if (review.rating < 1 || review.rating > 5) {
    issues.push('Rating inválido');
    score -= 50;
  }

  return {
    isValid: score >= 50,
    score: Math.max(0, score),
    issues,
  };
}

/**
 * Calcular score de confiabilidade do reviewer
 */
export function calculateReviewerTrustScore(reviewerStats: {
  totalReviews: number;
  averageRating: number;
  verifiedPurchase: boolean;
  accountAge: number;
  helpfulCount: number;
  reportedCount: number;
}): number {
  let score = 50;

  if (reviewerStats.totalReviews > 10) score += 15;
  if (reviewerStats.totalReviews > 50) score += 10;
  if (reviewerStats.accountAge > 30) score += 10;
  if (reviewerStats.accountAge > 365) score += 10;
  if (reviewerStats.verifiedPurchase) score += 15;
  if (reviewerStats.helpfulCount > 5) score += 10;

  score -= reviewerStats.reportedCount * 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Calcular rating médio com ponderação
 */
export function calculateWeightedAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  for (const review of reviews) {
    const weight = review.verified ? 1.5 : 1;
    totalScore += review.rating * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Distribuição de ratings
 */
export function getRatingDistribution(reviews: Review[]): Record<number, number> {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const review of reviews) {
    distribution[review.rating]++;
  }

  return distribution;
}

/**
 * Encontrar reviews úteis (trending)
 */
export function getTrendingReviews(reviews: Review[], limit: number = 5): Review[] {
  return reviews
    .sort((a, b) => b.helpful - a.helpful)
    .slice(0, limit);
}

/**
 * Agrupar reviews por sentimento
 */
export function groupReviewsBySentiment(reviews: Review[]): {
  positive: Review[];
  neutral: Review[];
  negative: Review[];
} {
  return {
    positive: reviews.filter(r => r.sentiment === 'positive'),
    neutral: reviews.filter(r => r.sentiment === 'neutral'),
    negative: reviews.filter(r => r.sentiment === 'negative'),
  };
}

/**
 * Gerar insights de reviews com IA
 */
export async function generateReviewInsights(reviews: Review[]): Promise<string> {
  if (reviews.length === 0) return 'Sem reviews disponíveis';

  const sentiments = groupReviewsBySentiment(reviews);
  const avgRating = calculateWeightedAverageRating(reviews);
  const topReviews = getTrendingReviews(reviews, 3);

  const topicsText = topReviews
    .map(r => `- ${r.title}: ${r.content.substring(0, 100)}...`)
    .join('\n');

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista. Gere um resumo executivo em 2-3 frases.',
        },
        {
          role: 'user',
          content: `Rating: ${avgRating.toFixed(1)}/5\nPositivos: ${sentiments.positive.length}\nNeutros: ${sentiments.neutral.length}\nNegativos: ${sentiments.negative.length}\n\nTop:\n${topicsText}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : 'Análise não disponível';
  } catch (error) {
    console.error('[Reviews] Erro ao gerar insights:', error);
    return 'Análise não disponível';
  }
}

/**
 * Detectar reviews duplicados
 */
export function detectDuplicateReviews(reviews: Review[], threshold: number = 0.8): Review[][] {
  const duplicates: Review[][] = [];

  for (let i = 0; i < reviews.length; i++) {
    for (let j = i + 1; j < reviews.length; j++) {
      const similarity = calculateSimilarity(reviews[i].content, reviews[j].content);
      if (similarity > threshold && reviews[i].reviewerId === reviews[j].reviewerId) {
        duplicates.push([reviews[i], reviews[j]]);
      }
    }
  }

  return duplicates;
}

/**
 * Calcular similaridade entre strings (Levenshtein)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}
