/**
 * Twilio Integration Service
 * Handles WhatsApp messages, SMS, and voice calls
 * 
 * Environment Variables Required:
 * - TWILIO_ACCOUNT_SID: Account SID (server-side only)
 * - TWILIO_AUTH_TOKEN: Auth token (server-side only)
 * - TWILIO_WHATSAPP_NUMBER: WhatsApp business number (e.g., +5511987131241)
 * - TWILIO_SMS_NUMBER: SMS number (e.g., +5511987131241)
 */

interface VerificationCodeData {
  phoneNumber: string;
  userId: string;
  codeLength?: number;
  expirationMinutes?: number;
}

interface VerificationCodeResponse {
  success: boolean;
  verificationSid?: string;
  message: string;
  expiresAt?: string;
}

interface VerifyCodeData {
  phoneNumber: string;
  code: string;
  verificationSid: string;
}

interface VerifyCodeResponse {
  success: boolean;
  verified: boolean;
  message: string;
}

interface WhatsAppMessageData {
  phoneNumber: string;
  message: string;
  templateName?: string;
  variables?: Record<string, string>;
}

interface WhatsAppMessageResponse {
  success: boolean;
  messageSid?: string;
  status?: string;
  message: string;
  sentAt?: string;
}

interface SMSMessageData {
  phoneNumber: string;
  message: string;
}

interface SMSMessageResponse {
  success: boolean;
  messageSid?: string;
  status?: string;
  message: string;
  sentAt?: string;
}

interface VoiceCallData {
  phoneNumber: string;
  message: string;
  language?: string;
}

interface VoiceCallResponse {
  success: boolean;
  callSid?: string;
  status?: string;
  message: string;
  startedAt?: string;
}

interface NotificationData {
  phoneNumber: string;
  type: 'verification' | 'transaction' | 'followup' | 'smartrefill' | 'alert';
  content: {
    title: string;
    body: string;
    actionUrl?: string;
  };
}

/**
 * Send verification code via WhatsApp
 */
export async function sendVerificationCode(data: VerificationCodeData): Promise<VerificationCodeResponse> {
  try {
    const response = await fetch('/api/twilio/verification/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        userId: data.userId,
        codeLength: data.codeLength || 6,
        expirationMinutes: data.expirationMinutes || 10,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Verification code send failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      verificationSid: result.verificationSid,
      message: 'Verification code sent successfully',
      expiresAt: result.expiresAt,
    };
  } catch (error) {
    console.error('[Twilio] Verification code send error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send verification code',
    };
  }
}

/**
 * Verify code sent via WhatsApp
 */
