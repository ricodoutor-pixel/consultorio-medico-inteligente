import { invokeLLM } from '../_core/llm';

export interface SymptomAnalysis {
  symptoms: string[];
  recommendedSpecialties: string[];
  recommendedStrains: Array<{
    name: string;
    thcPercentage: number;
    cbdPercentage: number;
    score: number;
    reason: string;
  }>;
  contraindications: string[];
  medicalIndications: string[];
  urgencyLevel: 'baixa' | 'média' | 'alta' | 'emergência';
  nextSteps: string[];
}

export interface ProfessionalRecommendation {
  professionalId: string;
  name: string;
  specialty: string;
  rating: number;
  matchScore: number;
  availability: string[];
  reason: string;
}

/**
 * Serviço de IA autônoma para diagnóstico e recomendações
 * Implementa fluxo executável conforme Resolução CFM 2.113/2021 (Telemedicina)
 */
export class AIDiagnosisService {
  /**
   * Analisa sintomas do paciente e recomenda especialidades e variedades
   * Etapa 1: Pré-atendimento (IA Autônoma)
   */
  async analyzeSymptoms(symptoms: string[], patientAge: number): Promise<SymptomAnalysis> {
    const prompt = `
Você é um assistente médico especializado em cannabis medicinal, conforme RDC ANVISA 660/2022.

Analise os seguintes sintomas reportados pelo paciente:
${symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Idade do paciente: ${patientAge} anos

IMPORTANTE: Você NÃO está prescrevendo. Você está apenas recomendando especialidades e variedades para que um profissional LICENCIADO (CRM/CRO/CRMV) tome a decisão final.

Responda em JSON com a seguinte estrutura:
{
  "symptoms": ["lista dos sintomas"],
  "recommendedSpecialties": ["Neurologia", "Psiquiatria", "Medicina Canábica"],
  "recommendedStrains": [
    {
      "name": "Charlotte's Web",
      "thcPercentage": 0.3,
      "cbdPercentage": 17,
      "score": 9.5,
      "reason": "Alto CBD, baixo THC, ideal para epilepsia e ansiedade"
    }
  ],
  "contraindications": ["Gravidez", "Amamentação"],
  "medicalIndications": ["CID-10 codes"],
  "urgencyLevel": "média",
  "nextSteps": ["Agendar consulta com neurologista", "Trazer histórico de medicações"]
}
`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente médico especializado em cannabis medicinal. Responda sempre em JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices[0].message.content;
      if (typeof content === 'string') {
        return JSON.parse(content) as SymptomAnalysis;
      }

      throw new Error('Resposta inválida da IA');
    } catch (error) {
      console.error('Erro ao analisar sintomas:', error);
      throw error;
    }
  }

  /**
   * Gera termo de consentimento informado (TCLE)
   * Etapa 1: Pré-atendimento - Consentimento
   */
  async generateTCLE(
    patientName: string,
    symptoms: string[],
    recommendedStrains: string[]
  ): Promise<string> {
    const tcle = `
TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
Conforme Resolução CFM nº 1.931/2009 e RDC ANVISA nº 660/2022

PACIENTE: ${patientName}
DATA: ${new Date().toLocaleDateString('pt-BR')}

1. OBJETIVO
Você está sendo convidado a participar de um atendimento de telemedicina para avaliação de cannabis medicinal.

2. PROCEDIMENTOS
- Preenchimento de questionário de sintomas
- Teleconsulta com profissional licenciado (CRM/CRO/CRMV)
- Possível prescrição de cannabis medicinal
- Acompanhamento do tratamento

3. SINTOMAS RELATADOS
${symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}

4. VARIEDADES POTENCIALMENTE RECOMENDADAS
${recommendedStrains.map((s, i) => `${i + 1}. ${s}`).join('\n')}

5. RISCOS E BENEFÍCIOS
Benefícios: Alívio de sintomas, melhora da qualidade de vida
Riscos: Efeitos colaterais leves (tontura, boca seca), interações medicamentosas

6. CONFIDENCIALIDADE
Seus dados serão protegidos conforme LGPD (Lei Geral de Proteção de Dados).

7. DIREITO DE RECUSA
Você pode recusar ou interromper o tratamento a qualquer momento.

8. CONTATO
Em caso de dúvidas, entre em contato com: suporte@plantaeraiz.com.br

Eu, ${patientName}, declaro que:
- Li e compreendi este termo
- Estou ciente dos riscos e benefícios
- Autorizo a coleta e processamento de meus dados
- Consinto com o atendimento de telemedicina

Assinado digitalmente em ${new Date().toLocaleString('pt-BR')}

---
ASSINATURA DIGITAL DO PACIENTE (ICP-Brasil)
---
`;

    return tcle;
  }

  /**
   * Valida prescrição conforme regulamentações brasileiras
   * Etapa 3: Validação de prescrição
   */
  async validatePrescription(prescriptionData: {
    professionalId: string;
    patientId: string;
    strainName: string;
    dosageMgDay: number;
    duration: number;
    medicalIndication: string;
    viaAdministration: 'inalação' | 'ingestão' | 'tópica' | 'sublingual';
  }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validação 1: Profissional deve estar ativo
    // TODO: Integrar com banco de dados para validar CRM
    if (!prescriptionData.professionalId) {
      errors.push('Profissional não especificado');
    }

    // Validação 2: Dosagem deve estar dentro dos limites (RDC ANVISA 660/2022)
    if (prescriptionData.dosageMgDay < 5 || prescriptionData.dosageMgDay > 1000) {
      errors.push('Dosagem fora dos limites permitidos (5-1000 mg/dia)');
    }

    // Validação 3: Duração máxima 90 dias
    if (prescriptionData.duration > 90) {
      warnings.push('Duração máxima recomendada: 90 dias');
    }

    // Validação 4: Indicação médica deve ser válida (CID-10)
    const validIndications = [
      'G40', // Epilepsia
      'F41', // Transtornos de ansiedade
      'F32', // Episódio depressivo
      'M79.7', // Fibromialgia
      'G89', // Dor
    ];

    if (!validIndications.some(ind => prescriptionData.medicalIndication.startsWith(ind))) {
      warnings.push('Indicação médica não está na lista de CIDs recomendados');
    }

    // Validação 5: Via de administração deve ser apropriada
    const validVias = ['inalação', 'ingestão', 'tópica', 'sublingual'];
    if (!validVias.includes(prescriptionData.viaAdministration)) {
      errors.push('Via de administração inválida');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Monitora resposta ao tratamento
   * Etapa 5: Pós-venda e acompanhamento
   */
  async monitorTreatmentResponse(
    patientId: string,
    prescriptionId: string,
    responseData: {
      efficacyScore: number; // 1-10
      sideEffects: string[];
      adherencePercentage: number; // 0-100
      notes: string;
    }
  ): Promise<{
    status: 'respondendo' | 'parcialmente-respondendo' | 'nao-respondendo';
    recommendation: string;
  }> {
    const { efficacyScore, adherencePercentage, sideEffects } = responseData;

    let status: 'respondendo' | 'parcialmente-respondendo' | 'nao-respondendo';
    let recommendation: string;

    if (efficacyScore >= 7 && adherencePercentage >= 80) {
      status = 'respondendo';
      recommendation = 'Continuar tratamento conforme prescrito. Agendar retorno em 30 dias.';
    } else if (efficacyScore >= 5 && adherencePercentage >= 60) {
      status = 'parcialmente-respondendo';
      recommendation =
        'Considerar ajuste de dosagem. Profissional pode aumentar dose em até 20%. Retorno em 15 dias.';
    } else {
      status = 'nao-respondendo';
      recommendation =
        'Avaliar mudança de variedade ou via de administração. Agendar consulta urgente com profissional.';
    }

    // Alertar se houver efeitos colaterais graves
    const severeEffects = ['alucinações', 'palpitações', 'convulsões'];
    if (sideEffects.some(effect => severeEffects.some(se => effect.includes(se)))) {
      recommendation = 'URGENTE: Efeito colateral grave detectado. Procurar emergência.';
    }

    return {
      status,
      recommendation,
    };
  }
}

export const aiDiagnosisService = new AIDiagnosisService();
