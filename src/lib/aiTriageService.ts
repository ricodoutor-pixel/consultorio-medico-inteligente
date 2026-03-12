/**
 * AI TRIAGE SERVICE - Triagem Inteligente com IA
 * Analisa queixa do paciente e sugere especialista
 */

import { supabase } from '@/integrations/supabase/client';

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
  try {
    const { data, error } = await supabase.functions.invoke('triage-summary', {
      body: {
        chiefComplaint: input.chiefComplaint,
        symptoms: input.symptoms,
        medicalHistory: input.medicalHistory,
        currentMedications: input.currentMedications,
      },
    });

    if (error) throw error;

    return {
      suggestedConditions: data.conditions || [],
      suggestedSpecialty: data.specialty || 'clínica geral',
      confidence: data.confidence || 0.5,
      reasoning: data.reasoning || 'Triagem realizada com sucesso',
    };
  } catch (error) {
    console.error('Erro na triagem de IA:', error);
    // Fallback: use keyword matching
    const matchedSpecialty = findSpecialtyByKeywords(input.chiefComplaint, input.symptoms);
    return {
      suggestedConditions: input.symptoms,
      suggestedSpecialty: matchedSpecialty,
      confidence: 0.5,
      reasoning: 'Triagem baseada em palavras-chave (fallback)',
    };
  }
}

function findSpecialtyByKeywords(complaint: string, symptoms: string[]): string {
  const allText = [complaint, ...symptoms].join(' ').toLowerCase();
  for (const [keyword, specialty] of Object.entries(SPECIALTY_MAPPING)) {
    if (allText.includes(keyword)) return specialty;
  }
  return 'clínica geral';
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
