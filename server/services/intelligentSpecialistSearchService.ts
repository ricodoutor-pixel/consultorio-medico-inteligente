import { invokeLLM } from '../_core/llm';

export interface SpecialistProfile {
  id: string;
  name: string;
  specialty: string;
  subspecialties: string[];
  credentials: string[];
  yearsOfExperience: number;
  languages: string[];
  consultationFee: number;
  responseTimeMinutes: number;
  availabilityHours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  rating: number;
  reviewCount: number;
  successRate: number;
  treatmentAreas: string[];
  onlineStatus: 'online' | 'offline' | 'busy';
  nextAvailableSlot: Date;
  cancellationRate: number;
}

export interface SearchCriteria {
  symptoms: string[];
  conditions: string[];
  preferredLanguage: string;
  maxConsultationFee: number;
  minRating: number;
  preferredResponseTime: number;
  availableNow: boolean;
  specialtyPreference?: string;
}

export interface SearchResult {
  specialist: SpecialistProfile;
  matchScore: number; // 0-100
  matchReasons: string[];
  estimatedWaitTime: number; // minutes
  recommendationStrength: 'strong' | 'moderate' | 'weak';
}

export class IntelligentSpecialistSearchService {
  private static specialists: Map<string, SpecialistProfile> = new Map();
  private static searchHistory: Array<{
    criteria: SearchCriteria;
    results: SearchResult[];
    timestamp: Date;
  }> = [];

  /**
   * Registrar especialista
   */
  static registerSpecialist(specialist: SpecialistProfile): void {
    this.specialists.set(specialist.id, specialist);
  }

