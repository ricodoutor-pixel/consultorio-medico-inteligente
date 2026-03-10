// Mock database for demonstration
const mockDb: Record<string, any[]> = {
  healthRecords: [],
  medications: [],
  recordSharing: [],
  auditLogs: []
};

export interface HealthRecord {
  patientId: string;
  recordType: 'consultation' | 'prescription' | 'lab_result' | 'vital_signs' | 'medication' | 'allergy';
  title: string;
  description: string;
  date: Date;
  provider: string;
  attachments?: string[];
  tags: string[];
  isConfidential: boolean;
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
}

export interface MedicationHistory {
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  reason: string;
  sideEffects: string[];
  isActive: boolean;
}

export class DigitalHealthRecordService {
  /**
   * Criar novo registro de saúde
   */
  static async createHealthRecord(record: HealthRecord): Promise<string> {
    try {
      this.validateHealthRecord(record);
      const encryptedRecord = this.encryptSensitiveData(record);
      const id = 'rec_' + Date.now();
      (mockDb.healthRecords as any[]).push({ id, ...encryptedRecord });
      await this.auditLog('CREATE_HEALTH_RECORD', record.patientId, id);
      return id;
    } catch (error) {
      console.error('Error creating health record:', error);
      throw error;
    }
  }

  /**
   * Recuperar histórico completo do paciente
   */
  static async getPatientHistory(patientId: string, limit: number = 100): Promise<HealthRecord[]> {
    try {
      const records = (mockDb.healthRecords as any[])
        .filter((r: any) => r.patientId === patientId)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
      return records.map((r: any) => this.decryptSensitiveData(r));
    } catch (error) {
      console.error('Error retrieving patient history:', error);
      throw error;
    }
  }

  /**
   * Registrar sinais vitais
   */
  static async recordVitalSigns(patientId: string, vitals: VitalSigns): Promise<string> {
    try {
      const record: HealthRecord = {
        patientId,
        recordType: 'vital_signs',
        title: `Sinais Vitais - ${new Date().toLocaleDateString('pt-BR')}`,
        description: JSON.stringify(vitals),
        date: new Date(),
        provider: 'Patient Self-Monitoring',
        tags: ['vitals', 'monitoring'],
        isConfidential: false
      };
      return await this.createHealthRecord(record);
    } catch (error) {
      console.error('Error recording vital signs:', error);
      throw error;
    }
  }

  /**
   * Adicionar medicação ao histórico
   */
  static async addMedication(medication: MedicationHistory): Promise<string> {
    try {
      const interactions = await this.checkMedicationInteractions(
        medication.patientId,
        medication.medicationName
      );
      if (interactions.length > 0) {
        console.warn(`Possíveis interações detectadas: ${interactions.join(', ')}`);
      }
      const id = 'med_' + Date.now();
      (mockDb.medications as any[]).push({ id, ...medication });
      await this.createHealthRecord({
        patientId: medication.patientId,
        recordType: 'medication',
        title: `Medicação: ${medication.medicationName}`,
        description: `Dosagem: ${medication.dosage}, Frequência: ${medication.frequency}`,
        date: new Date(),
        provider: 'System',
        tags: ['medication', medication.medicationName.toLowerCase()],
        isConfidential: false
      });
      return id;
    } catch (error) {
      console.error('Error adding medication:', error);
      throw error;
    }
  }

  /**
   * Gerar relatório de saúde completo
   */
  static async generateHealthReport(patientId: string): Promise<{
    summary: string;
    activeConditions: string[];
    currentMedications: MedicationHistory[];
    recentVitals: VitalSigns;
    allergies: string[];
    recommendations: string[];
  }> {
    try {
      const history = await this.getPatientHistory(patientId, 50);
      const medications = (mockDb.medications as any[])
        .filter((m: any) => m.patientId === patientId && m.isActive);
      const vitals = history
        .filter(r => r.recordType === 'vital_signs')
        .map(r => JSON.parse(r.description))[0];
      const allergies = history
        .filter(r => r.recordType === 'allergy')
        .map(r => r.title);
      const summary = await this.generateAISummary(history, medications);
      return {
        summary,
        activeConditions: this.extractConditions(history),
        currentMedications: medications,
        recentVitals: vitals || {},
        allergies,
        recommendations: this.generateRecommendations(history, medications)
      };
    } catch (error) {
      console.error('Error generating health report:', error);
      throw error;
    }
  }

  /**
   * Exportar prontuário em PDF
   */
  static async exportHealthRecordPDF(patientId: string): Promise<Buffer> {
    try {
      const report = await this.generateHealthReport(patientId);
      const pdfContent = `
        PRONTUÁRIO ELETRÔNICO DO PACIENTE
        Data: ${new Date().toLocaleDateString('pt-BR')}
        Resumo: ${report.summary}
        Condições: ${report.activeConditions.join(', ')}
        Alergias: ${report.allergies.join(', ')}
      `;
      return Buffer.from(pdfContent);
    } catch (error) {
      console.error('Error exporting health record:', error);
      throw error;
    }
  }

