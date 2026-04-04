/**
 * SISTEMA DE AGENDAMENTOS COM WHATSAPP
 * Plantayraiz.com.br - Integração com Enfermeira Brisa
 * Data: 04 de Abril de 2026
 */

const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// Credenciais Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

// Números de Contato
const BRISA_WHATSAPP = 'whatsapp:+5511991363154'; // Enfermeira Brisa
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP || 'whatsapp:+5511999999999';

// Configurações
const SITE_URL = 'https://plantayraiz.com.br';
const LOG_DIR = '/tmp/whatsapp-scheduling';

// Inicializar cliente Twilio
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ============================================================================
// LOGGER
// ============================================================================

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
  };

  console.log(`[${timestamp}] [${level}] ${message}`, data);

  const logFile = path.join(LOG_DIR, `scheduling_${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// ============================================================================
// BANCO DE DADOS DE AGENDAMENTOS (Simulado)
// ============================================================================

class SchedulingDatabase {
  constructor() {
    this.appointments = [];
    this.patients = [];
    this.professionals = [
      {
        id: 'brisa',
        name: 'Brisa (Enfermeira)',
        specialty: 'Enfermagem',
        whatsapp: BRISA_WHATSAPP,
        availability: ['09:00', '10:00', '14:00', '15:00', '16:00'],
      },
    ];
  }

  /**
   * Adicionar novo agendamento
   */
  addAppointment(appointment) {
    const id = `APT_${Date.now()}`;
    const newAppointment = {
      id,
      ...appointment,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
    };

    this.appointments.push(newAppointment);
    log('INFO', 'Agendamento criado', { id, appointment });
    return newAppointment;
  }

  /**
   * Listar agendamentos
   */
  listAppointments(filter = {}) {
    return this.appointments.filter((apt) => {
      if (filter.professionalId && apt.professionalId !== filter.professionalId) return false;
      if (filter.patientPhone && apt.patientPhone !== filter.patientPhone) return false;
      if (filter.status && apt.status !== filter.status) return false;
      return true;
    });
  }

  /**
   * Obter agendamento por ID
   */
  getAppointment(id) {
    return this.appointments.find((apt) => apt.id === id);
  }

  /**
   * Cancelar agendamento
   */
  cancelAppointment(id, reason = '') {
    const appointment = this.getAppointment(id);
    if (!appointment) return null;

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date().toISOString();
    appointment.cancelReason = reason;

    log('INFO', 'Agendamento cancelado', { id, reason });
    return appointment;
  }

  /**
   * Confirmar agendamento
   */
  confirmAppointment(id) {
    const appointment = this.getAppointment(id);
    if (!appointment) return null;

    appointment.status = 'CONFIRMED';
    appointment.confirmedAt = new Date().toISOString();

    log('INFO', 'Agendamento confirmado', { id });
    return appointment;
  }

  /**
   * Obter horários disponíveis
   */
  getAvailableSlots(professionalId, date) {
    const professional = this.professionals.find((p) => p.id === professionalId);
    if (!professional) return [];

    const bookedSlots = this.appointments
      .filter((apt) => apt.professionalId === professionalId && apt.date === date && apt.status !== 'CANCELLED')
      .map((apt) => apt.time);

    return professional.availability.filter((slot) => !bookedSlots.includes(slot));
  }
}

const db = new SchedulingDatabase();

// ============================================================================
// FUNÇÕES DE NOTIFICAÇÃO
// ============================================================================

/**
 * Enviar mensagem WhatsApp
 */
async function sendWhatsAppMessage(to, message) {
  try {
    const response = await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to,
      body: message,
    });

    log('INFO', 'Mensagem WhatsApp enviada', {
      to,
      messageId: response.sid,
      status: response.status,
    });

    return response.sid;
  } catch (error) {
    log('ERROR', 'Falha ao enviar mensagem WhatsApp', {
      to,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Notificar novo agendamento ao paciente
 */
async function notifyPatientNewAppointment(appointment) {
  const message = `✅ AGENDAMENTO CONFIRMADO

📅 Data: ${appointment.date}
⏰ Horário: ${appointment.time}
👨‍⚕️ Profissional: ${appointment.professionalName}
🏥 Especialidade: ${appointment.specialty}

📱 Confirmação: ${appointment.id}

Para cancelar ou reagendar:
Envie uma mensagem para Brisa ou acesse: ${SITE_URL}/appointments

Obrigado!`;

  try {
    await sendWhatsAppMessage(appointment.patientPhone, message);
  } catch (error) {
    log('ERROR', 'Falha ao notificar paciente', { error });
  }
}

/**
 * Notificar novo agendamento à Brisa
 */
async function notifyBrisaNewAppointment(appointment) {
  const message = `📋 NOVO AGENDAMENTO

👤 Paciente: ${appointment.patientName}
📱 Telefone: ${appointment.patientPhone}
📅 Data: ${appointment.date}
⏰ Horário: ${appointment.time}
🏥 Especialidade: ${appointment.specialty}

Detalhes:
${appointment.notes || 'Sem observações'}

ID: ${appointment.id}`;

  try {
    await sendWhatsAppMessage(BRISA_WHATSAPP, message);
  } catch (error) {
    log('ERROR', 'Falha ao notificar Brisa', { error });
  }
}

/**
 * Enviar lembrete de agendamento
 */
async function sendReminderNotification(appointment) {
  const message = `🔔 LEMBRETE DE AGENDAMENTO

📅 Amanhã às ${appointment.time}
👨‍⚕️ Profissional: ${appointment.professionalName}
🏥 Local: ${SITE_URL}

Confirme sua presença respondendo esta mensagem.

ID: ${appointment.id}`;

  try {
    await sendWhatsAppMessage(appointment.patientPhone, message);
  } catch (error) {
    log('ERROR', 'Falha ao enviar lembrete', { error });
  }
}

/**
 * Enviar confirmação de cancelamento
 */
async function sendCancellationNotification(appointment, reason = '') {
  const message = `❌ AGENDAMENTO CANCELADO

📅 Data: ${appointment.date}
⏰ Horário: ${appointment.time}
👨‍⚕️ Profissional: ${appointment.professionalName}

${reason ? `Motivo: ${reason}` : ''}

Para reagendar, acesse: ${SITE_URL}/appointments

ID: ${appointment.id}`;

  try {
    await sendWhatsAppMessage(appointment.patientPhone, message);
  } catch (error) {
    log('ERROR', 'Falha ao enviar notificação de cancelamento', { error });
  }
}

// ============================================================================
// FUNÇÕES DE AGENDAMENTO
// ============================================================================

/**
 * Criar novo agendamento
 */
async function createAppointment(data) {
  try {
    // Validar dados
    if (!data.patientName || !data.patientPhone || !data.date || !data.time) {
      throw new Error('Dados incompletos para agendamento');
    }

    // Verificar disponibilidade
    const availableSlots = db.getAvailableSlots(data.professionalId || 'brisa', data.date);
    if (!availableSlots.includes(data.time)) {
      throw new Error('Horário não disponível');
    }

    // Criar agendamento
    const appointment = db.addAppointment({
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      date: data.date,
      time: data.time,
      professionalId: data.professionalId || 'brisa',
      professionalName: data.professionalName || 'Brisa (Enfermeira)',
      specialty: data.specialty || 'Enfermagem',
      notes: data.notes || '',
    });

    // Notificar paciente
    await notifyPatientNewAppointment(appointment);

    // Notificar Brisa
    await notifyBrisaNewAppointment(appointment);

    log('INFO', 'Agendamento criado com sucesso', { id: appointment.id });
    return appointment;
  } catch (error) {
    log('ERROR', 'Falha ao criar agendamento', { error: error.message });
    throw error;
  }
}

/**
 * Cancelar agendamento
 */
async function cancelAppointment(appointmentId, reason = '') {
  try {
    const appointment = db.getAppointment(appointmentId);
    if (!appointment) {
      throw new Error('Agendamento não encontrado');
    }

    db.cancelAppointment(appointmentId, reason);

    // Notificar paciente
    await sendCancellationNotification(appointment, reason);

    // Notificar Brisa
    const message = `❌ AGENDAMENTO CANCELADO\n\nID: ${appointmentId}\nMotivo: ${reason || 'Não especificado'}`;
    await sendWhatsAppMessage(BRISA_WHATSAPP, message);

    log('INFO', 'Agendamento cancelado com sucesso', { id: appointmentId });
    return appointment;
  } catch (error) {
    log('ERROR', 'Falha ao cancelar agendamento', { error: error.message });
    throw error;
  }
}

/**
 * Listar horários disponíveis
 */
function getAvailableSlots(professionalId = 'brisa', date) {
  return db.getAvailableSlots(professionalId, date);
}

/**
 * Listar agendamentos
 */
function listAppointments(filter = {}) {
  return db.listAppointments(filter);
}

/**
 * Obter agendamento
 */
function getAppointment(id) {
  return db.getAppointment(id);
}

// ============================================================================
// FUNÇÃO: Enviar Lembretes Automáticos
// ============================================================================

/**
 * Enviar lembretes para agendamentos de amanhã
 */
async function sendTomorrowReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const appointments = db.listAppointments({
      date: tomorrowDate,
      status: 'CONFIRMED',
    });

    log('INFO', `Enviando lembretes para ${appointments.length} agendamentos`);

    for (const appointment of appointments) {
      await sendReminderNotification(appointment);
    }

    return appointments.length;
  } catch (error) {
    log('ERROR', 'Falha ao enviar lembretes', { error: error.message });
    throw error;
  }
}

// ============================================================================
// EXPORTAR FUNÇÕES
// ============================================================================

module.exports = {
  createAppointment,
  cancelAppointment,
  getAvailableSlots,
  listAppointments,
  getAppointment,
  sendTomorrowReminders,
  notifyPatientNewAppointment,
  notifyBrisaNewAppointment,
  sendReminderNotification,
  sendCancellationNotification,
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

if (require.main === module) {
  // Exemplo de uso
  (async () => {
    try {
      // Criar agendamento de teste
      const appointment = await createAppointment({
        patientName: 'João Silva',
        patientPhone: 'whatsapp:+5511987654321',
        date: '2026-04-10',
        time: '14:00',
        professionalId: 'brisa',
        professionalName: 'Brisa (Enfermeira)',
        specialty: 'Enfermagem',
        notes: 'Primeira consulta - Avaliação inicial',
      });

      console.log('✅ Agendamento criado:', appointment);

      // Listar agendamentos
      const appointments = listAppointments();
      console.log('📋 Total de agendamentos:', appointments.length);
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }
  })();
}
