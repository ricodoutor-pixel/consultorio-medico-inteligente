/**
 * Advanced Recommendation Service
 * ML-powered recommendations for professionals, products, and strains
 */

interface UserProfile {
  userId: string;
  age: number;
  gender: string;
  medicalHistory: string[];
  currentMedications: string[];
  preferences: string[];
  previousConsultations: string[];
  ratings: Map<string, number>;
  lastActive: Date;
}

interface Recommendation {
  id: string;
  userId: string;
  type: 'professional' | 'product' | 'strain';
  targetId: string;
  targetName: string;
  score: number; // 0-100
  reasons: string[];
  confidence: number; // 0-1
  generatedAt: Date;
  clicked: boolean;
  converted: boolean;
}

interface CollaborativeFiltering {
  userId: string;
  similarUsers: Array<{ userId: string; similarity: number }>;
  recommendations: Recommendation[];
}

interface ContentBased {
  userId: string;
  userPreferences: Map<string, number>;
  recommendations: Recommendation[];
}

export class AdvancedRecommendationService {
  private userProfiles: Map<string, UserProfile> = new Map();
  private recommendations: Map<string, Recommendation[]> = new Map();
  private collaborativeData: Map<string, CollaborativeFiltering> = new Map();
  private contentData: Map<string, ContentBased> = new Map();

  constructor() {
    this.initializeSampleProfiles();
  }

  /**
   * Initialize sample user profiles
   */
  private initializeSampleProfiles(): void {
    const profiles: UserProfile[] = [
      {
        userId: 'user_001',
        age: 35,
        gender: 'M',
        medicalHistory: ['Ansiedade', 'Insônia'],
        currentMedications: ['Sertraline'],
        preferences: ['Telemedicina', 'Prescrição Digital'],
        previousConsultations: ['prof_001', 'prof_002'],
        ratings: new Map([
          ['prof_001', 5],
          ['strain_001', 4],
          ['product_001', 5],
        ]),
        lastActive: new Date(),
      },
      {
        userId: 'user_002',
        age: 28,
        gender: 'F',
        medicalHistory: ['Dor Crônica', 'Fibromialgia'],
        currentMedications: ['Amitriptilina'],
        preferences: ['Chat', 'Prescrição Rápida'],
        previousConsultations: ['prof_003', 'prof_004'],
        ratings: new Map([
          ['prof_003', 4],
          ['strain_002', 5],
          ['product_002', 4],
        ]),
        lastActive: new Date(),
      },
    ];

    for (const profile of profiles) {
      this.userProfiles.set(profile.userId, profile);
    }
  }

