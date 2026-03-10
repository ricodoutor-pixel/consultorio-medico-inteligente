/**
 * Serviço de Notificações em Tempo Real
 * Implementa Web Push API para alertas de consultas, mensagens e lembretes
 */

export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  requireInteraction: boolean;
  actions: Array<{
    action: string;
    title: string;
    icon: string;
  }>;
  data: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

export interface PushSubscription {
  userId: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date;
}

class RealtimeNotificationsService {
  private vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
  private vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

  /**
   * Registra subscription de push notification
   */
  async registerPushSubscription(
    userId: string,
    subscription: any,
    userAgent: string
  ): Promise<PushSubscription> {
    try {
      const pushSubscription: PushSubscription = {
        userId,
        subscription,
        userAgent,
        isActive: true,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      // TODO: Salvar no banco de dados
      console.log(`[PUSH] Subscription registrada para usuário: ${userId}`);
      return pushSubscription;
    } catch (error) {
      throw new Error(`Falha ao registrar subscription: ${error}`);
    }
  }

  /**
   * Envia notificação de consulta agendada
   */
  async sendConsultationNotification(data: {
    userId: string;
    patientName: string;
    professionalName: string;
    consultationDate: Date;
    jitsiLink: string;
  }): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `notif_${Date.now()}`,
        userId: data.userId,
        title: '📅 Consulta Agendada',
        body: `Sua consulta com ${data.professionalName} está marcada para ${data.consultationDate.toLocaleString('pt-BR')}`,
        icon: '/icons/consultation.png',
        badge: '/icons/badge.png',
        tag: `consultation_${data.userId}`,
        requireInteraction: true,
        actions: [
          {
            action: 'open_consultation',
            title: 'Abrir Consulta',
            icon: '/icons/open.png',
          },
          {
            action: 'reschedule',
            title: 'Reagendar',
            icon: '/icons/reschedule.png',
          },
        ],
        data: {
          consultationDate: data.consultationDate.toISOString(),
          jitsiLink: data.jitsiLink,
          professionalName: data.professionalName,
        },
        timestamp: new Date(),
        read: false,
      };