  /**
   * Buscar especialistas com IA
   */
  static async searchSpecialists(criteria: SearchCriteria): Promise<SearchResult[]> {
    try {
      const allSpecialists = Array.from(this.specialists.values());

      if (allSpecialists.length === 0) {
        return this.getMockSearchResults(criteria);
      }

      // Usar IA para ranking inteligente
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Você é um assistente de busca de especialistas médicos. Rank os especialistas baseado na adequação ao perfil do paciente.
            Considere: sintomas, experiência, especialidade, avaliações, disponibilidade, custo.`
          },
          {
            role: 'user',
            content: this.buildSearchPrompt(criteria, allSpecialists)
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'specialist_ranking',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                ranking: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      specialistId: { type: 'string' },
                      matchScore: { type: 'number' },
                      matchReasons: { type: 'array', items: { type: 'string' } },
                      recommendationStrength: { type: 'string' }
                    },
                    required: ['specialistId', 'matchScore', 'matchReasons', 'recommendationStrength']
                  }
                }
              },
              required: ['ranking'],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;

      const results: SearchResult[] = parsed.ranking.map((rank: any) => {
        const specialist = allSpecialists.find(s => s.id === rank.specialistId);
        return {
          specialist: specialist!,
          matchScore: rank.matchScore,
          matchReasons: rank.matchReasons,
          estimatedWaitTime: specialist?.responseTimeMinutes || 30,
          recommendationStrength: rank.recommendationStrength
        };
      });

      // Salvar histórico de busca
      this.searchHistory.push({
        criteria,
        results,
        timestamp: new Date()
      });

      return results.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error searching specialists:', error);
      return this.getMockSearchResults(criteria);
    }
  }

  /**
   * Construir prompt de busca
   */
  private static buildSearchPrompt(criteria: SearchCriteria, specialists: SpecialistProfile[]): string {
    return `
Encontre os melhores especialistas para este paciente:

PERFIL DO PACIENTE:
- Sintomas: ${criteria.symptoms.join(', ')}
- Condições: ${criteria.conditions.join(', ')}
- Idioma preferido: ${criteria.preferredLanguage}
- Orçamento máximo: R$ ${criteria.maxConsultationFee}
- Avaliação mínima: ${criteria.minRating}★
- Tempo de resposta preferido: ${criteria.preferredResponseTime} minutos
- Disponível agora: ${criteria.availableNow ? 'Sim' : 'Não'}
${criteria.specialtyPreference ? `- Especialidade preferida: ${criteria.specialtyPreference}` : ''}

ESPECIALISTAS DISPONÍVEIS:
${specialists.map(s => `
ID: ${s.id}
Nome: ${s.name}
Especialidade: ${s.specialty}
Subespecialidades: ${s.subspecialties.join(', ')}
Experiência: ${s.yearsOfExperience} anos
Idiomas: ${s.languages.join(', ')}
Taxa: R$ ${s.consultationFee}
Tempo de resposta: ${s.responseTimeMinutes} min
Avaliação: ${s.rating}★ (${s.reviewCount} reviews)
Taxa de sucesso: ${s.successRate}%
Áreas de tratamento: ${s.treatmentAreas.join(', ')}
Status: ${s.onlineStatus}
`).join('\n')}

Rank os 3 melhores especialistas com:
1. ID do especialista
2. Score de compatibilidade (0-100)
3. Razões da compatibilidade (array)
4. Força da recomendação (strong|moderate|weak)
    `;
  }

  /**
   * Obter resultados mock para teste
   */
  private static getMockSearchResults(criteria: SearchCriteria): SearchResult[] {
    const mockSpecialists: SpecialistProfile[] = [
      {
        id: 'spec_001',
        name: 'Dr. Carlos Silva',
        specialty: 'Cannabis Medicinal',
        subspecialties: ['Neurologia', 'Dor Crônica'],
        credentials: ['CRM 123456', 'Especialista em Cannabis'],
        yearsOfExperience: 15,
        languages: ['Português', 'Inglês'],
        consultationFee: 150,
        responseTimeMinutes: 5,
        availabilityHours: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' }
        ],
        rating: 4.9,
        reviewCount: 287,
        successRate: 92,
        treatmentAreas: ['Dor Crônica', 'Ansiedade', 'Insônia', 'Epilepsia'],
        onlineStatus: 'online',
        nextAvailableSlot: new Date(Date.now() + 15 * 60 * 1000),
        cancellationRate: 2
      },
      {
        id: 'spec_002',
        name: 'Dra. Marina Santos',
        specialty: 'Farmacologia Clínica',
        subspecialties: ['Cannabis', 'Interações Medicamentosas'],
        credentials: ['CRM 789012', 'PhD em Farmacologia'],
        yearsOfExperience: 12,
        languages: ['Português', 'Inglês', 'Espanhol'],
        consultationFee: 180,
        responseTimeMinutes: 10,
        availabilityHours: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '19:00' },
          { dayOfWeek: 3, startTime: '10:00', endTime: '19:00' }
        ],
        rating: 4.8,
        reviewCount: 156,
        successRate: 88,
        treatmentAreas: ['Interações Medicamentosas', 'Otimização de Dosagem', 'Efeitos Colaterais'],
        onlineStatus: 'online',
        nextAvailableSlot: new Date(Date.now() + 30 * 60 * 1000),
        cancellationRate: 1
      }
    ];

    return mockSpecialists.map(specialist => ({
      specialist,
      matchScore: 85 + Math.random() * 15,
      matchReasons: [
        'Especialidade alinhada com sintomas',
        'Avaliação excelente',
        'Disponível agora',
        'Experiência relevante'
      ],
      estimatedWaitTime: specialist.responseTimeMinutes,
      recommendationStrength: 'strong'
    }));
  }

  /**
   * Obter especialista por ID
   */
  static getSpecialist(specialistId: string): SpecialistProfile | undefined {
    return this.specialists.get(specialistId);
  }

  /**
   * Atualizar status do especialista
   */
  static updateSpecialistStatus(
    specialistId: string,
    status: 'online' | 'offline' | 'busy'
  ): void {
    const specialist = this.specialists.get(specialistId);
    if (specialist) {
      specialist.onlineStatus = status;
    }
  }

  /**
   * Obter especialistas por especialidade
   */
  static getSpecialistsBySpecialty(specialty: string): SpecialistProfile[] {
    return Array.from(this.specialists.values()).filter(
      s => s.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
  }

  /**
   * Obter especialistas online
   */
  static getOnlineSpecialists(): SpecialistProfile[] {
    return Array.from(this.specialists.values()).filter(s => s.onlineStatus === 'online');
  }

  /**
   * Calcular score de compatibilidade manual
   */
  static calculateCompatibilityScore(
    specialist: SpecialistProfile,
    criteria: SearchCriteria
  ): number {
    let score = 50; // Base score

    // Avaliação
    score += (specialist.rating / 5) * 20;

    // Experiência
    score += Math.min((specialist.yearsOfExperience / 20) * 15, 15);

    // Taxa de sucesso
    score += (specialist.successRate / 100) * 10;

    // Custo
    if (specialist.consultationFee <= criteria.maxConsultationFee) {
      score += 5;
    }

    // Disponibilidade
    if (specialist.onlineStatus === 'online') {
      score += 5;
    }

    // Idioma
    if (specialist.languages.includes(criteria.preferredLanguage)) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Obter histórico de buscas
   */
  static getSearchHistory(limit: number = 10): Array<{
    criteria: SearchCriteria;
    results: SearchResult[];
    timestamp: Date;
  }> {
    return this.searchHistory.slice(-limit);
  }

  /**
   * Obter estatísticas de busca
   */
  static getSearchStats(): {
    totalSearches: number;
    mostSearchedSymptoms: string[];
    averageResultsPerSearch: number;
    topSpecialists: string[];
  } {
    const allSymptoms: string[] = [];
    const specialistCounts: Record<string, number> = {};

    for (const search of this.searchHistory) {
      allSymptoms.push(...search.criteria.symptoms);
      for (const result of search.results) {
        specialistCounts[result.specialist.id] = (specialistCounts[result.specialist.id] || 0) + 1;
      }
    }

    const symptomCounts: Record<string, number> = {};
    for (const symptom of allSymptoms) {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    }

    const mostSearchedSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom]) => symptom);

    const topSpecialists = Object.entries(specialistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    return {
      totalSearches: this.searchHistory.length,
      mostSearchedSymptoms,
      averageResultsPerSearch: this.searchHistory.length > 0
        ? this.searchHistory.reduce((sum, s) => sum + s.results.length, 0) / this.searchHistory.length
        : 0,
      topSpecialists
    };
  }
}
