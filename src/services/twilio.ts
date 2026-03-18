/**
 * INTEGRAÇÃO TWILIO - PLANTA & RAIZ
 * 
 * Serviço para:
 * - Envio de código de verificação via WhatsApp
 * - Notificações de transações
 * - Alertas de segurança
 * - Follow-up automático (D+7, D+30)
 */

import type { Twilio } from 'twilio';

export interface VerificationCode {
  code: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'verification' | 'notification' | 'alert' | 'followup';
  templateId?: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
  verificationCodeLength: number;
  verificationCodeExpiry: number; // em minutos
}

// ============================================
// CONFIGURAÇÃO TWILIO
// ============================================

let twilioClient: Twilio | null = null;

export function initializeTwilio(config: TwilioConfig): void {
  try {
    // Importar dinamicamente para evitar erros em ambiente de desenvolvimento
    const twilio = require('twilio');
    twilioClient = twilio(config.accountSid, config.authToken);
    console.log('✅ Twilio inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Twilio:', error);
    throw error;
  }
}

// ============================================
// GERAÇÃO DE CÓDIGO DE VERIFICAÇÃO
// ============================================

export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

export function createVerificationCode(
  length: number = 6,
  expiryMinutes: number = 10
): VerificationCode {
  return {
    code: generateVerificationCode(length),
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    attempts: 0,
    maxAttempts: 3,
  };
}

// ============================================
// ENVIO DE MENSAGENS WHATSAPP
// ============================================

export async function sendWhatsAppVerificationCode(
  phoneNumber: string,
  code: string,
  config: TwilioConfig
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  if (!twilioClient) {
    return {
      success: false,
      error: 'Twilio não inicializado',
    };
  }

  try {
    const message = await twilioClient.messages.create({
      from: `whatsapp:${config.whatsappNumber}`,
      to: `whatsapp:${phoneNumber}`,
      body: `🌿 Planta & Raiz\n\nSeu código de verificação é: ${code}\n\nVálido por 10 minutos.\n\nNunca compartilhe este código.`,
    });

    console.log(`✅ Código enviado para ${phoneNumber}: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error(`❌ Erro ao enviar código para ${phoneNumber}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: WhatsAppMessage,
  config: TwilioConfig
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  if (!twilioClient) {
    return {
      success: false,
      error: 'Twilio não inicializado',
    };
  }

  try {
    const fullMessage = await twilioClient.messages.create({
      from: `whatsapp:${config.whatsappNumber}`,
      to: `whatsapp:${phoneNumber}`,
      body: message.message,
    });

    console.log(`✅ Notificação enviada para ${phoneNumber}: ${fullMessage.sid}`);

    return {
      success: true,
      messageSid: fullMessage.sid,
    };
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação para ${phoneNumber}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ============================================
// TEMPLATES DE MENSAGENS
// ============================================

export function getVerificationTemplate(code: string): string {
  return `🌿 Planta & Raiz\n\nSeu código de verificação é: ${code}\n\nVálido por 10 minutos.\n\nNunca compartilhe este código.`;
}

export function getTransactionNotificationTemplate(
  type: 'subscription' | 'commission' | 'withdrawal',
  amount: number,
  status: string
): string {
  const emoji = {
    subscription: '💳',
    commission: '💰',
    withdrawal: '🏦',
  }[type];

  const typeLabel = {
    subscription: 'Assinatura',
    commission: 'Comissão',
    withdrawal: 'Saque',
  }[type];

  return `${emoji} Planta & Raiz\n\n${typeLabel} de R$ ${amount.toFixed(2)}\nStatus: ${status}\n\nObrigado por usar Planta & Raiz!`;
}

export function getFollowUpTemplate(
  daysSincePurchase: number,
  patientName: string
): string {
  if (daysSincePurchase === 7) {
    return `🏥 Planta & Raiz\n\nOlá ${patientName}!\n\nComo você está se sentindo após 7 dias?\n\nClique aqui para fazer uma avaliação: https://plantaraiz.com.br/followup/7d`;
  } else if (daysSincePurchase === 30) {
    return `🏥 Planta & Raiz\n\nOlá ${patientName}!\n\nJá faz 30 dias! Como está sua recuperação?\n\nClique aqui para fazer uma avaliação: https://plantaraiz.com.br/followup/30d`;
  }
  return '';
}

export function getSmartRefillTemplate(
  medicationName: string,
  daysUntilEmpty: number
): string {
  return `💊 Planta & Raiz\n\nSeu medicamento ${medicationName} vai acabar em ${daysUntilEmpty} dias.\n\nDeseja renovar a prescrição?\n\nClique aqui: https://plantaraiz.com.br/refill`;
}

export function getSecurityAlertTemplate(alertType: string): string {
  return `🔒 Planta & Raiz - Alerta de Segurança\n\n${alertType}\n\nSe não foi você, altere sua senha imediatamente.`;
}

// ============================================
// VERIFICAÇÃO DE CÓDIGO
// ============================================

export function verifyCode(
  inputCode: string,
  storedCode: VerificationCode
): { valid: boolean; error?: string } {
  // Verificar se expirou
  if (new Date() > storedCode.expiresAt) {
    return { valid: false, error: 'Código expirado' };
  }

  // Verificar tentativas
  if (storedCode.attempts >= storedCode.maxAttempts) {
    return { valid: false, error: 'Máximo de tentativas excedido' };
  }

  // Verificar código
  if (inputCode !== storedCode.code) {
    storedCode.attempts++;
    return { valid: false, error: 'Código inválido' };
  }

  return { valid: true };
}

// ============================================
// ENVIO EM MASSA (PARA FOLLOW-UPS)
// ============================================

export async function sendBulkFollowUpMessages(
  recipients: Array<{
    phoneNumber: string;
    patientName: string;
    daysSincePurchase: number;
  }>,
  config: TwilioConfig
): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ phoneNumber: string; error: string }>;
}> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ phoneNumber: string; error: string }>,
  };

  for (const recipient of recipients) {
    const message = getFollowUpTemplate(
      recipient.daysSincePurchase,
      recipient.patientName
    );

    const result = await sendWhatsAppNotification(
      recipient.phoneNumber,
      {
        to: recipient.phoneNumber,
        message,
        type: 'followup',
      },
      config
    );

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({
        phoneNumber: recipient.phoneNumber,
        error: result.error || 'Erro desconhecido',
      });
    }

    // Rate limiting: 1 mensagem por segundo
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// ============================================
// WEBHOOK PARA RESPOSTAS WHATSAPP
// ============================================

