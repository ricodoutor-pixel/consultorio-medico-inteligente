export interface ConfirmationRule {
  id: string;
  name: string;
  trigger: 'appointment_scheduled' | 'payment_received' | 'time_elapsed' | 'manual';
  conditions: {
    consultationType?: 'video' | 'phone' | 'chat';
    specialistId?: string;
    patientType?: 'new' | 'returning';
    paymentMethod?: 'pix' | 'credit_card' | 'insurance';
    minHoursBeforeAppointment?: number;
  };
  actions: {
    autoConfirm: boolean;
    sendNotification: boolean;
    sendReminder: boolean;
    generateJoinLink: boolean;
    scheduleFollowUp: boolean;
  };
  enabled: boolean;
}

export interface ConfirmationLog {
  logId: string;
  appointmentId: string;
  ruleId: string;
  status: 'confirmed' | 'failed' | 'pending';
  timestamp: Date;
  details: string;
}

export class AutoConfirmationService {
  private static rules: Map<string, ConfirmationRule> = new Map();
  private static logs: ConfirmationLog[] = [];
  private static confirmationQueue: Array<{
    appointmentId: string;
    ruleId: string;
    executeAt: Date;
  }> = [];

  /**
   * Criar regra de confirmação automática
   */
  static createRule(rule: ConfirmationRule): string {
    this.rules.set(rule.id, rule);
    return rule.id;
  }

  /**
   * Processar agendamento para confirmação automática
   */
  static async processAppointmentForConfirmation(appointmentData: {
    appointmentId: string;
    consultationType: 'video' | 'phone' | 'chat';
    specialistId: string;
    patientId: string;
    paymentMethod: 'pix' | 'credit_card' | 'insurance';
    appointmentDate: Date;
  }): Promise<{
    confirmed: boolean;
    ruleApplied: string | null;
    message: string;
  }> {
    try {
      // Encontrar regra aplicável
      const applicableRule = this.findApplicableRule(appointmentData);

      if (!applicableRule) {
        return {
          confirmed: false,
          ruleApplied: null,
          message: 'Nenhuma regra de confirmação automática aplicável'
        };
      }

      if (!applicableRule.enabled) {
        return {
          confirmed: false,
          ruleApplied: applicableRule.id,
          message: 'Regra desabilitada'
        };
      }

      // Executar ações de confirmação
      const confirmationResult = await this.executeConfirmationActions(
        appointmentData.appointmentId,
        applicableRule
      );

      // Registrar log
      this.logConfirmation(
        appointmentData.appointmentId,
        applicableRule.id,
        confirmationResult.success ? 'confirmed' : 'failed',
        confirmationResult.details
      );

      return {
        confirmed: confirmationResult.success,
        ruleApplied: applicableRule.id,
        message: confirmationResult.details
      };
    } catch (error) {
      console.error('Error processing appointment for confirmation:', error);
      return {
        confirmed: false,
        ruleApplied: null,
        message: 'Erro ao processar confirmação automática'
      };
    }
  }

  /**
   * Encontrar regra aplicável
   */
  private static findApplicableRule(appointmentData: any): ConfirmationRule | null {
    const rulesArray = Array.from(this.rules.values());
    for (const rule of rulesArray) {
      if (!rule.enabled) continue;

      const conditions = rule.conditions;

      // Verificar condições
      if (conditions.consultationType && conditions.consultationType !== appointmentData.consultationType) {
        continue;
      }

      if (conditions.specialistId && conditions.specialistId !== appointmentData.specialistId) {
        continue;
      }

      if (conditions.paymentMethod && conditions.paymentMethod !== appointmentData.paymentMethod) {
        continue;
      }

      // Verificar tempo antes do agendamento
      if (conditions.minHoursBeforeAppointment) {
        const hoursUntilAppointment = this.calculateHoursUntilAppointment(appointmentData.appointmentDate);
        if (hoursUntilAppointment < conditions.minHoursBeforeAppointment) {
          continue;
        }
      }

      return rule;
    }

    return null;
  }

  /**
   * Executar ações de confirmação
   */
  private static async executeConfirmationActions(
    appointmentId: string,
    rule: ConfirmationRule
  ): Promise<{
    success: boolean;
    details: string;
  }> {
    try {
      const results: string[] = [];

      if (rule.actions.autoConfirm) {
        // Confirmar agendamento automaticamente
        console.log(`Auto-confirming appointment ${appointmentId}`);
        results.push('✓ Agendamento confirmado automaticamente');
      }

      if (rule.actions.sendNotification) {
        // Enviar notificação
        console.log(`Sending notification for appointment ${appointmentId}`);
        results.push('✓ Notificação enviada');
      }

      if (rule.actions.sendReminder) {
        // Agendar lembrete
        console.log(`Scheduling reminder for appointment ${appointmentId}`);
        results.push('✓ Lembrete agendado');
      }

      if (rule.actions.generateJoinLink) {
        // Gerar link de acesso
        const joinLink = this.generateJoinLink(appointmentId);
        console.log(`Generated join link: ${joinLink}`);
        results.push('✓ Link de acesso gerado');
      }

      if (rule.actions.scheduleFollowUp) {
        // Agendar acompanhamento
        console.log(`Scheduling follow-up for appointment ${appointmentId}`);
        results.push('✓ Acompanhamento agendado');
      }

      return {
        success: true,
        details: results.join('; ')
      };
    } catch (error) {
      console.error('Error executing confirmation actions:', error);
      return {
        success: false,
        details: `Erro ao executar ações: ${error}`
      };
    }
  }

