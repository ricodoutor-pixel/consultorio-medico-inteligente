import webpush from 'web-push';

// Configurar Web Push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${process.env.OWNER_EMAIL || 'admin@plantaeraiz.com'}`,
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

/**
 * Enviar notificação push para um usuário
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/badge-72x72.png',
          tag: payload.tag || 'notification',
          requireInteraction: payload.requireInteraction || false,
          actions: payload.actions || [],
        },
        data: payload.data || {},
      })
    );

    console.log('[Push] Notificação enviada com sucesso');
    return true;
  } catch (error: any) {
    if (error.statusCode === 410) {
      console.log('[Push] Subscription expirada, removendo...');
      return false;
    }
    console.error('[Push] Erro ao enviar notificação:', error);
    return false;
  }
}

/**
 * Enviar notificação para múltiplos usuários
 */
export async function sendBulkPushNotifications(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const result = await sendPushNotification(subscription, payload);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Notificação de nova consulta agendada
 */
export function createConsultationNotification(
  professionalName: string,
  date: string,
  time: string
): NotificationPayload {
  return {
    title: '📅 Consulta Agendada',
    body: `Sua consulta com ${professionalName} está marcada para ${date} às ${time}`,
    icon: '/icon-consultation.png',
    tag: 'consultation',
    data: {
      type: 'consultation',
      action: 'open_consultation',
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir Consulta',
        icon: '/icon-open.png',
      },
      {
        action: 'reschedule',
        title: 'Reagendar',
        icon: '/icon-reschedule.png',
      },
    ],
  };
}

/**
 * Notificação de nova mensagem
 */
export function createMessageNotification(
  senderName: string,
  message: string
): NotificationPayload {
  return {
    title: `💬 Mensagem de ${senderName}`,
    body: message.substring(0, 100),
    icon: '/icon-message.png',
    tag: 'message',
    requireInteraction: false,
    data: {
      type: 'message',
      action: 'open_chat',
    },
  };
}

/**
 * Notificação de lembrete de medicação
 */
export function createMedicationReminderNotification(
  medicationName: string,
  dosage: string
): NotificationPayload {
  return {
    title: '💊 Lembrete de Medicação',
    body: `Hora de tomar ${dosage} de ${medicationName}`,
    icon: '/icon-medication.png',
    tag: 'medication',
    requireInteraction: true,
    data: {
      type: 'medication',
      action: 'mark_taken',
    },
    actions: [
      {
        action: 'taken',
        title: 'Tomei',
        icon: '/icon-check.png',
      },
      {
        action: 'snooze',
        title: 'Lembrar depois',
        icon: '/icon-snooze.png',
      },
    ],
  };
}

/**
 * Notificação de pagamento confirmado
 */
export function createPaymentConfirmedNotification(
  amount: number,
  type: string
): NotificationPayload {
  return {
    title: '✅ Pagamento Confirmado',
    body: `R$ ${amount.toFixed(2)} - ${type}`,
    icon: '/icon-payment.png',
    tag: 'payment',
    data: {
      type: 'payment',
      action: 'view_receipt',
    },
  };
}

/**
 * Notificação de prescrição disponível
 */
export function createPrescriptionAvailableNotification(
  professionalName: string
): NotificationPayload {
  return {
    title: '📋 Prescrição Disponível',
    body: `Sua prescrição de ${professionalName} está pronta para visualizar`,
    icon: '/icon-prescription.png',
    tag: 'prescription',
    data: {
      type: 'prescription',
      action: 'view_prescription',
    },
    actions: [
      {
        action: 'view',
        title: 'Visualizar',
        icon: '/icon-view.png',
      },
      {
        action: 'download',
        title: 'Baixar',
        icon: '/icon-download.png',
      },
    ],
  };
}

/**
 * Notificação de especialista online
 */
export function createSpecialistOnlineNotification(
  specialistName: string,
  specialty: string
): NotificationPayload {
  return {
    title: '🟢 Especialista Online',
    body: `${specialistName} (${specialty}) está disponível agora`,
    icon: '/icon-specialist.png',
    tag: 'specialist',
    data: {
      type: 'specialist',
      action: 'schedule_consultation',
    },
    actions: [
      {
        action: 'schedule',
        title: 'Agendar',
        icon: '/icon-schedule.png',
      },
    ],
  };
}

/**
 * Notificação de review/avaliação
 */
export function createReviewNotification(
  reviewerName: string,
  rating: number
): NotificationPayload {
  return {
    title: `⭐ Nova Avaliação (${rating}/5)`,
    body: `${reviewerName} avaliou seu atendimento`,
    icon: '/icon-review.png',
    tag: 'review',
    data: {
      type: 'review',
      action: 'view_review',
    },
  };
}

/**
 * Notificação de promoção/oferta
 */
export function createPromotionNotification(
  title: string,
  discount: number
): NotificationPayload {
  return {
    title: `🎉 ${title}`,
    body: `Aproveite ${discount}% de desconto agora`,
    icon: '/icon-promotion.png',
    tag: 'promotion',
    data: {
      type: 'promotion',
      action: 'view_offer',
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Oferta',
        icon: '/icon-view.png',
      },
    ],
  };
}

/**
 * Gerar chaves VAPID (executar uma única vez)
 */
export function generateVapidKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('VAPID Public Key:', vapidKeys.publicKey);
  console.log('VAPID Private Key:', vapidKeys.privateKey);
  return vapidKeys;
}
