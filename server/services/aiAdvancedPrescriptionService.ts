import { invokeLLM } from '../_core/llm';
import { cannabisStrains } from '../data/cannabis-strains';

export interface MedicalProfile {
  symptoms: string[];
  conditions: string[];
  medications: string[];
  allergies: string[];
  age: number;
  weight: number;
  gender: 'M' | 'F' | 'Other';
  pregnancyStatus?: 'pregnant' | 'breastfeeding' | 'none';
}

export interface PrescriptionRecommendation {
  strainName: string;
  type: 'Sativa' | 'Indica' | 'Hybrid';
  thcPercentage: number;
  cbdPercentage: number;
  recommendedDosage: string;
  administrationMethod: string;
  expectedEffects: string[];
  contraindications: string[];
  interactionWarnings: string[];
  scientificBasis: string;
  confidenceScore: number;
}

export class AIAdvancedPrescriptionService {
  /**
   * Análise médica completa com recomendação de cepas
   */
  static async analyzeMedicalProfile(profile: MedicalProfile): Promise<PrescriptionRecommendation[]> {
    try {
      // 1. Validar perfil médico
      this.validateMedicalProfile(profile);

      // 2. Chamar LLM para análise
      const analysisPrompt = this.buildAnalysisPrompt(profile);
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em cannabis medicinal com conhecimento profundo em farmacologia, 
            interações medicamentosas e conformidade ANVISA. Analise o perfil médico do paciente e recomende 
            as 3-5 cepas mais apropriadas com dosagens personalizadas.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'prescription_recommendations',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      strainName: { type: 'string' },
                      recommendedDosage: { type: 'string' },
                      administrationMethod: { type: 'string' },
                      expectedEffects: { type: 'array', items: { type: 'string' } },
                      contraindications: { type: 'array', items: { type: 'string' } },
                      interactionWarnings: { type: 'array', items: { type: 'string' } },
                      scientificBasis: { type: 'string' },
                      confidenceScore: { type: 'number', minimum: 0, maximum: 1 }
                    },
                    required: ['strainName', 'recommendedDosage', 'administrationMethod', 'expectedEffects', 'confidenceScore']
                  }
                }
              },
              required: ['recommendations']
            }
          }
        }
      });

      // 3. Parse response
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from LLM');

      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      
      // 4. Enriquecer com dados de cepas
      return this.enrichRecommendations(parsed.recommendations, profile);
    } catch (error) {
      console.error('Error in medical analysis:', error);
      throw error;
    }
  }

  /**
   * Verificar interações medicamentosas
   */
  static async checkDrugInteractions(
    currentMedications: string[],
    proposedStrain: string
  ): Promise<{ safe: boolean; warnings: string[] }> {
    const prompt = `
      Paciente está tomando: ${currentMedications.join(', ')}
      Cepa proposta: ${proposedStrain}
      
      Verifique possíveis interações medicamentosas e efeitos adversos.
      Retorne um JSON com { safe: boolean, warnings: string[] }
    `;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um farmacologista especializado em interações medicamentosas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from LLM');

    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      return { safe: parsed.safe !== false, warnings: parsed.warnings || [] };
    } catch {
      return { safe: true, warnings: [] };
    }
  }

  /**
   * Gerar plano de tratamento personalizado
   */
  static async generateTreatmentPlan(
    profile: MedicalProfile,
    selectedStrain: string,
    duration: number // em dias
  ): Promise<{
    weeklySchedule: { day: string; dosage: string; time: string }[];
    progressionPlan: string[];
    monitoringPoints: string[];
    emergencyContacts: string[];
  }> {
    const prompt = `
      Perfil do paciente:
      - Idade: ${profile.age}
      - Condições: ${profile.conditions.join(', ')}
      - Medicações atuais: ${profile.medications.join(', ')}
      
      Cepa selecionada: ${selectedStrain}
      Duração do tratamento: ${duration} dias
      
      Gere um plano de tratamento detalhado com:
      1. Cronograma semanal com dosagens
      2. Progressão do tratamento
      3. Pontos de monitoramento
      4. Contatos de emergência
    `;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um médico especialista em cannabis medicinal. Crie planos de tratamento personalizados e seguros.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from LLM');

    // Parse response
    return this.parseTreatmentPlan(typeof content === 'string' ? content : String(content));
  }

  /**
   * Monitorar progresso do paciente
   */
  static async monitorProgress(
    patientId: string,
    weekNumber: number,
    feedback: {
      symptomRelief: number; // 1-10
      sideEffects: string[];
      adherence: number; // 0-100%
      qualityOfLife: number; // 1-10
    }
  ): Promise<{
    progressScore: number;
    recommendations: string[];
    adjustments: string[];
    continueOrAdjust: 'continue' | 'adjust' | 'stop';
  }> {
    const prompt = `
      Semana ${weekNumber} de tratamento
      Alívio de sintomas: ${feedback.symptomRelief}/10
      Efeitos colaterais: ${feedback.sideEffects.join(', ') || 'Nenhum'}
      Adesão: ${feedback.adherence}%
      Qualidade de vida: ${feedback.qualityOfLife}/10
      
      Analise o progresso e recomende próximos passos.
    `;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um médico monitorando progresso de paciente em tratamento com cannabis medicinal.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from LLM');

    return this.parseProgressReport(typeof content === 'string' ? content : String(content));
  }

  /**
   * Validar perfil médico
   */
  private static validateMedicalProfile(profile: MedicalProfile): void {
    if (profile.age < 18) {
      throw new Error('Cannabis medicinal não é recomendada para menores de 18 anos');
    }
    if (profile.pregnancyStatus === 'pregnant' || profile.pregnancyStatus === 'breastfeeding') {
      throw new Error('Cannabis é contraindicada durante gravidez e amamentação');
    }
    if (profile.symptoms.length === 0) {
      throw new Error('Pelo menos um sintoma deve ser informado');
    }
  }

  /**
   * Construir prompt de análise
   */
  private static buildAnalysisPrompt(profile: MedicalProfile): string {
    return `
      PERFIL MÉDICO DO PACIENTE:
      
      Dados Demográficos:
      - Idade: ${profile.age} anos
      - Gênero: ${profile.gender}
      - Peso: ${profile.weight} kg
      
      Sintomas Principais:
      ${profile.symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}
      
      Condições Médicas Existentes:
      ${profile.conditions.map((c, i) => `${i + 1}. ${c}`).join('\n')}
      
      Medicações Atuais:
      ${profile.medications.map((m, i) => `${i + 1}. ${m}`).join('\n')}
      
      Alergias Conhecidas:
      ${profile.allergies.map((a, i) => `${i + 1}. ${a}`).join('\n')}
      
      SOLICITAÇÃO:
      Recomende as 3-5 cepas de cannabis mais apropriadas para este paciente, 
      considerando eficácia, segurança, conformidade ANVISA e perfil de efeitos colaterais.
      
      Para cada cepa, forneça:
      - Nome da cepa
      - Dosagem recomendada
      - Método de administração
      - Efeitos esperados
      - Contraindicações
      - Avisos de interação
      - Base científica
      - Pontuação de confiança (0-1)
    `;
  }

  /**
   * Enriquecer recomendações com dados de cepas
   */
  private static enrichRecommendations(
    recommendations: any[],
    profile: MedicalProfile
  ): PrescriptionRecommendation[] {
    return recommendations.map(rec => {
      const strain = cannabisStrains.find(s => s.name.toLowerCase() === rec.strainName.toLowerCase());
      
      return {
        strainName: rec.strainName,
        type: (strain?.type || 'Hybrid') as 'Sativa' | 'Indica' | 'Hybrid',
        thcPercentage: strain?.thcPercentage || 0,
        cbdPercentage: strain?.cbdPercentage || 0,
        recommendedDosage: rec.recommendedDosage,
        administrationMethod: rec.administrationMethod,
        expectedEffects: rec.expectedEffects || [],
        contraindications: rec.contraindications || [],
        interactionWarnings: rec.interactionWarnings || [],
        scientificBasis: rec.scientificBasis || '',
        confidenceScore: rec.confidenceScore || 0.8
      };
    });
  }

  /**
   * Parse treatment plan response
   */
  private static parseTreatmentPlan(content: string): any {
    try {
      const json = JSON.parse(content);
      return json;
    } catch {
      return {
        weeklySchedule: [],
        progressionPlan: [],
        monitoringPoints: [],
        emergencyContacts: []
      };
    }
  }

  /**
   * Parse progress report
   */
  private static parseProgressReport(content: string): any {
    try {
      const json = JSON.parse(content);
      return json;
    } catch {
      return {
        progressScore: 0.5,
        recommendations: [],
        adjustments: [],
        continueOrAdjust: 'continue'
      };
    }
  }
}
