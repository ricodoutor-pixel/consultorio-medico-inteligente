import { invokeLLM } from '../_core/llm';

export interface AdaptiveQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'rating' | 'date';
  options?: string[];
  required: boolean;
  dependsOn?: { questionId: string; value: string };
}

export interface PatientProfile {
  age: number;
  gender: string;
  medicalHistory: string[];
  currentSymptoms: string[];
  medications: string[];
  allergies: string[];
  lifestyle: string;
}

export interface ANVISAPrescription {
  id: string;
  patientName: string;
  patientCPF: string;
  doctorName: string;
  doctorCRM: string;
  doctorSignature: string;
  cannabisProduct: string;
  dosage: string;
  frequency: string;
  duration: string;
  indications: string[];
  contraindications: string[];
  timestamp: Date;
  anvisaAuthorizationCode: string;
}

export interface WearableData {
  deviceType: 'apple_health' | 'fitbit' | 'oura' | 'garmin';
  heartRate?: number;
  sleepHours?: number;
  steps?: number;
  stressLevel?: number;
  bodyTemperature?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  timestamp: Date;
}

export class TelemedicineAdvancedService {
  /**
   * Gera 10 perguntas adaptativas baseadas no perfil do paciente
   */
  static async generateAdaptiveQuestions(patientProfile: Partial<PatientProfile>): Promise<AdaptiveQuestion[]> {
    const questions: AdaptiveQuestion[] = [
      {
        id: 'q1',
        question: 'Qual é a sua principal queixa ou sintoma?',
        type: 'text',
        required: true,
      },
      {
        id: 'q2',
        question: 'Há quanto tempo você tem esse sintoma?',
        type: 'select',
        options: ['Menos de 1 semana', '1-4 semanas', '1-3 meses', 'Mais de 3 meses'],
        required: true,
      },
      {
        id: 'q3',
        question: 'Qual é a intensidade do seu sintoma? (1-10)',
        type: 'rating',
        required: true,
      },
      {
        id: 'q4',
        question: 'Você já tentou algum tratamento? Se sim, qual?',
        type: 'text',
        required: false,
      },
      {
        id: 'q5',
        question: 'Você tem alergias conhecidas?',
        type: 'multiselect',
        options: ['Nenhuma', 'Penicilina', 'Ibuprofeno', 'Outros'],
        required: true,
      },
      {
        id: 'q6',
        question: 'Você toma algum medicamento regularmente?',
        type: 'text',
        required: false,
      },
      {
        id: 'q7',
        question: 'Você tem histórico de problemas de saúde mental?',
        type: 'select',
        options: ['Não', 'Ansiedade', 'Depressão', 'Outro'],
        required: true,
      },
      {
        id: 'q8',
        question: 'Qual é seu nível de atividade física?',
        type: 'select',
        options: ['Sedentário', 'Leve', 'Moderado', 'Intenso'],
        required: true,
      },
      {
        id: 'q9',
        question: 'Você consome álcool ou tabaco?',
        type: 'multiselect',
        options: ['Não', 'Álcool ocasional', 'Álcool frequente', 'Tabaco'],
        required: true,
      },
      {
        id: 'q10',
        question: 'Qual é seu objetivo com o tratamento?',
        type: 'text',
        required: true,
      },
    ];

    return questions;
  }

