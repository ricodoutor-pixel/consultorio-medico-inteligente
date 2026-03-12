/**
 * AI TRIAGE SERVICE - Triagem Inteligente com IA
 * Analisa queixa do paciente e sugere especialista
 */

import { invokeLLM } from './llm';

interface TriageInput {
  chiefComplaint: string;
  symptoms: string[];
  medicalHistory?: string;
  currentMedications?: string[];
}

interface TriageResult {
  suggestedConditions: string[];
  suggestedSpecialty: string;
  confidence: number;
  reasoning: string;
}

const SPECIALTY_MAPPING: Record<string, string> = {
  'ansiedade': 'psiquiatria',
  'depressão': 'psiquiatria',
  'insônia': 'psiquiatria',
  'estresse': 'psiquiatria',
  'dor crônica': 'neurologia',
  'enxaqueca': 'neurologia',
  'parkinson': 'neurologia',
  'epilepsia': 'neurologia',
  'artrite': 'reumatologia',
  'fibromialgia': 'reumatologia',
  'inflamação': 'reumatologia',
  'câncer': 'oncologia',
  'quimioterapia': 'oncologia',
  'dermatite': 'dermatologia',
  'psoríase': 'dermatologia',
  'acne': 'dermatologia',
  'neuropatia': 'neurologia',
  'glaucoma': 'oftalmologia',
  'esclerose múltipla': 'neurologia',
  'doença de crohn': 'gastroenterologia',
};

/**
 * Analisa queixa do paciente e sugere diagnóstico + especialista
 */
export async function performAITriage(input: TriageInput): Promise<TriageResult> {
  const prompt = `
Você é um assistente médico especializado em triagem de pacientes para cannabis medicinal.

Analise a seguinte informação do paciente e:
1. Identifique as possíveis condições médicas
2. Sugira a especialidade médica mais apropriada
3. Forneça um nível de confiança (0-1)

Queixa Principal: ${input.chiefComplaint}
Sintomas: ${input.symptoms.join(', ')}
Histórico Médico: ${input.medicalHistory || 'Não informado'}
Medicamentos Atuais: ${input.currentMedications?.join(', ') || 'Nenhum'}

Responda em JSON com a seguinte estrutura:
{
  "conditions": ["condição1", "condição2"],
  "specialty": "especialidade",
  "confidence": 0.85,
  "reasoning": "Explicação breve"
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente de triagem médica especializado em cannabis medicinal. Sempre responda em JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'triage_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              conditions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Possíveis condições médicas',
              },
              specialty: {
                type: 'string',
                description: 'Especialidade médica sugerida',
              },
              confidence: {
                type: 'number',
                description: 'Nível de confiança (0-1)',
              },
              reasoning: {
                type: 'string',
                description: 'Explicação da triagem',
              },
            },
            required: ['conditions', 'specialty', 'confidence', 'reasoning'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      suggestedConditions: parsed.conditions,
      suggestedSpecialty: parsed.specialty,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error('Erro na triagem de IA:', error);
    throw new Error('Falha ao processar triagem de IA');
  }
}

/**
 * Encontra médicos com melhor taxa de sucesso para a condição
 */
export async function findBestDoctorsForCondition(
  condition: string,
  specialty: string,
  limit: number = 5
): Promise<Array<{ id: string; name: string; successRate: number; rating: number }>> {
  // Esta função seria chamada após consultar o banco de dados
  // com a query: SELECT * FROM profiles WHERE role = 'doctor' AND specialty @> ARRAY[specialty]
  // E depois ordenar por success_rate DESC
  return [];
}

/**
 * Calcula score de compatibilidade entre paciente e médico
 */
export function calculateCompatibilityScore(
  patientCondition: string,
  doctorSpecialty: string,
  doctorSuccessRate: number,
  doctorRating: number
): number {
  const specialtyMatch = SPECIALTY_MAPPING[patientCondition.toLowerCase()] === doctorSpecialty ? 1 : 0.5;
  const successScore = doctorSuccessRate / 100;
  const ratingScore = doctorRating / 5;

  return (specialtyMatch * 0.5 + successScore * 0.3 + ratingScore * 0.2);
}

/**
 * Extrai palavras-chave da queixa para busca
 */
export function extractKeywords(text: string): string[] {
  const keywords = text
    .toLowerCase()
    .split(/[\s,\.!?]+/)
    .filter(word => word.length > 3)
    .filter(word => !['que', 'para', 'como', 'qual', 'onde', 'quando'].includes(word));

  return [...new Set(keywords)];
}
