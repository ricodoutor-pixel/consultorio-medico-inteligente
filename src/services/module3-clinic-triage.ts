// @ts-nocheck
/**
 * ═══════════════════════════════════════════════════════════════
 * MÓDULO 3: CLÍNICA & TRANSBORDO — INTELIGÊNCIA BRISA
 * Triagem OMEGA 10 pontos, Transbordo automático, Assinatura Digital
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '@/lib/supabase';
import { invokeLLM } from '@/lib/llm';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { generatePDFWithSignature } from '@/services/pdf-generator';

// 🟡 INTERFACE: Resposta da Triagem
interface TriageResponse {
  question: number;
  answer: string;
  timestamp: Date;
}

// 🟡 INTERFACE: Resultado da Triagem
interface TriageResult {
  patientId: string;
  triageId: string;
  responses: TriageResponse[];
  aiAnalysis: string;
  recommendedSpecialty: string;
  urgencyLevel: 'baixa' | 'média' | 'alta' | 'urgente';
  pdfUrl: string;
  createdAt: Date;
}

// 🟡 INTERFACE: Médico em Plantão
interface DoctorOnDuty {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  isOnline: boolean;
  currentPatientCount: number;
  maxCapacity: number;
  lastActivityAt: Date;
}

/**
 * 🟡 TRIAGEM OMEGA: 10 Perguntas Consolidadas
 */
const TRIAGE_QUESTIONS = [
  {
    id: 1,
    question: 'Qual é o seu principal sintoma ou motivo da consulta?',
    type: 'text',
  },
  {
    id: 2,
    question: 'Há quanto tempo você apresenta este sintoma?',
    type: 'select',
    options: ['Menos de 24h', '1-7 dias', '1-4 semanas', 'Mais de 1 mês'],
  },
  {
    id: 3,
    question: 'Qual é a intensidade da dor/desconforto? (1-10)',
    type: 'number',
    min: 1,
    max: 10,
  },
  {
    id: 4,
    question: 'Você já foi diagnosticado com alguma condição crônica?',
    type: 'text',
  },
  {
    id: 5,
    question: 'Está tomando algum medicamento atualmente?',
    type: 'text',
  },
  {
    id: 6,
    question: 'Tem alergia a algum medicamento?',
    type: 'text',
  },
  {
    id: 7,
    question: 'Já usou cannabis medicinal antes?',
    type: 'select',
    options: ['Sim, regularmente', 'Sim, ocasionalmente', 'Não, primeira vez'],
  },
  {
    id: 8,
    question: 'Qual é seu objetivo com o tratamento?',
    type: 'text',
  },
  {
    id: 9,
    question: 'Tem alguma contraindicação conhecida?',
    type: 'text',
  },
  {
    id: 10,
    question: 'Autoriza compartilhamento de dados com farmácias?',
    type: 'select',
    options: ['Sim', 'Não'],
  },
];

/**
 * 🟡 FUNÇÃO: Processar Triagem OMEGA
 */