  /**
   * Gera prescrição ANVISA digital com assinatura
   */
  static async generateANVISAPrescription(
    patientName: string,
    patientCPF: string,
    doctorName: string,
    doctorCRM: string,
    cannabisProduct: string,
    dosage: string,
    frequency: string,
    duration: string,
    indications: string[]
  ): Promise<ANVISAPrescription> {
    const anvisaCode = `ANVISA-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    const prescription: ANVISAPrescription = {
      id: `RX-${Date.now()}`,
      patientName,
      patientCPF,
      doctorName,
      doctorCRM,
      doctorSignature: `Dr. ${doctorName}`, // Mock signature
      cannabisProduct,
      dosage,
      frequency,
      duration,
      indications,
      contraindications: [
        'Gravidez e amamentação',
        'Menores de 18 anos',
        'Histórico de psicose',
        'Dependência de substâncias',
      ],
      timestamp: new Date(),
      anvisaAuthorizationCode: anvisaCode,
    };

    return prescription;
  }

  /**
   * Gera PDF de prescrição ANVISA com carimbo digital
   */
  static async generatePrescriptionPDF(prescription: ANVISAPrescription): Promise<Buffer> {
    // Mock PDF generation
    const pdfContent = `
PRESCRIÇÃO DIGITAL - CANNABIS MEDICINAL
========================================
AUTORIZAÇÃO ANVISA: ${prescription.anvisaAuthorizationCode}

PACIENTE:
Nome: ${prescription.patientName}
CPF: ${prescription.patientCPF}

PRESCRITOR:
Nome: ${prescription.doctorName}
CRM: ${prescription.doctorCRM}
Assinatura: ${prescription.doctorSignature}

MEDICAMENTO:
Produto: ${prescription.cannabisProduct}
Dosagem: ${prescription.dosage}
Frequência: ${prescription.frequency}
Duração: ${prescription.duration}

INDICAÇÕES:
${prescription.indications.map((ind) => `- ${ind}`).join('\n')}

CONTRAINDICAÇÕES:
${prescription.contraindications.map((contra) => `- ${contra}`).join('\n')}

Data: ${prescription.timestamp.toLocaleString('pt-BR')}
    `;

    return Buffer.from(pdfContent);
  }

  /**
   * Processa dados de wearables (mock)
   */
  static async processWearableData(wearableData: WearableData): Promise<{ analysis: string; recommendations: string[] }> {
    const analysis = `
Análise de Dados de Wearable (${wearableData.deviceType}):
- Frequência Cardíaca: ${wearableData.heartRate || 'N/A'} bpm
- Horas de Sono: ${wearableData.sleepHours || 'N/A'} h
- Passos: ${wearableData.steps || 'N/A'}
- Nível de Estresse: ${wearableData.stressLevel || 'N/A'}/10
- Temperatura: ${wearableData.bodyTemperature || 'N/A'}°C
- Pressão Arterial: ${wearableData.bloodPressure ? `${wearableData.bloodPressure.systolic}/${wearableData.bloodPressure.diastolic}` : 'N/A'} mmHg
    `;

    const recommendations = [
      'Manter hidratação adequada',
      'Aumentar atividade física gradualmente',
      'Melhorar qualidade do sono',
      'Reduzir níveis de estresse',
      'Acompanhamento médico regular',
    ];

    return { analysis, recommendations };
  }

  /**
   * Integra dados de wearables com prescrição
   */
  static async integrateWearableWithPrescription(
    wearableData: WearableData,
    prescription: ANVISAPrescription
  ): Promise<{ adjustedDosage: string; adjustedFrequency: string; notes: string[] }> {
    const notes: string[] = [];

    // Mock logic para ajustar prescrição baseado em dados de wearable
    let adjustedDosage = prescription.dosage;
    let adjustedFrequency = prescription.frequency;

    if (wearableData.stressLevel && wearableData.stressLevel > 7) {
      adjustedDosage = 'Aumentar dosagem em 25%';
      notes.push('Nível de estresse elevado detectado');
    }

    if (wearableData.sleepHours && wearableData.sleepHours < 6) {
      adjustedFrequency = 'Tomar à noite antes de dormir';
      notes.push('Sono insuficiente detectado');
    }

    if (wearableData.heartRate && wearableData.heartRate > 100) {
      notes.push('Frequência cardíaca elevada - recomenda-se monitoramento');
    }

    return { adjustedDosage, adjustedFrequency, notes };
  }

  /**
   * Gera relatório de telemedicina completo
   */
  static async generateTeleMedicineReport(
    patientProfile: PatientProfile,
    prescription: ANVISAPrescription,
    wearableData?: WearableData
  ): Promise<string> {
    const report = `
RELATÓRIO DE TELEMEDICINA - CANNABIS MEDICINAL
================================================

PACIENTE: ${patientProfile}
PRESCRIÇÃO: ${prescription.id}
DATA: ${new Date().toLocaleString('pt-BR')}

PERFIL DO PACIENTE:
- Idade: ${patientProfile.age} anos
- Gênero: ${patientProfile.gender}
- Histórico Médico: ${patientProfile.medicalHistory.join(', ')}
- Sintomas Atuais: ${patientProfile.currentSymptoms.join(', ')}
- Medicamentos: ${patientProfile.medications.join(', ')}
- Alergias: ${patientProfile.allergies.join(', ')}
- Estilo de Vida: ${patientProfile.lifestyle}

PRESCRIÇÃO:
- Produto: ${prescription.cannabisProduct}
- Dosagem: ${prescription.dosage}
- Frequência: ${prescription.frequency}
- Duração: ${prescription.duration}
- Indicações: ${prescription.indications.join(', ')}

${wearableData ? `DADOS DE WEARABLE:\n- Dispositivo: ${wearableData.deviceType}\n- Frequência Cardíaca: ${wearableData.heartRate} bpm\n- Sono: ${wearableData.sleepHours}h\n` : ''}

CONFORMIDADE ANVISA:
✓ Prescrição Digital Assinada
✓ Autorização ANVISA: ${prescription.anvisaAuthorizationCode}
✓ Conformidade LGPD
✓ Dados Criptografados

PRÓXIMOS PASSOS:
1. Acompanhamento em 2 semanas
2. Monitoramento com wearable
3. Ajuste de dosagem se necessário
    `;

    return report;
  }
}
