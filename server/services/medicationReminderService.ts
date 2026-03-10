// Notifications handled on client-side via expo-notifications
// This service manages reminder scheduling and data

export interface MedicationReminder {
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: 'once' | 'twice' | 'thrice' | 'four_times' | 'custom';
  times: string[]; // ["08:00", "20:00"]
  startDate: Date;
  endDate?: Date;
  reminderMinutesBefore: number;
  isActive: boolean;
}

export interface ReminderSchedule {
  reminderId: string;
  nextReminderTime: Date;
  reminderTimes: Date[];
  adherenceRate: number;
}

export class MedicationReminderService {
  private static reminders: Map<string, MedicationReminder> = new Map();
  private static schedules: Map<string, ReminderSchedule> = new Map();

  /**
   * Criar novo lembrete de medicação
   */
  static async createReminder(reminder: MedicationReminder): Promise<string> {
    try {
      const reminderId = 'rem_' + Date.now();
      this.reminders.set(reminderId, reminder);

      // Gerar cronograma
      const schedule = this.generateSchedule(reminder);
      this.schedules.set(reminderId, schedule);

      // Agendar notificações
      await this.scheduleNotifications(reminderId, reminder, schedule);

      return reminderId;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Gerar cronograma de lembretes
   */
  private static generateSchedule(reminder: MedicationReminder): ReminderSchedule {
    const reminderTimes: Date[] = [];
    const today = new Date();
    const endDate = reminder.endDate || new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Gerar lembretes para cada dia até a data final
    let currentDate = new Date(reminder.startDate);
    while (currentDate <= endDate) {
      for (const time of reminder.times) {
        const [hours, minutes] = time.split(':').map(Number);
        const reminderDate = new Date(currentDate);
        reminderDate.setHours(hours, minutes, 0, 0);
        reminderDate.setTime(reminderDate.getTime() - reminder.reminderMinutesBefore * 60 * 1000);
        reminderTimes.push(reminderDate);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      reminderId: 'rem_' + Date.now(),
      nextReminderTime: reminderTimes[0] || new Date(),
      reminderTimes,
      adherenceRate: 0
    };
  }

  /**
   * Agendar notificações
   */
  private static async scheduleNotifications(
    reminderId: string,
    reminder: MedicationReminder,
    schedule: ReminderSchedule
  ): Promise<void> {
    try {
      for (const reminderTime of schedule.reminderTimes.slice(0, 30)) {
        const delayMs = reminderTime.getTime() - Date.now();
        if (delayMs > 0) {
          // Log scheduling (actual notification sent on client-side)
          console.log(`Scheduled reminder for ${reminder.medicationName} at ${reminderTime}`);
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  /**
   * Registrar que medicação foi tomada
   */
  static async recordMedicationTaken(
    patientId: string,
    reminderId: string,
    medicationName: string,
    timestamp: Date
  ): Promise<void> {
    try {
      const reminder = this.reminders.get(reminderId);
      if (!reminder) throw new Error('Reminder not found');

      // Registrar na base de dados
      // await db.medicationAdherence.create({
      //   patientId,
      //   reminderId,
      //   medicationName,
      //   takenAt: timestamp,
      //   createdAt: new Date()
      // });

      // Atualizar taxa de adesão
      const schedule = this.schedules.get(reminderId);
      if (schedule) {
        const adherenceCount = Math.floor(schedule.adherenceRate * schedule.reminderTimes.length) + 1;
        schedule.adherenceRate = adherenceCount / schedule.reminderTimes.length;
      }

      // Log confirmation (actual notification sent on client-side)
      console.log(`Medication ${medicationName} recorded as taken at ${timestamp}`);
    } catch (error) {
      console.error('Error recording medication taken:', error);
      throw error;
    }
  }

  /**
   * Obter taxa de adesão
   */
  static getAdherenceRate(reminderId: string): number {
    const schedule = this.schedules.get(reminderId);
    return schedule?.adherenceRate || 0;
  }

  /**
   * Enviar lembrete manual
   */
  static async sendManualReminder(
    reminderId: string,
    medicationName: string,
    dosage: string
  ): Promise<void> {
    try {
      // Log manual reminder (actual notification sent on client-side)
      console.log(`Manual reminder sent for ${medicationName} - ${dosage}`);
    } catch (error) {
      console.error('Error sending manual reminder:', error);
    }
  }

  /**
   * Pausar lembretes
   */
  static pauseReminder(reminderId: string): void {
    const reminder = this.reminders.get(reminderId);
    if (reminder) {
      reminder.isActive = false;
    }
  }

  /**
   * Retomar lembretes
   */
  static resumeReminder(reminderId: string): void {
    const reminder = this.reminders.get(reminderId);
    if (reminder) {
      reminder.isActive = true;
    }
  }

  /**
   * Deletar lembrete
   */
  static deleteReminder(reminderId: string): void {
    this.reminders.delete(reminderId);
    this.schedules.delete(reminderId);
  }

  /**
   * Listar lembretes ativos
   */
  static getActiveReminders(patientId: string): MedicationReminder[] {
    return Array.from(this.reminders.values()).filter(
      r => r.patientId === patientId && r.isActive
    );
  }

  /**
   * Gerar relatório de adesão
   */
  static generateAdherenceReport(patientId: string): {
    totalReminders: number;
    completedReminders: number;
    adherencePercentage: number;
    medications: Array<{
      name: string;
      adherenceRate: number;
      status: 'excellent' | 'good' | 'fair' | 'poor';
    }>;
  } {
    const reminders = this.getActiveReminders(patientId);
    let totalReminders = 0;
    let completedReminders = 0;

    const medicationStats: Record<string, { adherenceRate: number }> = {};

    for (const reminder of reminders) {
      const schedule = this.schedules.get('rem_' + Date.now());
      if (schedule) {
        totalReminders += schedule.reminderTimes.length;
        completedReminders += Math.floor(schedule.adherenceRate * schedule.reminderTimes.length);

        if (!medicationStats[reminder.medicationName]) {
          medicationStats[reminder.medicationName] = { adherenceRate: 0 };
        }
        medicationStats[reminder.medicationName].adherenceRate = schedule.adherenceRate;
      }
    }

    const adherencePercentage = totalReminders > 0 ? (completedReminders / totalReminders) * 100 : 0;

    return {
      totalReminders,
      completedReminders,
      adherencePercentage,
      medications: Object.entries(medicationStats).map(([name, stats]) => ({
        name,
        adherenceRate: stats.adherenceRate,
        status: this.getAdherenceStatus(stats.adherenceRate)
      }))
    };
  }

  /**
   * Obter status de adesão
   */
  private static getAdherenceStatus(
    rate: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (rate >= 0.9) return 'excellent';
    if (rate >= 0.75) return 'good';
    if (rate >= 0.5) return 'fair';
    return 'poor';
  }

  /**
   * Enviar alerta de baixa adesão
   */
  static async sendLowAdherenceAlert(
    patientId: string,
    medicationName: string,
    adherenceRate: number
  ): Promise<void> {
    try {
      if (adherenceRate < 0.5) {
        console.warn(`Low adherence alert: ${medicationName} at ${(adherenceRate * 100).toFixed(0)}%`);
      }
    } catch (error) {
      console.error('Error sending low adherence alert:', error);
    }
  }
}