  /**
   * Generate recommendations for user
   */
  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error('Perfil de usuário não encontrado');
    }

    const recommendations: Recommendation[] = [];

    // Collaborative filtering recommendations
    const collaborativeRecs = await this.getCollaborativeRecommendations(userId);
    recommendations.push(...collaborativeRecs);

    // Content-based recommendations
    const contentRecs = await this.getContentBasedRecommendations(userId);
    recommendations.push(...contentRecs);

    // Hybrid recommendations
    const hybridRecs = await this.getHybridRecommendations(userId);
    recommendations.push(...hybridRecs);

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    // Limit to top 10
    const topRecommendations = recommendations.slice(0, 10);

    this.recommendations.set(userId, topRecommendations);
    console.log(`[RECOMMENDATION] ${topRecommendations.length} recomendações geradas para ${userId}`);

    return topRecommendations;
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(userId: string): Promise<Recommendation[]> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return [];

    const recommendations: Recommendation[] = [];

    // Find similar users
    const similarUsers = this.findSimilarUsers(userId);

    // Get items rated by similar users
    for (const similarUser of similarUsers) {
      const similarProfile = this.userProfiles.get(similarUser.userId);
      if (!similarProfile) continue;

      const ratingsArray = Array.from(similarProfile.ratings);
      for (const [itemId, rating] of ratingsArray) {
        if (!userProfile.ratings.has(itemId)) {
          const rec: Recommendation = {
            id: `rec_${Date.now()}_${Math.random()}`,
            userId,
            type: this.getRecommendationType(itemId),
            targetId: itemId,
            targetName: this.getItemName(itemId),
            score: Math.round(rating * similarUser.similarity * 100),
            reasons: [`Usuários similares gostaram`, `Compatibilidade: ${Math.round(similarUser.similarity * 100)}%`],
            confidence: similarUser.similarity,
            generatedAt: new Date(),
            clicked: false,
            converted: false,
          };

          recommendations.push(rec);
        }
      }
    }

    return recommendations;
  }

  /**
   * Get content-based recommendations
   */
  private async getContentBasedRecommendations(userId: string): Promise<Recommendation[]> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return [];

    const recommendations: Recommendation[] = [];

    // Analyze user preferences
    const userPreferences = this.analyzeUserPreferences(userProfile);

    // Match with available items
    const matchedItems = this.matchItemsWithPreferences(userPreferences);

    const itemsArray = Array.from(matchedItems);
    for (const item of itemsArray) {
      const rec: Recommendation = {
        id: `rec_${Date.now()}_${Math.random()}`,
        userId,
        type: item.type,
        targetId: item.id,
        targetName: item.name,
        score: item.score,
        reasons: item.reasons,
        confidence: item.confidence,
        generatedAt: new Date(),
        clicked: false,
        converted: false,
      };

      recommendations.push(rec);
    }

    return recommendations;
  }

  /**
   * Get hybrid recommendations
   */
  private async getHybridRecommendations(userId: string): Promise<Recommendation[]> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return [];

    const recommendations: Recommendation[] = [];

    // Combine collaborative and content-based
    // Weight: 60% collaborative, 40% content-based

    // Based on medical history
    const medicalRecommendations = this.getRecommendationsByMedicalHistory(userProfile);
    recommendations.push(...medicalRecommendations);

    return recommendations;
  }

  /**
   * Find similar users
   */
  private findSimilarUsers(userId: string): Array<{ userId: string; similarity: number }> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return [];

    const similarUsers: Array<{ userId: string; similarity: number }> = [];

    const profilesArray = Array.from(this.userProfiles);
    for (const [otherUserId, otherProfile] of profilesArray) {
      if (otherUserId === userId) continue;

      // Calculate similarity based on medical history and preferences
      const medicalSimilarity = this.calculateMedicalSimilarity(userProfile, otherProfile);
      const preferenceSimilarity = this.calculatePreferenceSimilarity(userProfile, otherProfile);

      const totalSimilarity = (medicalSimilarity * 0.6 + preferenceSimilarity * 0.4);

      if (totalSimilarity > 0.5) {
        similarUsers.push({
          userId: otherUserId,
          similarity: totalSimilarity,
        });
      }
    }

    return similarUsers.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  /**
   * Calculate medical similarity between users
   */
  private calculateMedicalSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    const commonConditions = profile1.medicalHistory.filter(c => profile2.medicalHistory.includes(c)).length;
    const totalConditions = new Set([...profile1.medicalHistory, ...profile2.medicalHistory]).size;

    return totalConditions > 0 ? commonConditions / totalConditions : 0;
  }

  /**
   * Calculate preference similarity between users
   */
  private calculatePreferenceSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    const commonPreferences = profile1.preferences.filter(p => profile2.preferences.includes(p)).length;
    const totalPreferences = new Set([...profile1.preferences, ...profile2.preferences]).size;

    return totalPreferences > 0 ? commonPreferences / totalPreferences : 0;
  }

  /**
   * Analyze user preferences
   */
  private analyzeUserPreferences(profile: UserProfile): Map<string, number> {
    const preferences = new Map<string, number>();

    // Based on medical history
    for (const condition of profile.medicalHistory) {
      preferences.set(`condition_${condition}`, 0.8);
    }

    // Based on previous ratings
    const ratingsArray = Array.from(profile.ratings);
    for (const [itemId, rating] of ratingsArray) {
      preferences.set(`rated_${itemId}`, rating / 5);
    }

    // Based on preferences
    for (const pref of profile.preferences) {
      preferences.set(`pref_${pref}`, 0.7);
    }

    return preferences;
  }

  /**
   * Match items with preferences
   */
  private matchItemsWithPreferences(preferences: Map<string, number>): Array<{
    id: string;
    name: string;
    type: 'professional' | 'product' | 'strain';
    score: number;
    reasons: string[];
    confidence: number;
  }> {
    // This would match items from database with user preferences
    return [
      {
        id: 'prof_005',
        name: 'Dr. Especialista em Ansiedade',
        type: 'professional',
        score: 92,
        reasons: ['Especialista em sua condição', 'Avaliação: 4.9/5'],
        confidence: 0.92,
      },
      {
        id: 'strain_003',
        name: 'Remedy (CBD 15%)',
        type: 'strain',
        score: 88,
        reasons: ['Ideal para ansiedade', 'Baixo THC'],
        confidence: 0.88,
      },
    ];
  }

  /**
   * Get recommendations by medical history
   */
  private getRecommendationsByMedicalHistory(profile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Map conditions to recommendations
    const conditionMap: Record<string, Array<{ id: string; name: string; type: string }>> = {
      'Ansiedade': [
        { id: 'prof_005', name: 'Dr. Especialista em Ansiedade', type: 'professional' },
        { id: 'strain_001', name: 'Charlotte\'s Web', type: 'strain' },
      ],
      'Insônia': [
        { id: 'prof_006', name: 'Dra. Especialista em Sono', type: 'professional' },
        { id: 'strain_004', name: 'Pennywise', type: 'strain' },
      ],
      'Dor Crônica': [
        { id: 'prof_007', name: 'Dr. Especialista em Dor', type: 'professional' },
        { id: 'strain_002', name: 'AC/DC', type: 'strain' },
      ],
    };

    for (const condition of profile.medicalHistory) {
      const items = conditionMap[condition];
      if (items) {
        for (const item of items) {
          const rec: Recommendation = {
            id: `rec_${Date.now()}_${Math.random()}`,
            userId: profile.userId,
            type: item.type as any,
            targetId: item.id,
            targetName: item.name,
            score: 85,
            reasons: [`Recomendado para ${condition}`],
            confidence: 0.85,
            generatedAt: new Date(),
            clicked: false,
            converted: false,
          };

          recommendations.push(rec);
        }
      }
    }

    return recommendations;
  }

  /**
   * Get recommendation type
   */
  private getRecommendationType(itemId: string): 'professional' | 'product' | 'strain' {
    if (itemId.startsWith('prof_')) return 'professional';
    if (itemId.startsWith('product_')) return 'product';
    return 'strain';
  }

  /**
   * Get item name
   */
  private getItemName(itemId: string): string {
      const itemMap: Record<string, string> = {
      'prof_001': 'Dr. Silva',
      'prof_002': 'Dra. Santos',
      'strain_001': 'Charlotte\'s Web',
      'product_001': 'Óleo CBD 10%',
    };

    return itemMap[itemId] || itemId;
  }

  /**
   * Track recommendation interaction
   */
  async trackRecommendationInteraction(recommendationId: string, action: 'click' | 'convert'): Promise<void> {
    const recsArray = Array.from(this.recommendations.values());
    for (const recs of recsArray) {
      const rec = recs.find((r: Recommendation) => r.id === recommendationId);
      if (rec) {
        if (action === 'click') {
          rec.clicked = true;
        } else if (action === 'convert') {
          rec.converted = true;
        }
        console.log(`[RECOMMENDATION] Interação rastreada: ${recommendationId} - ${action}`);
        return;
      }
    }
  }

  /**
   * Get recommendation statistics
   */
  async getRecommendationStatistics(): Promise<{
    totalRecommendations: number;
    clickThroughRate: number;
    conversionRate: number;
    averageScore: number;
  }> {
    let totalRecs = 0;
    let clickedRecs = 0;
    let convertedRecs = 0;
    let totalScore = 0;

    const recsArray = Array.from(this.recommendations.values());
    for (const recs of recsArray) {
      for (const rec of recs) {
        totalRecs++;
        if (rec.clicked) clickedRecs++;
        if (rec.converted) convertedRecs++;
        totalScore += rec.score;
      }
    }

    return {
      totalRecommendations: totalRecs,
      clickThroughRate: totalRecs > 0 ? (clickedRecs / totalRecs) * 100 : 0,
      conversionRate: totalRecs > 0 ? (convertedRecs / totalRecs) * 100 : 0,
      averageScore: totalRecs > 0 ? totalScore / totalRecs : 0,
    };
  }
}

export const advancedRecommendationService = new AdvancedRecommendationService();