      await this.sendPushNotification(data.userId, notification);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar notificação de consulta: ${error}`);
      return false;
    }
  }

  /**
   * Envia notificação de nova mensagem
   */
  async sendMessageNotification(data: {
    recipientId: string;
    senderName: string;
    messagePreview: string;
    conversationId: string;
  }): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `notif_${Date.now()}`,
        userId: data.recipientId,
        title: `💬 Mensagem de ${data.senderName}`,
        body: data.messagePreview.substring(0, 100),
        icon: '/icons/message.png',
        badge: '/icons/badge.png',
        tag: `message_${data.conversationId}`,
        requireInteraction: false,
        actions: [
          {
            action: 'open_chat',
            title: 'Abrir Chat',
            icon: '/icons/chat.png',
          },
        ],
        data: {
          conversationId: data.conversationId,
          senderName: data.senderName,
        },
        timestamp: new Date(),
        read: false,
      };

      await this.sendPushNotification(data.recipientId, notification);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar notificação de mensagem: ${error}`);
      return false;
    }
  }

  /**
   * Envia lembrete de medicação
   */
  async sendMedicationReminder(data: {
    userId: string;
    medicationName: string;
    dosage: string;
    frequency: string;
  }): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `notif_${Date.now()}`,
        userId: data.userId,
        title: '💊 Lembrete de Medicação',
        body: `Hora de tomar ${data.medicationName} - ${data.dosage} (${data.frequency})`,
        icon: '/icons/medication.png',
        badge: '/icons/badge.png',
        tag: `medication_${data.userId}`,
        requireInteraction: true,
        actions: [
          {
            action: 'mark_taken',
            title: 'Marcar como Tomado',
            icon: '/icons/check.png',
          },
          {
            action: 'snooze',
            title: 'Lembrar em 1 hora',
            icon: '/icons/snooze.png',
          },
        ],
        data: {
          medicationName: data.medicationName,
          dosage: data.dosage,
          frequency: data.frequency,
        },
        timestamp: new Date(),
        read: false,
      };

      await this.sendPushNotification(data.userId, notification);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar lembrete de medicação: ${error}`);
      return false;
    }
  }

  /**
   * Envia notificação de prescrição pronta
   */
  async sendPrescriptionReadyNotification(data: {
    userId: string;
    prescriptionId: string;
    pharmacyName: string;
    pickupAddress: string;
  }): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `notif_${Date.now()}`,
        userId: data.userId,
        title: '✅ Prescrição Pronta',
        body: `Sua prescrição está pronta para retirada em ${data.pharmacyName}`,
        icon: '/icons/prescription.png',
        badge: '/icons/badge.png',
        tag: `prescription_${data.prescriptionId}`,
        requireInteraction: true,
        actions: [
          {
            action: 'view_details',
            title: 'Ver Detalhes',
            icon: '/icons/details.png',
          },
          {
            action: 'directions',
            title: 'Ir para Farmácia',
            icon: '/icons/map.png',
          },
        ],
        data: {
          prescriptionId: data.prescriptionId,
          pharmacyName: data.pharmacyName,
          pickupAddress: data.pickupAddress,
        },
        timestamp: new Date(),
        read: false,
      };

      await this.sendPushNotification(data.userId, notification);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar notificação de prescrição: ${error}`);
      return false;
    }
  }

  /**
   * Envia notificação de pagamento confirmado
   */
  async sendPaymentConfirmedNotification(data: {
    userId: string;
    amount: number;
    transactionId: string;
    paymentMethod: string;
  }): Promise<boolean> {
    try {
      const notification: PushNotification = {
        id: `notif_${Date.now()}`,
        userId: data.userId,
        title: '💳 Pagamento Confirmado',
        body: `Pagamento de R$ ${data.amount.toFixed(2)} via ${data.paymentMethod} foi confirmado`,
        icon: '/icons/payment.png',
        badge: '/icons/badge.png',
        tag: `payment_${data.transactionId}`,
        requireInteraction: false,
        actions: [
          {
            action: 'view_receipt',
            title: 'Ver Recibo',
            icon: '/icons/receipt.png',
          },
        ],
        data: {
          transactionId: data.transactionId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        },
        timestamp: new Date(),
        read: false,
      };

      await this.sendPushNotification(data.userId, notification);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar notificação de pagamento: ${error}`);
      return false;
    }
  }

  /**
   * Envia notificação genérica
   */
  async sendPushNotification(userId: string, notification: PushNotification): Promise<boolean> {
    try {
      // TODO: Integrar com Web Push API
      // const subscriptions = await db.query('SELECT * FROM push_subscriptions WHERE userId = ?', [userId]);
      // for (const sub of subscriptions) {
      //   await webpush.sendNotification(sub.subscription, JSON.stringify({
      //     title: notification.title,
      //     body: notification.body,
      //     icon: notification.icon,
      //     badge: notification.badge,
      //     tag: notification.tag,
      //     requireInteraction: notification.requireInteraction,
      //     actions: notification.actions,
      //     data: notification.data,
      //   }));
      // }

      console.log(`[PUSH] Notificação enviada para ${userId}: ${notification.title}`);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar push notification: ${error}`);
      return false;
    }
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      // TODO: Atualizar no banco de dados
      console.log(`[PUSH] Notificação marcada como lida: ${notificationId}`);
      return true;
    } catch (error) {
      console.error(`Erro ao marcar notificação como lida: ${error}`);
      return false;
    }
  }

  /**
   * Busca notificações não lidas
   */
  async getUnreadNotifications(userId: string): Promise<PushNotification[]> {
    try {
      // TODO: Buscar do banco de dados
      return [];
    } catch (error) {
      console.error(`Erro ao buscar notificações: ${error}`);
      return [];
    }
  }

  /**
   * Remove subscription inativa
   */
  async removeInactiveSubscription(userId: string): Promise<boolean> {
    try {
      // TODO: Remover do banco de dados
      console.log(`[PUSH] Subscription removida para usuário: ${userId}`);
      return true;
    } catch (error) {
      console.error(`Erro ao remover subscription: ${error}`);
      return false;
    }
  }

  /**
   * Envia notificação em lote
   */
  async sendBatchNotifications(
    userIds: string[],
    notification: Omit<PushNotification, 'id' | 'userId' | 'timestamp' | 'read'>
  ): Promise<number> {
    try {
      let successCount = 0;

      for (const userId of userIds) {
        const fullNotification: PushNotification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random()}`,
          userId,
          timestamp: new Date(),
          read: false,
        };

        if (await this.sendPushNotification(userId, fullNotification)) {
          successCount++;
        }
      }

      console.log(`[PUSH] ${successCount}/${userIds.length} notificações enviadas`);
      return successCount;
    } catch (error) {
      console.error(`Erro ao enviar notificações em lote: ${error}`);
      return 0;
    }
  }
}

export default new RealtimeNotificationsService();
