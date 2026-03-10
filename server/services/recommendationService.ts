import { invokeLLM } from '../_core/llm';

interface UserProfile {
  userId: string;
  age: number;
  gender: string;
  symptoms: string[];
  medicalHistory: string[];
  preferences: string[];
  previousConsultations: string[];
  purchaseHistory: string[];
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  languages: string[];
  availability: string[];
  price: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  description: string;
  benefits: string[];
}

interface Strain {
  id: string;
  name: string;
  thcLevel: number;
  cbdLevel: number;
  effects: string[];
  flavors: string[];
  rating: number;
  reviews: number;
}

/**
 * Recomendar profissionais baseado no perfil do usuário
 */
export async function recommendProfessionals(
  userProfile: UserProfile,
  availableProfessionals: Professional[],
  limit: number = 5
): Promise<{ professional: Professional; score: number; reason: string }[]> {
  try {
    const symptomsText = userProfile.symptoms.join(', ');
    const specialtyPrompt = `Baseado nos sintomas: ${symptomsText}, qual seria a melhor especialidade médica para consultar? Responda com uma palavra.`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em recomendação médica.',
        },
        {
          role: 'user',
          content: specialtyPrompt,
        },
      ],
    });

    const recommendedSpecialty = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content.toLowerCase()
      : '';

    const scored = availableProfessionals.map(prof => {
      let score = prof.rating * 20; // Base score from rating

      // Specialty match
      if (prof.specialty.toLowerCase().includes(recommendedSpecialty)) {
        score += 30;
      }

      // Experience bonus
      score += Math.min(prof.experience * 2, 20);

      // Language bonus
      if (prof.languages.includes('Português')) {
        score += 10;
      }

      // Price consideration
      if (prof.price < 200) score += 5;

      return {
        professional: prof,
        score: Math.min(100, score),
        reason: `Especialista em ${prof.specialty} com ${prof.experience} anos de experiência`,
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('[Recommendation] Erro ao recomendar profissionais:', error);
    return [];
  }
}

/**
 * Recomendar produtos baseado no histórico de compra
 */
export async function recommendProducts(
  userProfile: UserProfile,
  availableProducts: Product[],
  limit: number = 5
): Promise<{ product: Product; score: number; reason: string }[]> {
  try {
    const purchaseHistory = userProfile.purchaseHistory.join(', ');
    const preferencesText = userProfile.preferences.join(', ');

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em recomendação de produtos de bem-estar.',
        },
        {
          role: 'user',
          content: `Histórico de compras: ${purchaseHistory}\nPreferências: ${preferencesText}\nRecomende categorias de produtos relevantes em uma frase.`,
        },
      ],
    });

    const recommendedCategories = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content.toLowerCase()
      : '';

    const scored = availableProducts.map(product => {
      let score = product.rating * 15;

      // Category match
      if (recommendedCategories.includes(product.category.toLowerCase())) {
        score += 25;
      }

      // Price consideration
      if (product.price < 100) score += 10;

      // Popularity
      score += Math.min(product.rating * 5, 15);

      return {
        product,
        score: Math.min(100, score),
        reason: `Produto popular com ${product.rating} de rating`,
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('[Recommendation] Erro ao recomendar produtos:', error);
    return [];
  }
}

/**
 * Recomendar variedades de cannabis baseado no perfil
 */
export async function recommendStrains(
  userProfile: UserProfile,
  availableStrains: Strain[],
  limit: number = 5
): Promise<{ strain: Strain; score: number; reason: string }[]> {
  try {
    const symptomsText = userProfile.symptoms.join(', ');

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em cannabis medicinal. Recomende perfis de THC/CBD ideais.',
        },
        {
          role: 'user',
          content: `Sintomas: ${symptomsText}\nRecomende um perfil ideal (ex: alto CBD, baixo THC ou equilibrado).`,
        },
      ],
    });

    const profileRecommendation = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content.toLowerCase()
      : '';

    const scored = availableStrains.map(strain => {
      let score = strain.rating * 15;

      // CBD-dominant for anxiety/pain
      if (
        (userProfile.symptoms.includes('ansiedade') ||
          userProfile.symptoms.includes('dor')) &&
        strain.cbdLevel > strain.thcLevel
      ) {
        score += 30;
      }

      // Balanced for general wellness
      if (
        userProfile.symptoms.includes('bem-estar') &&
        Math.abs(strain.thcLevel - strain.cbdLevel) < 5
      ) {
        score += 25;
      }

      // High THC for specific conditions
      if (
        userProfile.symptoms.includes('insônia') &&
        strain.thcLevel > 15
      ) {
        score += 20;
      }

      // Popularity
      score += Math.min(strain.reviews / 10, 10);

      return {
        strain,
        score: Math.min(100, score),
        reason: `${strain.name} - THC: ${strain.thcLevel}% | CBD: ${strain.cbdLevel}%`,
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('[Recommendation] Erro ao recomendar variedades:', error);
    return [];
  }
}

/**
 * Gerar recomendações personalizadas com IA
 */
export async function generatePersonalizedRecommendations(
  userProfile: UserProfile
): Promise<string> {
  try {
    const symptomsText = userProfile.symptoms.join(', ');
    const preferencesText = userProfile.preferences.join(', ');
    const ageGroup = userProfile.age < 30 ? 'jovem' : userProfile.age < 60 ? 'adulto' : 'senior';

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de saúde personalizado. Forneça recomendações concisas e práticas.',
        },
        {
          role: 'user',
          content: `Perfil: ${ageGroup}, ${userProfile.gender}\nSintomas: ${symptomsText}\nPreferências: ${preferencesText}\nForneça 3 recomendações personalizadas.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : 'Recomendações não disponíveis';
  } catch (error) {
    console.error('[Recommendation] Erro ao gerar recomendações:', error);
    return 'Recomendações não disponíveis';
  }
}

/**
 * Calcular compatibilidade entre usuário e profissional
 */
export function calculateCompatibilityScore(
  userProfile: UserProfile,
  professional: Professional
): number {
  let score = 0;

  // Rating (máx 30 pontos)
  score += professional.rating * 6;

  // Experience (máx 20 pontos)
  score += Math.min(professional.experience * 2, 20);

  // Language (máx 15 pontos)
  if (professional.languages.includes('Português')) score += 15;

  // Availability (máx 15 pontos)
  if (professional.availability.length > 0) score += 15;

  // Price (máx 20 pontos)
  if (professional.price < 150) score += 20;
  else if (professional.price < 250) score += 10;

  return Math.min(100, score);
}

/**
 * Encontrar profissionais similares
 */
export function findSimilarProfessionals(
  targetProfessional: Professional,
  allProfessionals: Professional[],
  limit: number = 5
): Professional[] {
  const scored = allProfessionals
    .filter(p => p.id !== targetProfessional.id)
    .map(p => {
      let similarity = 0;

      // Specialty match
      if (p.specialty === targetProfessional.specialty) similarity += 40;

      // Rating similarity
      similarity += 100 - Math.abs(p.rating - targetProfessional.rating) * 20;

      // Experience similarity
      similarity += 100 - Math.abs(p.experience - targetProfessional.experience) * 5;

      // Language overlap
      const commonLanguages = p.languages.filter(l =>
        targetProfessional.languages.includes(l)
      ).length;
      similarity += commonLanguages * 10;

      return { professional: p, similarity };
    });

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(item => item.professional);
}

/**
 * Análise de tendências de recomendação
 */
export function analyzeRecommendationTrends(
  recommendations: Array<{ score: number; category: string }>
): { topCategory: string; averageScore: number; trend: string } {
  const byCategory = recommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec.score);
      return acc;
    },
    {} as Record<string, number[]>
  );

  const categoryScores = Object.entries(byCategory).map(([category, scores]) => ({
    category,
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  const topCategory = categoryScores.sort((a, b) => b.average - a.average)[0];
  const averageScore =
    recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;

  let trend = 'estável';
  if (averageScore > 80) trend = 'excelente';
  else if (averageScore > 70) trend = 'bom';
  else if (averageScore < 50) trend = 'precisa melhorar';

  return {
    topCategory: topCategory?.category || 'N/A',
    averageScore: Math.round(averageScore),
    trend,
  };
}