export async function processTriageOmega(
  patientId: string,
  responses: TriageResponse[]
): Promise<TriageResult> {
  try {
    // 1. Consolidar respostas
    const consolidatedData = TRIAGE_QUESTIONS.map((q) => {
      const response = responses.find((r) => r.question === q.id);
      return {
        question: q.question,
        answer: response?.answer || 'Não respondido',
      };
    });

    // 2. Invocar IA Brisa para análise
    const aiAnalysis = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Você é Dr. Brisa, especialista em triagem de cannabis medicinal. 
          Analise as respostas do paciente e forneça:
          1. Análise clínica concisa
          2. Especialidade recomendada (Clínica Geral, Neurologia, Reumatologia, etc)
          3. Nível de urgência (baixa, média, alta, urgente)
          4. Recomendações iniciais`,
        },
        {
          role: 'user',
          content: `Respostas da triagem:\n${consolidatedData
            .map((d) => `Q: ${d.question}\nA: ${d.answer}`)
            .join('\n\n')}`,
        },
      ],
    });

    const analysisText =
      typeof aiAnalysis.choices[0].message.content === 'string'
        ? aiAnalysis.choices[0].message.content
        : '';

    // 3. Extrair especialidade e urgência
    const specialty = extractSpecialty(analysisText);
    const urgency = extractUrgency(analysisText);

    // 4. Gerar PDF com metadados ANVISA
    const pdfUrl = await generateTriagePDF(
      patientId,
      consolidatedData,
      analysisText,
      specialty,
      urgency
    );

    // 5. Salvar resultado no Supabase
    const { data, error } = await supabase
      .from('triage_results')
      .insert({
        patient_id: patientId,
        responses: consolidatedData,
        ai_analysis: analysisText,
        recommended_specialty: specialty,
        urgency_level: urgency,
        pdf_url: pdfUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // 6. Disparar web-trigger para médico escalado
    await triggerDoctorNotification(patientId, specialty, urgency);

    return {
      patientId,
      triageId: data.id,
      responses,
      aiAnalysis: analysisText,
      recommendedSpecialty: specialty,
      urgencyLevel: urgency,
      pdfUrl,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('Erro ao processar triagem OMEGA:', error);
    throw error;
  }
}

/**
 * 🟡 FUNÇÃO: Transbordo Automático (5 minutos inatividade)
 */
export async function handleAutomaticTransfer(
  consultationId: string,
  patientId: string,
  currentDoctorId: string,
  specialty: string,
  urgency: string
): Promise<void> {
  try {
    // 1. Verificar inatividade (5 minutos)
    const { data: consultation } = await supabase
      .from('consultations')
      .select('last_activity_at')
      .eq('id', consultationId)
      .single();

    const lastActivity = new Date(consultation.last_activity_at);
    const inactivityMinutes =
      (Date.now() - lastActivity.getTime()) / (1000 * 60);

    if (inactivityMinutes < 5) {
      return; // Ainda há atividade recente
    }

    // 2. Buscar próximo médico na fila
    const nextDoctor = await findNextDoctorInQueue(specialty, urgency);

    if (!nextDoctor) {
      // Sem médicos disponíveis - notificar paciente
      await sendWhatsAppMessage({
        to: patientId,
        message:
          '⏳ Nenhum médico disponível no momento. Você será atendido em breve.',
      });
      return;
    }

    // 3. Transferir sala Jitsi
    const jitsiRoomId = `consultation-${consultationId}`;
    await transferJitsiRoom(jitsiRoomId, currentDoctorId, nextDoctor.id);

    // 4. Atualizar banco de dados
    await supabase
      .from('consultations')
      .update({
        doctor_id: nextDoctor.id,
        transferred_at: new Date().toISOString(),
        transfer_count: consultation.transfer_count + 1,
      })
      .eq('id', consultationId);

    // 5. Notificar paciente via WhatsApp
    await sendWhatsAppMessage({
      to: patientId,
      message: `👨‍⚕️ Você foi transferido para o Dr. ${nextDoctor.name}. Continuaremos em breve!`,
    });

    // 6. Notificar novo médico
    await sendWhatsAppMessage({
      to: nextDoctor.id,
      message: `📞 Novo paciente transferido: ${patientId} (Urgência: ${urgency})`,
    });
  } catch (error) {
    console.error('Erro ao fazer transbordo automático:', error);
    throw error;
  }
}

/**
 * 🟡 FUNÇÃO: Gerar PDF com Metadados ANVISA
 */
async function generateTriagePDF(
  patientId: string,
  consolidatedData: Array<{ question: string; answer: string }>,
  aiAnalysis: string,
  specialty: string,
  urgency: string
): Promise<string> {
  try {
    const pdfContent = {
      title: 'RELATÓRIO DE TRIAGEM - PLANTA Y RAIZ',
      subtitle: 'Análise Preliminar de Cannabis Medicinal',
      metadata: {
        patientId,
        timestamp: new Date().toISOString(),
        doctorName: 'Dr. Brisa (IA)',
        doctorCRM: 'ANVISA-IA-001',
        conformity: 'RDC 660/2023 - ANVISA',
        lgpd: 'Conforme Lei 13.709/2018',
      },
      sections: [
        {
          title: 'Respostas da Triagem',
          content: consolidatedData
            .map((d) => `${d.question}\n${d.answer}`)
            .join('\n\n'),
        },
        {
          title: 'Análise Clínica',
          content: aiAnalysis,
        },
        {
          title: 'Recomendações',
          content: `Especialidade: ${specialty}\nUrgência: ${urgency}`,
        },
        {
          title: 'Assinatura Digital',
          content: `Assinado digitalmente em ${new Date().toLocaleString('pt-BR')}`,
        },
      ],
    };

    // Gerar PDF com biblioteca
    const pdf = await generatePDFWithSignature(pdfContent);

    // Fazer upload para Supabase Storage
    const fileName = `triage-${patientId}-${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from('triages')
      .upload(fileName, pdf, {
        contentType: 'application/pdf',
      });

    if (error) throw error;

    // Retornar URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('triages').getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}

/**
 * 🟡 FUNÇÃO: Encontrar Próximo Médico na Fila
 */
async function findNextDoctorInQueue(
  specialty: string,
  urgency: string
): Promise<DoctorOnDuty | null> {
  try {
    const { data: doctors, error } = await supabase
      .from('doctors_public' as any)
      .select('*')
      .eq('specialty', specialty)
      .eq('is_online', true)
      .lt('current_patient_count', 'max_capacity')
      .order('current_patient_count', { ascending: true })
      .limit(1)
      .single();

    if (error) return null;

    return doctors as DoctorOnDuty;
  } catch (error) {
    console.error('Erro ao encontrar médico:', error);
    return null;
  }
}

/**
 * 🟡 FUNÇÃO: Transferir Sala Jitsi
 */
async function transferJitsiRoom(
  roomId: string,
  fromDoctorId: string,
  toDoctorId: string
): Promise<void> {
  try {
    // Chamar API do Jitsi para transferir moderação
    const response = await fetch('https://meet.jitsi.si/api/v1/room-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.JITSI_API_KEY}`,
      },
      body: JSON.stringify({
        roomId,
        fromUserId: fromDoctorId,
        toUserId: toDoctorId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao transferir sala: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erro ao transferir sala Jitsi:', error);
    throw error;
  }
}

/**
 * 🟡 FUNÇÃO: Disparar Notificação para Médico
 */
async function triggerDoctorNotification(
  patientId: string,
  specialty: string,
  urgency: string
): Promise<void> {
  try {
    // Buscar médico escalado
    const { data: doctor } = await supabase
      .from('doctors_public' as any)
      .select('*')
      .eq('specialty', specialty)
      .eq('is_online', true)
      .order('current_patient_count', { ascending: true })
      .limit(1)
      .single();

    if (!doctor) return;

    // Disparar web-trigger (webhook)
    await fetch('/api/webhooks/doctor-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: doctor.id,
        patientId,
        specialty,
        urgency,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Erro ao disparar notificação:', error);
  }
}

/**
 * 🟡 FUNÇÕES AUXILIARES
 */
function extractSpecialty(text: string): string {
  const specialties = [
    'Clínica Geral',
    'Neurologia',
    'Reumatologia',
    'Oncologia',
    'Psiquiatria',
  ];
  for (const specialty of specialties) {
    if (text.toLowerCase().includes(specialty.toLowerCase())) {
      return specialty;
    }
  }
  return 'Clínica Geral';
}

function extractUrgency(
  text: string
): 'baixa' | 'média' | 'alta' | 'urgente' {
  if (text.toLowerCase().includes('urgente')) return 'urgente';
  if (text.toLowerCase().includes('alta')) return 'alta';
  if (text.toLowerCase().includes('média')) return 'média';
  return 'baixa';
}

export const TRIAGE_QUESTIONS_EXPORT = TRIAGE_QUESTIONS;
export default {
  processTriageOmega,
  handleAutomaticTransfer,
  TRIAGE_QUESTIONS,
};
