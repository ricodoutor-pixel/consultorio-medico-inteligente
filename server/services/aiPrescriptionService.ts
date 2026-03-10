import { invokeLLM } from '../_core/llm';

export interface PatientProfile {
  age: number;
  gender: 'M' | 'F' | 'O';
  symptoms: string[];
  medicalConditions: string[];
  currentMedications: string[];
  allergies: string[];
  previousCannabisExperience: 'none' | 'minimal' | 'moderate' | 'experienced';
  preferredConsumptionMethod: 'smoking' | 'vaping' | 'edibles' | 'tincture' | 'topical' | 'no_preference';
  liverFunction: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  kidneyFunction: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
}

export interface CannabisStrain {
  id: string;
  name: string;
  thcPercentage: number;
  cbdPercentage: number;
  cbgPercentage: number;
  cbcPercentage: number;
  dominantTerpenes: string[];
  effects: string[];
  medicalUses: string[];
  sideEffects: string[];
  recommendedDosage: string;
  consumptionMethods: string[];
  growthTime: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
}

export interface PrescriptionRecommendation {
  patientId: string;
  strainRecommendations: Array<{
    strain: CannabisStrain;
    suitabilityScore: number; // 0-100
    reasoning: string;
    dosageRecommendation: string;
    expectedEffects: string[];
    warnings: string[];
    interactionRisks: string[];
  }>;
  treatmentPlan: {
    duration: string;
    followUpSchedule: string;
    successMetrics: string[];
    contraindications: string[];
  };
  alternativeOptions: string[];
  monitoringRecommendations: string[];
  createdAt: Date;
  validUntil: Date;
}

export class AIPrescriptionService {
  private static strainDatabase: Map<string, CannabisStrain> = new Map();
  private static prescriptions: Map<string, PrescriptionRecommendation> = new Map();

