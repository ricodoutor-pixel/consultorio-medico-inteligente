import { invokeLLM } from '../_core/llm';

export interface ConsultationSession {
  sessionId: string;
  patientId: string;
  specialistId: string;
  startTime: Date;
  endTime?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  consultationType: 'initial' | 'follow_up' | 'emergency';
  notes: string;
  prescription?: string;
  aiAssistanceUsed: boolean;
  recordingUrl?: string;
  transcript?: string;
}

export interface ConsultationAnalysis {
  sessionId: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  followUpRequired: boolean;
  followUpDays: number;
  riskFlags: string[];
  qualityScore: number;
}

export interface SmartScheduling {
  availableSlots: Array<{
    date: Date;
    time: string;
    specialistId: string;
    specialistName: string;
    availabilityScore: number;
  }>;
  recommendedSlot: {
    date: Date;
    time: string;
    specialistId: string;
    reason: string;
  };
}

export class AdvancedTeleconsultationService {
  private static sessions: Map<string, ConsultationSession> = new Map();
  private static analyses: Map<string, ConsultationAnalysis> = new Map();

  /**
   * Criar sessão de teleconsultoria
   */
  static createConsultationSession(
    patientId: string,
    specialistId: string,
    consultationType: 'initial' | 'follow_up' | 'emergency'
  ): string {
    try {
      const sessionId = 'cons_' + Date.now();
      const session: ConsultationSession = {
        sessionId,
        patientId,
        specialistId,
        startTime: new Date(),
        status: 'scheduled',
        consultationType,
        notes: '',
        aiAssistanceUsed: false
      };

      this.sessions.set(sessionId, session);
      return sessionId;
    } catch (error) {
      console.error('Error creating consultation session:', error);
      throw error;
    }
  }