  /**
   * Registrar log de confirmação
   */
  private static logConfirmation(
    appointmentId: string,
    ruleId: string,
    status: 'confirmed' | 'failed' | 'pending',
    details: string
  ): void {
    const log: ConfirmationLog = {
      logId: 'log_' + Date.now(),
      appointmentId,
      ruleId,
      status,
      timestamp: new Date(),
      details
    };

    this.logs.push(log);
  }

  /**
   * Gerar link de acesso
   */
  private static generateJoinLink(appointmentId: string): string {
    return `https://planta-raiz.com/join/${appointmentId}?token=${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Calcular horas até agendamento
   */
  private static calculateHoursUntilAppointment(appointmentDate: Date): number {
    const now = new Date();
    return Math.round((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Obter regra por ID
   */
  static getRule(ruleId: string): ConfirmationRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Listar todas as regras
   */
  static getAllRules(): ConfirmationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Atualizar regra
   */
  static updateRule(ruleId: string, updates: Partial<ConfirmationRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  /**
   * Deletar regra
   */
  static deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Habilitar/desabilitar regra
   */
  static toggleRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = !rule.enabled;
    return true;
  }

  /**
   * Obter logs de confirmação
   */
  static getConfirmationLogs(appointmentId?: string, limit: number = 100): ConfirmationLog[] {
    let logs = this.logs;

    if (appointmentId) {
      logs = logs.filter(l => l.appointmentId === appointmentId);
    }

    return logs.slice(-limit);
  }

  /**
   * Obter estatísticas de confirmação
   */
  static getConfirmationStats(): {
    totalConfirmations: number;
    successfulConfirmations: number;
    failedConfirmations: number;
    successRate: number;
    averageProcessingTime: number;
  } {
    const totalConfirmations = this.logs.length;
    const successfulConfirmations = this.logs.filter(l => l.status === 'confirmed').length;
    const failedConfirmations = this.logs.filter(l => l.status === 'failed').length;

    const successRate = totalConfirmations > 0
      ? (successfulConfirmations / totalConfirmations) * 100
      : 0;

    return {
      totalConfirmations,
      successfulConfirmations,
      failedConfirmations,
      successRate: Math.round(successRate),
      averageProcessingTime: 2 // segundos (mock)
    };
  }

  /**
   * Criar regras padrão
   */
  static createDefaultRules(): void {
    const defaultRules: ConfirmationRule[] = [
      {
        id: 'rule_pix_video',
        name: 'Auto-confirmar PIX + Vídeo',
        trigger: 'payment_received',
        conditions: {
          consultationType: 'video',
          paymentMethod: 'pix'
        },
        actions: {
          autoConfirm: true,
          sendNotification: true,
          sendReminder: true,
          generateJoinLink: true,
          scheduleFollowUp: false
        },
        enabled: true
      },
      {
        id: 'rule_credit_card_any',
        name: 'Auto-confirmar Cartão de Crédito',
        trigger: 'payment_received',
        conditions: {
          paymentMethod: 'credit_card'
        },
        actions: {
          autoConfirm: true,
          sendNotification: true,
          sendReminder: true,
          generateJoinLink: true,
          scheduleFollowUp: false
        },
        enabled: true
      },
      {
        id: 'rule_emergency_immediate',
        name: 'Confirmação Imediata - Emergência',
        trigger: 'appointment_scheduled',
        conditions: {
          minHoursBeforeAppointment: 0
        },
        actions: {
          autoConfirm: true,
          sendNotification: true,
          sendReminder: false,
          generateJoinLink: true,
          scheduleFollowUp: true
        },
        enabled: true
      }
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  /**
   * Processar fila de confirmação
   */
  static processConfirmationQueue(): void {
    const now = new Date();
    const itemsToProcess: typeof this.confirmationQueue = [];

    for (let i = this.confirmationQueue.length - 1; i >= 0; i--) {
      const item = this.confirmationQueue[i];
      if (item.executeAt <= now) {
        itemsToProcess.push(item);
        this.confirmationQueue.splice(i, 1);
      }
    }

    for (const item of itemsToProcess) {
      console.log(`Processing confirmation for appointment ${item.appointmentId}`);
      // Executar confirmação
    }
  }

  /**
   * Adicionar item à fila de confirmação
   */
  static enqueueConfirmation(appointmentId: string, ruleId: string, executeAt: Date): void {
    this.confirmationQueue.push({
      appointmentId,
      ruleId,
      executeAt
    });
  }
}