  /**
   * Gerar prescrição inteligente de cannabis
   */
  static async generatePrescription(
    patientId: string,
    profile: PatientProfile
  ): Promise<PrescriptionRecommendation> {
    try {
      const prompt = this.buildPrescriptionPrompt(profile);

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em cannabis medicinal com profundo conhecimento em farmacologia, interações medicamentosas e prática clínica. 
            Forneça recomendações baseadas em evidências científicas, considerando segurança e eficácia.
            Responda em JSON estruturado.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'prescription_recommendation',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                recommendedStrains: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      strainName: { type: 'string' },
                      thcPercentage: { type: 'number' },
                      cbdPercentage: { type: 'number' },
                      suitabilityScore: { type: 'number' },
                      reasoning: { type: 'string' },
                      dosageRecommendation: { type: 'string' },
                      expectedEffects: { type: 'array', items: { type: 'string' } },
                      warnings: { type: 'array', items: { type: 'string' } },
                      interactionRisks: { type: 'array', items: { type: 'string' } }
                    },
                    required: [
                      'strainName',
                      'thcPercentage',
                      'cbdPercentage',
                      'suitabilityScore',
                      'reasoning',
                      'dosageRecommendation',
                      'expectedEffects',
                      'warnings',
                      'interactionRisks'
                    ]
                  },
                  description: 'Top 3 recommended strains'
                },
                treatmentPlan: {
                  type: 'object',
                  properties: {
                    duration: { type: 'string' },
                    followUpSchedule: { type: 'string' },
                    successMetrics: { type: 'array', items: { type: 'string' } },
                    contraindications: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['duration', 'followUpSchedule', 'successMetrics', 'contraindications']
                },
                alternativeOptions: { type: 'array', items: { type: 'string' } },
                monitoringRecommendations: { type: 'array', items: { type: 'string' } }
              },
              required: [
                'recommendedStrains',
                'treatmentPlan',
                'alternativeOptions',
                'monitoringRecommendations'
              ],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;

      const recommendation: PrescriptionRecommendation = {
        patientId,
        strainRecommendations: parsed.recommendedStrains.map((strain: any) => ({
          strain: {
            id: `strain_${Date.now()}_${Math.random()}`,
            name: strain.strainName,
            thcPercentage: strain.thcPercentage,
            cbdPercentage: strain.cbdPercentage,
            cbgPercentage: 0,
            cbcPercentage: 0,
            dominantTerpenes: [],
            effects: strain.expectedEffects,
            medicalUses: [],
            sideEffects: [],
            recommendedDosage: strain.dosageRecommendation,
            consumptionMethods: [profile.preferredConsumptionMethod],
            growthTime: 0,
            difficulty: 'moderate'
          },
          suitabilityScore: strain.suitabilityScore,
          reasoning: strain.reasoning,
          dosageRecommendation: strain.dosageRecommendation,
          expectedEffects: strain.expectedEffects,
          warnings: strain.warnings,
          interactionRisks: strain.interactionRisks
        })),
        treatmentPlan: parsed.treatmentPlan,
        alternativeOptions: parsed.alternativeOptions,
        monitoringRecommendations: parsed.monitoringRecommendations,
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      };

      this.prescriptions.set(patientId, recommendation);
      return recommendation;
    } catch (error) {
      console.error('Error generating prescription:', error);
      throw error;
    }
  }

  /**
   * Construir prompt para prescrição
   */
  private static buildPrescriptionPrompt(profile: PatientProfile): string {
    return `
Analise o seguinte perfil do paciente e recomende as 3 melhores cepas de cannabis medicinal:

PERFIL DO PACIENTE:
- Idade: ${profile.age} anos
- Gênero: ${profile.gender}
- Sintomas principais: ${profile.symptoms.join(', ')}
- Condições médicas: ${profile.medicalConditions.join(', ') || 'Nenhuma'}
- Medicações atuais: ${profile.currentMedications.join(', ') || 'Nenhuma'}
- Alergias: ${profile.allergies.join(', ') || 'Nenhuma'}
- Experiência prévia com cannabis: ${profile.previousCannabisExperience}
- Método de consumo preferido: ${profile.preferredConsumptionMethod}
- Função hepática: ${profile.liverFunction}
- Função renal: ${profile.kidneyFunction}

REQUISITOS:
1. Recomende as 3 melhores cepas com base em:
   - Perfil de canabinoides (THC/CBD/CBG/CBC)
   - Terpenos dominantes
   - Efeitos esperados
   - Segurança e tolerabilidade
   - Interações medicamentosas

2. Para cada cepa, forneça:
   - Nome da cepa
   - Percentual de THC (0-30%)
   - Percentual de CBD (0-25%)
   - Pontuação de adequação (0-100)
   - Justificativa clínica
   - Dosagem recomendada
   - Efeitos esperados
   - Avisos de segurança
   - Riscos de interação

3. Plano de tratamento:
   - Duração recomendada
   - Cronograma de acompanhamento
   - Métricas de sucesso
   - Contraindicações

4. Opções alternativas (não-cannabis)

5. Recomendações de monitoramento

Forneça recomendações baseadas em evidências científicas e boas práticas clínicas.
    `;
  }

  /**
   * Obter prescrição do paciente
   */
  static getPrescription(patientId: string): PrescriptionRecommendation | undefined {
    return this.prescriptions.get(patientId);
  }

  /**
   * Atualizar prescrição
   */
  static async updatePrescription(
    patientId: string,
    profile: PatientProfile
  ): Promise<PrescriptionRecommendation> {
    this.prescriptions.delete(patientId);
    return this.generatePrescription(patientId, profile);
  }

  /**
   * Verificar compatibilidade com medicações
   */
  static async checkMedicationCompatibility(
    medications: string[],
    strainName: string
  ): Promise<{
    compatible: boolean;
    interactions: string[];
    severity: 'none' | 'mild' | 'moderate' | 'severe';
  }> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um farmacêutico especializado em interações cannabis-medicamentos. Forneça análise de compatibilidade em JSON.'
          },
          {
            role: 'user',
            content: `Verifique compatibilidade entre a cepa "${strainName}" e estas medicações: ${medications.join(', ')}. 
            Responda em JSON com: compatible (boolean), interactions (array de strings), severity (none|mild|moderate|severe)`
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (typeof content === 'string') {
        try {
          return JSON.parse(content);
        } catch {
          return {
            compatible: true,
            interactions: [],
            severity: 'none'
          };
        }
      }

      return {
        compatible: true,
        interactions: [],
        severity: 'none'
      };
    } catch (error) {
      console.error('Error checking medication compatibility:', error);
      return {
        compatible: true,
        interactions: [],
        severity: 'none'
      };
    }
  }

  /**
   * Gerar plano de titulação
   */
  static async generateTitrationPlan(
    strainName: string,
    startingCondition: string,
    consumptionMethod: string
  ): Promise<{
    week: number;
    dosage: string;
    frequency: string;
    expectedOutcome: string;
  }[]> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em cannabis medicinal. Forneça planos de titulação seguros e eficazes.'
          },
          {
            role: 'user',
            content: `Crie um plano de titulação de 8 semanas para "${strainName}" para ${startingCondition} usando ${consumptionMethod}. 
            Responda em JSON com array de objetos: week (número), dosage (string), frequency (string), expectedOutcome (string)`
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error('Error generating titration plan:', error);
      return [];
    }
  }

  /**
   * Avaliar resposta ao tratamento
   */
  static async evaluateTreatmentResponse(
    patientId: string,
    strainName: string,
    symptomsBefore: string[],
    symptomsAfter: string[],
    sideEffects: string[]
  ): Promise<{
    responseQuality: 'excellent' | 'good' | 'moderate' | 'poor';
    efficacyScore: number;
    tolerabilityScore: number;
    recommendations: string[];
  }> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em avaliação de resposta ao tratamento com cannabis medicinal.'
          },
          {
            role: 'user',
            content: `Avalie a resposta ao tratamento com "${strainName}":
            Sintomas antes: ${symptomsBefore.join(', ')}
            Sintomas após: ${symptomsAfter.join(', ')}
            Efeitos colaterais: ${sideEffects.join(', ') || 'Nenhum'}
            
            Responda em JSON: responseQuality (excellent|good|moderate|poor), efficacyScore (0-100), tolerabilityScore (0-100), recommendations (array)`
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (typeof content === 'string') {
        try {
          return JSON.parse(content);
        } catch {
          return {
            responseQuality: 'moderate',
            efficacyScore: 50,
            tolerabilityScore: 50,
            recommendations: []
          };
        }
      }

      return {
        responseQuality: 'moderate',
        efficacyScore: 50,
        tolerabilityScore: 50,
        recommendations: []
      };
    } catch (error) {
      console.error('Error evaluating treatment response:', error);
      return {
        responseQuality: 'moderate',
        efficacyScore: 50,
        tolerabilityScore: 50,
        recommendations: []
      };
    }
  }

  /**
   * Deletar prescrição
   */
  static deletePrescription(patientId: string): void {
    this.prescriptions.delete(patientId);
  }

  /**
   * Exportar prescrição em formato médico
   */
  static exportPrescription(patientId: string): string {
    const prescription = this.prescriptions.get(patientId);
    if (!prescription) return '';

    const topStrain = prescription.strainRecommendations[0];

    return `
PRESCRIÇÃO DE CANNABIS MEDICINAL
=================================

Data: ${prescription.createdAt.toLocaleDateString('pt-BR')}
Válida até: ${prescription.validUntil.toLocaleDateString('pt-BR')}

CEPA RECOMENDADA PRINCIPAL:
${topStrain.strain.name}
- THC: ${topStrain.strain.thcPercentage}%
- CBD: ${topStrain.strain.cbdPercentage}%
- Dosagem: ${topStrain.dosageRecommendation}

PLANO DE TRATAMENTO:
- Duração: ${prescription.treatmentPlan.duration}
- Acompanhamento: ${prescription.treatmentPlan.followUpSchedule}

EFEITOS ESPERADOS:
${topStrain.expectedEffects.map(e => `- ${e}`).join('\n')}

AVISOS IMPORTANTES:
${topStrain.warnings.map(w => `⚠️ ${w}`).join('\n')}

MONITORAMENTO RECOMENDADO:
${prescription.monitoringRecommendations.map(m => `- ${m}`).join('\n')}
    `;
  }
}