  /**
   * Iniciar sessão de teleconsultoria
   */
  static startConsultation(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'in_progress';
      session.startTime = new Date();
    }
  }

  /**
   * Finalizar sessão de teleconsultoria
   */
  static async endConsultation(
    sessionId: string,
    notes: string,
    prescription: string
  ): Promise<ConsultationAnalysis> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      session.status = 'completed';
      session.endTime = new Date();
      session.notes = notes;
      session.prescription = prescription;

      // Analisar sessão com IA
      const analysis = await this.analyzeConsultation(sessionId, notes, prescription);
      this.analyses.set(sessionId, analysis);

      return analysis;
    } catch (error) {
      console.error('Error ending consultation:', error);
      throw error;
    }
  }

  /**
   * Analisar sessão de teleconsultoria com IA
   */
  private static async analyzeConsultation(
    sessionId: string,
    notes: string,
    prescription: string
  ): Promise<ConsultationAnalysis> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de teleconsultas médicas. Forneça análises detalhadas e clinicamente relevantes.'
          },
          {
            role: 'user',
            content: `Analise esta teleconsulta e forneça um resumo estruturado:

Notas da Consulta:
${notes}

Prescrição:
${prescription}

Forneça em JSON:
- summary (resumo da consulta)
- keyFindings (array de achados principais)
- recommendations (array de recomendações)
- followUpRequired (boolean)
- followUpDays (número de dias para acompanhamento)
- riskFlags (array de alertas de risco)
- qualityScore (0-100)`
          }
        ]
      });

      const content = response.choices[0].message.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;

      return {
        sessionId,
        summary: parsed.summary || '',
        keyFindings: parsed.keyFindings || [],
        recommendations: parsed.recommendations || [],
        followUpRequired: parsed.followUpRequired || false,
        followUpDays: parsed.followUpDays || 30,
        riskFlags: parsed.riskFlags || [],
        qualityScore: parsed.qualityScore || 75
      };
    } catch (error) {
      console.error('Error analyzing consultation:', error);
      return {
        sessionId,
        summary: 'Análise indisponível',
        keyFindings: [],
        recommendations: [],
        followUpRequired: false,
        followUpDays: 30,
        riskFlags: [],
        qualityScore: 0
      };
    }
  }

  /**
   * Obter agendamento inteligente
   */
  static async getSmartScheduling(
    patientId: string,
    symptoms: string[],
    urgency: 'routine' | 'urgent' | 'emergency'
  ): Promise<SmartScheduling> {
    try {
      // Mock specialists availability
      const specialists = [
        {
          id: 'spec_001',
          name: 'Dr. Silva',
          specialty: 'Cannabis Medicinal',
          rating: 4.8,
          availableSlots: ['09:00', '14:00', '16:00']
        },
        {
          id: 'spec_002',
          name: 'Dra. Santos',
          specialty: 'Neurologia',
          rating: 4.9,
          availableSlots: ['10:00', '15:00']
        },
        {
          id: 'spec_003',
          name: 'Dr. Oliveira',
          specialty: 'Farmacologia',
          rating: 4.7,
          availableSlots: ['11:00', '13:00', '17:00']
        }
      ];

      // Use AI to recommend best specialist and time
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de agendamento médico inteligente. Recomende o melhor especialista e horário baseado no perfil do paciente.'
          },
          {
            role: 'user',
            content: `Recomende o melhor agendamento para:
Sintomas: ${symptoms.join(', ')}
Urgência: ${urgency}
Especialistas disponíveis: ${specialists.map(s => `${s.name} (${s.specialty}, ${s.rating}★)`).join('; ')}

Responda em JSON: specialistId, recommendedTime, reason`
          }
        ]
      });

      const content = response.choices[0].message.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;

      const recommendedSpecialist = specialists.find(s => s.id === parsed.specialistId) || specialists[0];
      const today = new Date();
      const appointmentDate = new Date(today.getTime() + (urgency === 'emergency' ? 0 : 24 * 60 * 60 * 1000));

      return {
        availableSlots: specialists.flatMap(spec =>
          spec.availableSlots.map(time => ({
            date: appointmentDate,
            time,
            specialistId: spec.id,
            specialistName: spec.name,
            availabilityScore: spec.rating * 20
          }))
        ),
        recommendedSlot: {
          date: appointmentDate,
          time: parsed.recommendedTime || '10:00',
          specialistId: recommendedSpecialist.id,
          reason: parsed.reason || 'Melhor compatibilidade com sua condição'
        }
      };
    } catch (error) {
      console.error('Error getting smart scheduling:', error);
      throw error;
    }
  }

  /**
   * Gerar resumo para o paciente
   */
  static generatePatientSummary(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    const analysis = this.analyses.get(sessionId);

    if (!session || !analysis) return '';

    return `
RESUMO DA TELECONSULTA
=======================

Data: ${session.startTime.toLocaleDateString('pt-BR')} às ${session.startTime.toLocaleTimeString('pt-BR')}
Especialista: ${session.specialistId}
Tipo: ${session.consultationType === 'initial' ? 'Consulta Inicial' : 'Acompanhamento'}

RESUMO:
${analysis.summary}

ACHADOS PRINCIPAIS:
${analysis.keyFindings.map(f => `- ${f}`).join('\n')}

RECOMENDAÇÕES:
${analysis.recommendations.map(r => `- ${r}`).join('\n')}

${analysis.riskFlags.length > 0 ? `ALERTAS IMPORTANTES:\n${analysis.riskFlags.map(f => `⚠️ ${f}`).join('\n')}` : ''}

PRÓXIMA CONSULTA:
${analysis.followUpRequired ? `Recomendada em ${analysis.followUpDays} dias` : 'Não necessária no momento'}

PRESCRIÇÃO:
${session.prescription || 'Nenhuma prescrição gerada'}
    `;
  }

  /**
   * Gerar relatório para o especialista
   */
  static generateSpecialistReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    const analysis = this.analyses.get(sessionId);

    if (!session || !analysis) return '';

    return `
RELATÓRIO DE TELECONSULTA - ESPECIALISTA
=========================================

ID da Sessão: ${sessionId}
Paciente: ${session.patientId}
Data: ${session.startTime.toLocaleDateString('pt-BR')} às ${session.startTime.toLocaleTimeString('pt-BR')}
Duração: ${session.endTime ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000) : 0} minutos

NOTAS CLÍNICAS:
${session.notes}

ANÁLISE IA:
Qualidade: ${analysis.qualityScore}/100
Resumo: ${analysis.summary}

ACHADOS:
${analysis.keyFindings.map(f => `- ${f}`).join('\n')}

RECOMENDAÇÕES:
${analysis.recommendations.map(r => `- ${r}`).join('\n')}

ALERTAS:
${analysis.riskFlags.length > 0 ? analysis.riskFlags.map(f => `⚠️ ${f}`).join('\n') : 'Nenhum alerta'}

ACOMPANHAMENTO:
${analysis.followUpRequired ? `Necessário em ${analysis.followUpDays} dias` : 'Não necessário'}

PRESCRIÇÃO:
${session.prescription}
    `;
  }

  /**
   * Obter análise da sessão
   */
  static getAnalysis(sessionId: string): ConsultationAnalysis | undefined {
    return this.analyses.get(sessionId);
  }

  /**
   * Obter sessão
   */
  static getSession(sessionId: string): ConsultationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Listar sessões do paciente
   */
  static getPatientSessions(patientId: string): ConsultationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.patientId === patientId);
  }

  /**
   * Listar sessões do especialista
   */
  static getSpecialistSessions(specialistId: string): ConsultationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.specialistId === specialistId);
  }

  /**
   * Cancelar sessão
   */
  static cancelConsultation(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'cancelled';
    }
  }

  /**
   * Obter estatísticas de qualidade
   */
  static getQualityStats(specialistId: string): {
    averageQualityScore: number;
    totalConsultations: number;
    patientSatisfaction: number;
    averageFollowUpRate: number;
  } {
    const sessions = this.getSpecialistSessions(specialistId);
    const analyses = sessions
      .map(s => this.analyses.get(s.sessionId))
      .filter((a): a is ConsultationAnalysis => a !== undefined);

    const avgQuality = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.qualityScore, 0) / analyses.length
      : 0;

    const followUpRate = analyses.length > 0
      ? (analyses.filter(a => a.followUpRequired).length / analyses.length) * 100
      : 0;

    return {
      averageQualityScore: Math.round(avgQuality),
      totalConsultations: sessions.length,
      patientSatisfaction: 85, // Mock value
      averageFollowUpRate: Math.round(followUpRate)
    };
  }
}