  /**
   * Compartilhar prontuário com especialista
   */
  static async shareWithSpecialist(
    patientId: string,
    specialistId: string,
    accessDuration: number
  ): Promise<string> {
    try {
      const accessToken = this.generateAccessToken(patientId, specialistId, accessDuration);
      (mockDb.recordSharing as any[]).push({
        patientId,
        specialistId,
        accessToken,
        expiresAt: new Date(Date.now() + accessDuration * 60 * 60 * 1000),
        createdAt: new Date()
      });
      await this.auditLog('SHARE_RECORD', patientId, specialistId);
      return accessToken;
    } catch (error) {
      console.error('Error sharing record:', error);
      throw error;
    }
  }

  /**
   * Validar registro de saúde
   */
  private static validateHealthRecord(record: HealthRecord): void {
    if (!record.patientId || !record.recordType || !record.title) {
      throw new Error('Campos obrigatórios: patientId, recordType, title');
    }
  }

  /**
   * Criptografar dados sensíveis
   */
  private static encryptSensitiveData(record: HealthRecord): HealthRecord {
    return {
      ...record,
      description: Buffer.from(record.description).toString('base64')
    };
  }

  /**
   * Descriptografar dados sensíveis
   */
  private static decryptSensitiveData(record: any): HealthRecord {
    return {
      ...record,
      description: Buffer.from(record.description, 'base64').toString('utf-8')
    };
  }

  /**
   * Verificar interações medicamentosas com IA
   */
  private static async checkMedicationInteractions(
    patientId: string,
    newMedication: string
  ): Promise<string[]> {
    try {
      const { invokeLLM } = await import('../_core/llm');
      const currentMeds = (mockDb.medications as any[])
        .filter((m: any) => m.patientId === patientId && m.isActive);
      
      if (currentMeds.length === 0) return [];
      
      const medList = currentMeds.map((m: any) => m.medicationName).join(', ');
      
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um farmacêutico especializado em interações medicamentosas. Identifique apenas interações clinicamente significantes.'
          },
          {
            role: 'user',
            content: `Verifique interações entre "${newMedication}" e estas medicações: ${medList}. Responda com uma lista JSON de interações encontradas (vazio se nenhuma).`
          }
        ]
      });
      
      const content = response.choices[0].message.content;
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return content.length > 0 ? [content] : [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error checking medication interactions:', error);
      // Fallback to basic interaction checking
      const currentMeds = (mockDb.medications as any[])
        .filter((m: any) => m.patientId === patientId && m.isActive);
      const interactions: string[] = [];
      for (const med of currentMeds) {
        if (this.hasKnownInteraction(med.medicationName, newMedication)) {
          interactions.push(`${med.medicationName} + ${newMedication}`);
        }
      }
      return interactions;
    }
  }

  /**
   * Verificar interações conhecidas
   */
  private static hasKnownInteraction(med1: string, med2: string): boolean {
    const knownInteractions: Record<string, string[]> = {
      'warfarin': ['aspirin', 'ibuprofen'],
      'metformin': ['alcohol', 'contrast dye'],
      'lisinopril': ['potassium', 'nsaids']
    };
    const med1Lower = med1.toLowerCase();
    return knownInteractions[med1Lower]?.some(m => m.includes(med2.toLowerCase())) || false;
  }

  /**
   * Gerar resumo com IA
   */
  private static async generateAISummary(history: HealthRecord[], medications: any[]): Promise<string> {
    try {
      const { invokeLLM } = await import('../_core/llm');
      const conditions = this.extractConditions(history);
      const recentRecords = history.slice(0, 10).map(r => `${r.recordType}: ${r.title}`).join('; ');
      
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente médico especializado em análise de prontuários. Forneça resumos concisos e clinicamente relevantes.'
          },
          {
            role: 'user',
            content: `Analise este prontuário e forneça um resumo clínico: Condições: ${conditions.join(', ')}. Medicações: ${medications.map((m: any) => m.medicationName).join(', ')}. Registros recentes: ${recentRecords}`
          }
        ]
      });
      
      const content = response.choices[0].message.content;
      return typeof content === 'string' ? content : 'Resumo indisponível';
    } catch (error) {
      console.error('Error generating AI summary:', error);
      const conditions = this.extractConditions(history);
      return `Paciente com ${history.length} registros de saúde, ${medications.length} medicações ativas e condições: ${conditions.join(', ')}.`;
    }
  }

  /**
   * Extrair condições do histórico
   */
  private static extractConditions(history: HealthRecord[]): string[] {
    return history
      .filter(r => r.recordType === 'consultation')
      .map(r => r.tags)
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i);
  }

  /**
   * Gerar recomendações
   */
  private static generateRecommendations(history: HealthRecord[], medications: any[]): string[] {
    return [
      'Manter acompanhamento regular com especialista',
      'Realizar exames de acompanhamento conforme recomendado',
      'Manter adesão ao tratamento medicamentoso',
      'Monitorar sinais vitais regularmente'
    ];
  }

  /**
   * Gerar token de acesso
   */
  private static generateAccessToken(patientId: string, specialistId: string, duration: number): string {
    return Buffer.from(`${patientId}:${specialistId}:${Date.now()}`).toString('base64');
  }

  /**
   * Registrar auditoria
   */
  private static async auditLog(action: string, patientId: string, targetId: string): Promise<void> {
    try {
      (mockDb.auditLogs as any[]).push({
        action,
        patientId,
        targetId,
        timestamp: new Date(),
        ipAddress: '0.0.0.0'
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }
}