export interface WhatsAppWebhookPayload {
  SmsMessageSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
}

export function parseWhatsAppWebhook(
  payload: WhatsAppWebhookPayload
): {
  from: string;
  message: string;
  timestamp: Date;
} {
  return {
    from: payload.From.replace('whatsapp:', ''),
    message: payload.Body,
    timestamp: new Date(),
  };
}

// ============================================
// VALIDAÇÃO DE NÚMERO WHATSAPP
// ============================================

export function validateWhatsAppNumber(phoneNumber: string): boolean {
  // Formato: +55 (Brasil) + 11 dígitos
  const brazilianPhoneRegex = /^\+?55\d{11}$/;
  return brazilianPhoneRegex.test(phoneNumber.replace(/\D/g, ''));
}

export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remove caracteres especiais
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Se não tem +55, adiciona
  if (!cleaned.startsWith('55')) {
    return `+55${cleaned}`;
  }

  return `+${cleaned}`;
}

// ============================================
// LOGGING E AUDITORIA
// ============================================

export interface MessageLog {
  id: string;
  phoneNumber: string;
  messageType: string;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  messageSid?: string;
  timestamp: Date;
  error?: string;
}

export function createMessageLog(
  phoneNumber: string,
  messageType: string,
  status: 'sent' | 'failed' | 'delivered' | 'read',
  messageSid?: string,
  error?: string
): MessageLog {
  return {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    phoneNumber,
    messageType,
    status,
    messageSid,
    timestamp: new Date(),
    error,
  };
}