export async function verifyCode(data: VerifyCodeData): Promise<VerifyCodeResponse> {
  try {
    const response = await fetch('/api/twilio/verification/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        code: data.code,
        verificationSid: data.verificationSid,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Code verification failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      verified: result.verified,
      message: result.verified ? 'Code verified successfully' : 'Invalid code',
    };
  } catch (error) {
    console.error('[Twilio] Code verification error:', error);
    return {
      success: false,
      verified: false,
      message: error instanceof Error ? error.message : 'Failed to verify code',
    };
  }
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsAppMessage(data: WhatsAppMessageData): Promise<WhatsAppMessageResponse> {
  try {
    const response = await fetch('/api/twilio/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        message: data.message,
        templateName: data.templateName,
        variables: data.variables,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp message send failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageSid: result.messageSid,
      status: result.status,
      message: 'WhatsApp message sent successfully',
      sentAt: result.sentAt,
    };
  } catch (error) {
    console.error('[Twilio] WhatsApp message send error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Send SMS message
 */
export async function sendSMSMessage(data: SMSMessageData): Promise<SMSMessageResponse> {
  try {
    const response = await fetch('/api/twilio/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        message: data.message,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`SMS message send failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageSid: result.messageSid,
      status: result.status,
      message: 'SMS message sent successfully',
      sentAt: result.sentAt,
    };
  } catch (error) {
    console.error('[Twilio] SMS message send error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send SMS message',
    };
  }
}

/**
 * Make voice call with message
 */
export async function makeVoiceCall(data: VoiceCallData): Promise<VoiceCallResponse> {
  try {
    const response = await fetch('/api/twilio/voice/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        message: data.message,
        language: data.language || 'pt-BR',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Voice call failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      callSid: result.callSid,
      status: result.status,
      message: 'Voice call initiated successfully',
      startedAt: result.startedAt,
    };
  } catch (error) {
    console.error('[Twilio] Voice call error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to make voice call',
    };
  }
}

/**
 * Send notification based on type
 */
export async function sendNotification(data: NotificationData): Promise<WhatsAppMessageResponse | SMSMessageResponse> {
  const templates: Record<string, string> = {
    verification: `🔐 Seu código de verificação é: {code}\n\nVálido por 10 minutos.`,
    transaction: `💳 Transação de R$ {amount} confirmada!\n\nStatus: {status}\nReferência: {reference}`,
    followup: `👋 Como você está?\n\nGostaríamos de saber como foi sua experiência com a Planta & Raiz.\n\nClique aqui para avaliar: {actionUrl}`,
    smartrefill: `💊 Seu medicamento está acabando!\n\n{medicationName} vence em {daysLeft} dias.\n\nRenovar agora: {actionUrl}`,
    alert: `⚠️ Alerta de segurança\n\n{message}\n\nSe não foi você, clique aqui: {actionUrl}`,
  };

  const template = templates[data.type] || templates.verification;

  // Use WhatsApp by default, fallback to SMS
  return sendWhatsAppMessage({
    phoneNumber: data.phoneNumber,
    message: template,
    templateName: data.type,
    variables: data.content as Record<string, string>,
  });
}

/**
 * Send Enfermeira Brisa follow-up (D+7)
 */
export async function sendBrisaFollowUp7Days(data: {
  phoneNumber: string;
  patientName: string;
  consultationDate: string;
  doctorName: string;
}): Promise<WhatsAppMessageResponse> {
  const message = `👋 Olá ${data.patientName}!\n\nComo você está após sua consulta com ${data.doctorName}?\n\nSua avaliação é importante para melhorarmos nosso serviço.\n\n⭐ Avaliar: https://plantayraiz.com.br/feedback/${data.consultationDate}`;

  return sendWhatsAppMessage({
    phoneNumber: data.phoneNumber,
    message,
    templateName: 'brisa_followup_7days',
  });
}

/**
 * Send Enfermeira Brisa follow-up (D+30)
 */
export async function sendBrisaFollowUp30Days(data: {
  phoneNumber: string;
  patientName: string;
  consultationDate: string;
  doctorName: string;
  medicationName: string;
}): Promise<WhatsAppMessageResponse> {
  const message = `👋 Olá ${data.patientName}!\n\nComo você está com o ${data.medicationName}?\n\nSua avaliação após 30 dias é essencial para acompanhamento.\n\n📋 Responder: https://plantayraiz.com.br/feedback/${data.consultationDate}`;

  return sendWhatsAppMessage({
    phoneNumber: data.phoneNumber,
    message,
    templateName: 'brisa_followup_30days',
  });
}

/**
 * Send Smart-Refill reminder (D-5)
 */
export async function sendSmartRefillReminder(data: {
  phoneNumber: string;
  patientName: string;
  medicationName: string;
  daysLeft: number;
  renewalUrl: string;
}): Promise<WhatsAppMessageResponse> {
  const message = `💊 Olá ${data.patientName}!\n\nSeu ${data.medicationName} vence em ${data.daysLeft} dias.\n\n🔄 Renovar agora: ${data.renewalUrl}\n\nOu fale com a Enfermeira Brisa para sugestões.`;

  return sendWhatsAppMessage({
    phoneNumber: data.phoneNumber,
    message,
    templateName: 'smart_refill_reminder',
  });
}

/**
 * Get message status
 */
export async function getMessageStatus(messageSid: string): Promise<{
  success: boolean;
  status?: string;
  message: string;
}> {
  try {
    const response = await fetch(`/api/twilio/messages/${messageSid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get message status: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      status: result.status,
      message: 'Message status retrieved successfully',
    };
  } catch (error) {
    console.error('[Twilio] Get message status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get message status',
    };
  }
}

export default {
  sendVerificationCode,
  verifyCode,
  sendWhatsAppMessage,
  sendSMSMessage,
  makeVoiceCall,
  sendNotification,
  sendBrisaFollowUp7Days,
  sendBrisaFollowUp30Days,
  sendSmartRefillReminder,
  getMessageStatus,
};
