import axios from 'axios';

interface WhatsAppMessage {
  phone: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'audio' | 'video';
}

interface WhatsAppConfig {
  businessPhoneId: string;
  accessToken: string;
  apiVersion: string;
}

const WHATSAPP_API_BASE = 'https://graph.instagram.com';

/**
 * Enviar mensagem via WhatsApp
 */
export async function sendWhatsAppMessage(
  msg: WhatsAppMessage,
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  try {
    const url = `${WHATSAPP_API_BASE}/${config.apiVersion}/${config.businessPhoneId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: msg.phone,
      type: 'text',
      text: {
        body: msg.message,
      },
    };

    if (msg.mediaUrl) {
      payload.type = 'image';
      payload.image = {
        link: msg.mediaUrl,
      };
    }

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      messageId: response.data.messages[0].id,
      status: 'sent',
    };
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', error);
    throw new Error('Erro ao enviar mensagem WhatsApp');
  }
}

/**
 * Enviar template de mensagem
 */
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  parameters: Record<string, string>,
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  try {
    const url = `${WHATSAPP_API_BASE}/${config.apiVersion}/${config.businessPhoneId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'pt_BR',
        },
        components: [
          {
            type: 'body',
            parameters: Object.values(parameters).map(value => ({
              type: 'text',
              text: value,
            })),
          },
        ],
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      messageId: response.data.messages[0].id,
      status: 'sent',
    };
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar template:', error);
    throw new Error('Erro ao enviar template WhatsApp');
  }
}

/**
 * Enviar confirmação de consulta
 */
export async function sendConsultationConfirmation(
  phone: string,
  consultationData: {
    patientName: string;
    professionalName: string;
    date: string;
    time: string;
    link: string;
  },
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  const message = `
Olá ${consultationData.patientName}! 🎉

Sua consulta foi confirmada!

👨‍⚕️ Profissional: ${consultationData.professionalName}
📅 Data: ${consultationData.date}
⏰ Horário: ${consultationData.time}

🔗 Link da consulta: ${consultationData.link}

Qualquer dúvida, entre em contato conosco!

Planta & Raiz 🌿
  `.trim();

  return sendWhatsAppMessage({ phone, message }, config);
}

/**
 * Enviar lembrete de consulta
 */
export async function sendConsultationReminder(
  phone: string,
  consultationData: {
    patientName: string;
    professionalName: string;
    date: string;
    time: string;
    link: string;
  },
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  const message = `
Oi ${consultationData.patientName}! ⏰

Lembrete: Sua consulta é hoje!

👨‍⚕️ Com: ${consultationData.professionalName}
⏰ Horário: ${consultationData.time}

🔗 Acesse aqui: ${consultationData.link}

Até logo! 😊
  `.trim();

  return sendWhatsAppMessage({ phone, message }, config);
}

/**
 * Enviar notificação de pagamento confirmado
 */
export async function sendPaymentConfirmation(
  phone: string,
  paymentData: {
    userName: string;
    amount: number;
    type: string;
    transactionId: string;
  },
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  const message = `
✅ Pagamento Confirmado!

Olá ${paymentData.userName}!

Seu pagamento foi processado com sucesso.

💰 Valor: R$ ${paymentData.amount.toFixed(2)}
📝 Tipo: ${paymentData.type}
🔑 ID: ${paymentData.transactionId}

Obrigado por confiar em nós! 🙏

Planta & Raiz 🌿
  `.trim();

  return sendWhatsAppMessage({ phone, message }, config);
}

/**
 * Enviar suporte ao cliente
 */
export async function sendSupportMessage(
  phone: string,
  supportData: {
    userName: string;
    issue: string;
    ticketId: string;
  },
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  const message = `
📞 Suporte Planta & Raiz

Olá ${supportData.userName}!

Recebemos sua mensagem sobre: ${supportData.issue}

🎫 Ticket: ${supportData.ticketId}

Nossa equipe está analisando e retornaremos em breve.

Obrigado pela paciência! 🙏

Planta & Raiz 🌿
  `.trim();

  return sendWhatsAppMessage({ phone, message }, config);
}

/**
 * Enviar prescrição digital via WhatsApp
 */
export async function sendPrescriptionLink(
  phone: string,
  prescriptionData: {
    patientName: string;
    professionalName: string;
    prescriptionLink: string;
  },
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  const message = `
📋 Sua Prescrição Digital

Olá ${prescriptionData.patientName}!

Sua prescrição de ${prescriptionData.professionalName} está pronta!

🔗 Acesse aqui: ${prescriptionData.prescriptionLink}

Você pode:
✓ Visualizar e compartilhar
✓ Baixar em PDF
✓ Enviar para farmácias

Qualquer dúvida, nos contate! 😊

Planta & Raiz 🌿
  `.trim();

  return sendWhatsAppMessage({ phone, message }, config);
}

/**
 * Enviar link de referência
 */
export async function sendReferralLink(
  phone: string,
  referralData: {
    userName: string;
    referralCode: string;
    referralLink: string;
    commission: string;
  },
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  const message = `
🎁 Ganhe Comissões!

Olá ${referralData.userName}!

Compartilhe seu código de referência e ganhe ${referralData.commission}!

📌 Seu código: ${referralData.referralCode}

🔗 Link: ${referralData.referralLink}

Cada amigo que se cadastrar usando seu código, você ganha comissão! 💰

Comece a compartilhar agora! 🚀

Planta & Raiz 🌿
  `.trim();

  return sendWhatsAppMessage({ phone, message }, config);
}

/**
 * Enviar feedback request
 */
export async function sendFeedbackRequest(
  phone: string,
  feedbackData: {
    userName: string;
    consultationId: string;
    feedbackLink: string;
  },
  config: WhatsAppConfig
): Promise<{ messageId: string; status: string }> {
  const message = `
⭐ Sua Opinião Importa!

Olá ${feedbackData.userName}!

Gostaríamos de saber sua experiência com nossa plataforma.

🔗 Deixe seu feedback: ${feedbackData.feedbackLink}

Sua avaliação nos ajuda a melhorar! 🙏

Obrigado! 😊

Planta & Raiz 🌿
  `.trim();

  return sendWhatsAppMessage({ phone, message }, config);
}

/**
 * Processar webhook de mensagens recebidas
 */
export function processIncomingMessage(payload: any): {
  phone: string;
  message: string;
  timestamp: number;
  messageId: string;
} | null {
  try {
    const message = payload.entry[0]?.changes[0]?.value?.messages[0];
    const contact = payload.entry[0]?.changes[0]?.value?.contacts[0];

    if (!message || !contact) return null;

    return {
      phone: contact.wa_id,
      message: message.text?.body || '',
      timestamp: parseInt(message.timestamp),
      messageId: message.id,
    };
  } catch (error) {
    console.error('[WhatsApp] Erro ao processar webhook:', error);
    return null;
  }
}

/**
 * Validar webhook do WhatsApp
 */
export function validateWhatsAppWebhook(
  token: string,
  verifyToken: string
): boolean {
  return token === verifyToken;
}
