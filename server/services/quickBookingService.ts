export interface QuickBookingStep1 {
  symptoms: string[];
  urgency: 'routine' | 'urgent' | 'emergency';
  preferredDate?: Date;
}

export interface QuickBookingStep2 {
  specialistId: string;
  appointmentDate: Date;
  appointmentTime: string;
  consultationType: 'video' | 'phone' | 'chat';
}

export interface QuickBookingStep3 {
  paymentMethod: 'pix' | 'credit_card' | 'insurance';
  insuranceProvider?: string;
  confirmationEmail: string;
}

export interface Appointment {
  appointmentId: string;
  patientId: string;
  specialistId: string;
  appointmentDate: Date;
  appointmentTime: string;
  consultationType: 'video' | 'phone' | 'chat';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  cost: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  confirmationCode: string;
  joinUrl?: string;
  notes: string;
}

export class QuickBookingService {
  private static appointments: Map<string, Appointment> = new Map();
  private static bookingSessions: Map<string, any> = new Map();

  /**
   * Iniciar processo de agendamento rápido
   */
  static startQuickBooking(patientId: string): string {
    const sessionId = 'book_' + Date.now();
    this.bookingSessions.set(sessionId, {
      patientId,
      step: 1,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
    });
    return sessionId;
  }

  /**
   * Etapa 1: Selecionar sintomas e urgência
   */
  static completeStep1(sessionId: string, data: QuickBookingStep1): boolean {
    const session = this.bookingSessions.get(sessionId);
    if (!session || session.step !== 1) return false;

    session.step1Data = data;
    session.step = 2;
    return true;
  }

  /**
   * Etapa 2: Selecionar especialista e horário
   */
  static completeStep2(sessionId: string, data: QuickBookingStep2): boolean {
    const session = this.bookingSessions.get(sessionId);
    if (!session || session.step !== 2) return false;

    session.step2Data = data;
    session.step = 3;
    return true;
  }

  /**
   * Etapa 3: Confirmar pagamento e agendar
   */
  static completeStep3(sessionId: string, data: QuickBookingStep3): string {
    const session = this.bookingSessions.get(sessionId);
    if (!session || session.step !== 3) throw new Error('Invalid booking session');

    const appointmentId = 'apt_' + Date.now();
    const confirmationCode = this.generateConfirmationCode();

    const appointment: Appointment = {
      appointmentId,
      patientId: session.patientId,
      specialistId: session.step2Data.specialistId,
      appointmentDate: session.step2Data.appointmentDate,
      appointmentTime: session.step2Data.appointmentTime,
      consultationType: session.step2Data.consultationType,
      status: 'scheduled',
      cost: 150, // Default cost
      paymentStatus: data.paymentMethod === 'pix' ? 'pending' : 'paid',
      confirmationCode,
      notes: '',
      joinUrl: this.generateJoinUrl(appointmentId)
    };

    this.appointments.set(appointmentId, appointment);

    // Enviar confirmação por email (mock)
    console.log(`Confirmation email sent to ${data.confirmationEmail}`);

    // Limpar sessão
    this.bookingSessions.delete(sessionId);

    return appointmentId;
  }

