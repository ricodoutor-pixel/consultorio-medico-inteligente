import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

const client = twilio(accountSid, authToken);

export interface ConsultationAlert {
  doctorPhone: string;
  patientName: string;
  patientQueixa: string;
  consultationId: string;
  appointmentTime: string;
  urgency: 'normal' | 'urgent' | 'emergency';
}

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
}

/**
 * Envia alerta de consulta agendada para o médico via WhatsApp
 */
export async function sendConsultationAlert(alert: ConsultationAlert): Promise<string> {
  try {
    const urgencyEmoji = alert.urgency === 'emergency' ? '🚨' : alert.urgency === 'urgent' ? '⚠️' : '📋';
    
    const message = `${urgencyEmoji} *NOVA CONSULTA AGENDADA*

👤 Paciente: ${alert.patientName}
🏥 Queixa: ${alert.patientQueixa}
⏰ Horário: ${alert.appointmentTime}
🆔 ID: ${alert.consultationId}

*Responda em até 5 minutos:*
✅ Atender: https://plantayraiz.com.br/atender/${alert.consultationId}
❌ Recusar: https://plantayraiz.com.br/recusar/${alert.consultationId}

Caso não responda, a consulta será revertida para outro médico.`;

    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${alert.doctorPhone}`,
      body: message,
    });

    console.log(`✅ Alerta WhatsApp enviado para ${alert.doctorPhone}: ${result.sid}`);
    return result.sid;
  } catch (error) {
    console.error('❌ Erro ao enviar alerta WhatsApp:', error);
    throw error;
  }
}

/**
 * Envia mensagem genérica via WhatsApp
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<string> {
  try {
    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${message.to}`,
      body: message.body,
      mediaUrl: message.mediaUrl,
    });

    console.log(`✅ Mensagem WhatsApp enviada para ${message.to}: ${result.sid}`);
    return result.sid;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem WhatsApp:', error);
    throw error;
  }
}

/**
 * Envia confirmação de consulta realizada
 */
export async function sendConsultationConfirmation(
  doctorPhone: string,
  patientName: string,
  consultationId: string,
  prescriptionUrl?: string
): Promise<string> {
  try {
    const message = `✅ *CONSULTA REALIZADA COM SUCESSO*

👤 Paciente: ${patientName}
🆔 ID: ${consultationId}

${prescriptionUrl ? `📄 Receita para assinatura: ${prescriptionUrl}` : ''}

Obrigado por usar a Planta y Raiz!`;

    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${doctorPhone}`,
      body: message,
    });

    return result.sid;
  } catch (error) {
    console.error('❌ Erro ao enviar confirmação:', error);
    throw error;
  }
}

/**
 * Envia notificação ao paciente sobre status da consulta
 */
export async function sendPatientNotification(
  patientPhone: string,
  message: string,
  type: 'confirmation' | 'reminder' | 'prescription' | 'followup'
): Promise<string> {
  try {
    const icons = {
      confirmation: '✅',
      reminder: '⏰',
      prescription: '📄',
      followup: '👨‍⚕️',
    };

    const fullMessage = `${icons[type]} *PLANTA Y RAIZ*\n\n${message}`;

    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${patientPhone}`,
      body: fullMessage,
    });

    console.log(`✅ Notificação enviada ao paciente ${patientPhone}: ${result.sid}`);
    return result.sid;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação ao paciente:', error);
    throw error;
  }
}

/**
 * Gera QR Code para autenticação do WhatsApp (simulado)
 */
export function generateWhatsAppQRCode(): { qrCode: string; expiresIn: number } {
  // Em produção, isso seria integrado com a API do Twilio para gerar um QR Code real
  // Por enquanto, retornamos um placeholder
  return {
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    expiresIn: 300, // 5 minutos
  };
}