  /**
   * Gerar código de confirmação
   */
  private static generateConfirmationCode(): string {
    return 'CONF' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Gerar URL de acesso à consulta
   */
  private static generateJoinUrl(appointmentId: string): string {
    return `https://planta-raiz.com/join/${appointmentId}?token=${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Obter agendamento
   */
  static getAppointment(appointmentId: string): Appointment | undefined {
    return this.appointments.get(appointmentId);
  }

  /**
   * Listar agendamentos do paciente
   */
  static getPatientAppointments(patientId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(a => a.patientId === patientId);
  }

  /**
   * Listar agendamentos do especialista
   */
  static getSpecialistAppointments(specialistId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(a => a.specialistId === specialistId);
  }

  /**
   * Confirmar agendamento
   */
  static confirmAppointment(appointmentId: string): void {
    const appointment = this.appointments.get(appointmentId);
    if (appointment) {
      appointment.status = 'confirmed';
      appointment.paymentStatus = 'paid';
    }
  }

  /**
   * Iniciar consulta
   */
  static startAppointment(appointmentId: string): void {
    const appointment = this.appointments.get(appointmentId);
    if (appointment) {
      appointment.status = 'in_progress';
    }
  }

  /**
   * Finalizar consulta
   */
  static completeAppointment(appointmentId: string): void {
    const appointment = this.appointments.get(appointmentId);
    if (appointment) {
      appointment.status = 'completed';
    }
  }

  /**
   * Cancelar agendamento
   */
  static cancelAppointment(appointmentId: string, reason: string): void {
    const appointment = this.appointments.get(appointmentId);
    if (appointment) {
      appointment.status = 'cancelled';
      appointment.notes = reason;
      // Processar reembolso
      if (appointment.paymentStatus === 'paid') {
        appointment.paymentStatus = 'refunded';
      }
    }
  }

  /**
   * Reagendar consulta
   */
  static rescheduleAppointment(
    appointmentId: string,
    newDate: Date,
    newTime: string
  ): string {
    const oldAppointment = this.appointments.get(appointmentId);
    if (!oldAppointment) throw new Error('Appointment not found');

    // Cancelar agendamento antigo
    this.cancelAppointment(appointmentId, 'Reagendado');

    // Criar novo agendamento
    const newAppointmentId = 'apt_' + Date.now();
    const newAppointment: Appointment = {
      ...oldAppointment,
      appointmentId: newAppointmentId,
      appointmentDate: newDate,
      appointmentTime: newTime,
      status: 'scheduled',
      confirmationCode: this.generateConfirmationCode(),
      joinUrl: this.generateJoinUrl(newAppointmentId)
    };

    this.appointments.set(newAppointmentId, newAppointment);
    return newAppointmentId;
  }

  /**
   * Gerar resumo de agendamento
   */
  static generateAppointmentSummary(appointmentId: string): string {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) return '';

    return `
CONFIRMAÇÃO DE AGENDAMENTO
===========================

Código de Confirmação: ${appointment.confirmationCode}
ID do Agendamento: ${appointmentId}

DATA E HORA:
${appointment.appointmentDate.toLocaleDateString('pt-BR')} às ${appointment.appointmentTime}

TIPO DE CONSULTA:
${appointment.consultationType === 'video' ? 'Vídeo' : appointment.consultationType === 'phone' ? 'Telefone' : 'Chat'}

CUSTO:
R$ ${appointment.cost.toFixed(2)}

LINK DE ACESSO:
${appointment.joinUrl}

INSTRUÇÕES:
1. Acesse o link acima 5 minutos antes da consulta
2. Verifique sua câmera e microfone
3. Tenha seu documento de identidade à mão
4. Escolha um local tranquilo e bem iluminado

CANCELAMENTO:
Para cancelar, entre em contato conosco até 24 horas antes da consulta.
    `;
  }

  /**
   * Obter estatísticas de agendamentos
   */
  static getBookingStats(): {
    totalAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageWaitTime: number;
  } {
    const appointments = Array.from(this.appointments.values());

    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;

    // Calcular tempo médio de espera (mock)
    const avgWaitTime = 15; // minutos

    return {
      totalAppointments: appointments.length,
      confirmedAppointments: confirmed,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      averageWaitTime: avgWaitTime
    };
  }

  /**
   * Enviar lembrete de agendamento
   */
  static sendAppointmentReminder(appointmentId: string): void {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) return;

    const hoursUntilAppointment = this.getHoursUntilAppointment(appointment);

    if (hoursUntilAppointment === 24 || hoursUntilAppointment === 1) {
      console.log(`Reminder sent for appointment ${appointmentId}`);
      // Enviar email/SMS/push notification
    }
  }

  /**
   * Calcular horas até agendamento
   */
  private static getHoursUntilAppointment(appointment: Appointment): number {
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    return Math.round((appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Obter próximos agendamentos
   */
  static getUpcomingAppointments(limit: number = 10): Appointment[] {
    const now = new Date();
    return Array.from(this.appointments.values())
      .filter(a => a.appointmentDate > now && a.status !== 'cancelled')
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
      .slice(0, limit);
  }

  /**
   * Obter sessão de agendamento
   */
  static getBookingSession(sessionId: string): any {
    return this.bookingSessions.get(sessionId);
  }

  /**
   * Limpar sessões expiradas
   */
  static cleanupExpiredSessions(): void {
    const now = new Date();
    const sessionsToDelete: string[] = [];
    
    this.bookingSessions.forEach((session, sessionId) => {
      if (session.expiresAt < now) {
        sessionsToDelete.push(sessionId);
      }
    });
    
    for (const sessionId of sessionsToDelete) {
      this.bookingSessions.delete(sessionId);
    }
  }
}
