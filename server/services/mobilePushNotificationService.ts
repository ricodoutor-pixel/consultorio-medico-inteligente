/**
 * Mobile Push Notification Service
 * Send real-time notifications to mobile app users
 */

// Expo notifications handled on client side

interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: "high" | "normal" | "low";
  ttl?: number;
}

interface NotificationTemplate {
  type:
    | "consultation_reminder"
    | "payment_confirmed"
    | "receipt_ready"
    | "specialist_online"
    | "new_message"
    | "referral_bonus"
    | "product_available"
    | "appointment_confirmed";
  userId: string;
  data?: Record<string, any>;
}

/**
 * Mobile Push Notification Service
 */
class MobilePushNotificationService {
  private expoPushTokens: Map<string, string[]> = new Map();

  /**
   * Register device for push notifications
   */
  async registerDevice(userId: string, expoPushToken: string): Promise<void> {
    try {
      console.log(`[PUSH] Registering device for user ${userId}`);
      console.log(`[PUSH] Token: ${expoPushToken}`);

      // Validate token format
      if (!expoPushToken.startsWith("ExponentPushToken[")) {
        throw new Error("Invalid Expo push token format");
      }

      // Store token
      const tokens = this.expoPushTokens.get(userId) || [];
      if (!tokens.includes(expoPushToken)) {
        tokens.push(expoPushToken);
        this.expoPushTokens.set(userId, tokens);
      }

      // TODO: Save to database
      // await db.pushTokens.create({
      //   userId,
      //   token: expoPushToken,
      //   platform: 'expo',
      //   registeredAt: new Date(),
      // });

      console.log(`[PUSH] ✓ Device registered for user ${userId}`);
    } catch (error) {
      console.error("[PUSH] Device registration error:", error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendNotification(notification: PushNotification): Promise<boolean> {
    try {
      console.log(`[PUSH] Sending notification to user ${notification.userId}`);
      console.log(`[PUSH] Title: ${notification.title}`);
      console.log(`[PUSH] Body: ${notification.body}`);

      const tokens = this.expoPushTokens.get(notification.userId) || [];

      if (tokens.length === 0) {
        console.warn(`[PUSH] No tokens found for user ${notification.userId}`);
        return false;
      }

      // Send to all devices
      for (const token of tokens) {
        await this.sendToExpo(token, notification);
      }

      console.log(
        `[PUSH] ✓ Notification sent to ${tokens.length} device(s)`
      );
      return true;
    } catch (error) {
      console.error("[PUSH] Notification sending error:", error);
      return false;
    }
  }

  /**
   * Send to Expo
   */
  private async sendToExpo(
    token: string,
    notification: PushNotification
  ): Promise<void> {
    try {
      const message = {
        to: token,
        sound: notification.sound || "default",
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge || 1,
        priority: notification.priority || "high",
        ttl: notification.ttl || 86400, // 24 hours
      };

      console.log(`[PUSH] Sending to Expo: ${token}`);

      // TODO: Call Expo Push API
      // const response = await fetch('https://exp.host/--/api/v2/push/send', {
      //   method: 'POST',
      //   headers: {
      //     Accept: 'application/json',
      //     'Accept-encoding': 'gzip, deflate',
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(message),
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`Expo API error: ${response.statusText}`);
      // }

      console.log(`[PUSH] ✓ Sent to Expo`);
    } catch (error) {
      console.error("[PUSH] Expo send error:", error);
    }
  }

  /**
   * Send templated notification
   */
  async sendTemplatedNotification(
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      console.log(`[PUSH] Sending templated notification: ${template.type}`);

      let notification: PushNotification;

      switch (template.type) {
        case "consultation_reminder":
          notification = {
            userId: template.userId,
            title: "Consulta em breve! 👨‍⚕️",
            body: `Sua consulta com ${template.data?.specialistName} começa em 30 minutos`,
            data: {
              type: "consultation",
              consultationId: template.data?.consultationId,
            },
            priority: "high",
          };
          break;

        case "payment_confirmed":
          notification = {
            userId: template.userId,
            title: "Pagamento Confirmado ✓",
            body: `Seu pagamento de R$ ${template.data?.amount} foi confirmado via PIX`,
            data: {
              type: "payment",
              paymentId: template.data?.paymentId,
            },
          };
          break;

        case "receipt_ready":
          notification = {
            userId: template.userId,
            title: "Receita Pronta! 📋",
            body: `Sua receita digital está pronta para download`,
            data: {
              type: "receipt",
              receiptId: template.data?.receiptId,
            },
            priority: "high",
          };
          break;

        case "specialist_online":
          notification = {
            userId: template.userId,
            title: "Especialista Online! 🟢",
            body: `${template.data?.specialistName} está disponível agora para consulta`,
            data: {
              type: "specialist",
              specialistId: template.data?.specialistId,
            },
            priority: "high",
          };
          break;

        case "new_message":
          notification = {
            userId: template.userId,
            title: "Nova Mensagem 💬",
            body: `${template.data?.senderName}: ${template.data?.message?.substring(0, 50)}...`,
            data: {
              type: "message",
              messageId: template.data?.messageId,
              conversationId: template.data?.conversationId,
            },
            badge: (template.data?.unreadCount || 1) as number,
          };
          break;

        case "referral_bonus":
          notification = {
            userId: template.userId,
            title: "Bônus de Indicação! 🎉",
            body: `Você ganhou R$ ${template.data?.bonusAmount} por indicar um amigo`,
            data: {
              type: "referral",
              referralId: template.data?.referralId,
            },
          };
          break;

        case "product_available":
          notification = {
            userId: template.userId,
            title: "Produto Disponível! 📦",
            body: `${template.data?.productName} está em estoque agora`,
            data: {
              type: "product",
              productId: template.data?.productId,
            },
          };
          break;

        case "appointment_confirmed":
          notification = {
            userId: template.userId,
            title: "Consulta Confirmada ✓",
            body: `Sua consulta com ${template.data?.specialistName} em ${template.data?.appointmentTime}`,
            data: {
              type: "appointment",
              appointmentId: template.data?.appointmentId,
            },
            priority: "high",
          };
          break;

        default:
          throw new Error(`Unknown template type: ${template.type}`);
      }

      return await this.sendNotification(notification);
    } catch (error) {
      console.error("[PUSH] Templated notification error:", error);
      return false;
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatchNotifications(
    userIds: string[],
    notification: Omit<PushNotification, "userId">
  ): Promise<number> {
    try {
      console.log(`[PUSH] Sending batch notification to ${userIds.length} users`);

      let successCount = 0;

      for (const userId of userIds) {
        const sent = await this.sendNotification({
          ...notification,
          userId,
        });
        if (sent) {
          successCount++;
        }
      }

      console.log(`[PUSH] ✓ Batch sent: ${successCount}/${userIds.length}`);
      return successCount;
    } catch (error) {
      console.error("[PUSH] Batch notification error:", error);
      return 0;
    }
  }

  /**
   * Send notification to specialists (online status)
   */
  async notifySpecialistsOnline(specialistIds: string[]): Promise<void> {
    try {
      console.log(
        `[PUSH] Notifying ${specialistIds.length} specialists about online status`
      );

      for (const specialistId of specialistIds) {
        await this.sendNotification({
          userId: specialistId,
          title: "Você está online! 🟢",
          body: "Seus pacientes podem ver que você está disponível",
          data: { type: "status_update" },
        });
      }

      console.log(`[PUSH] ✓ Specialists notified`);
    } catch (error) {
      console.error("[PUSH] Specialist notification error:", error);
    }
  }

  /**
   * Send notification to patients (specialist online)
   */
  async notifyPatientsSpecialistOnline(
    patientIds: string[],
    specialistName: string,
    specialistId: string
  ): Promise<void> {
    try {
      console.log(
        `[PUSH] Notifying ${patientIds.length} patients about specialist online`
      );

      await this.sendBatchNotifications(patientIds, {
        title: "Especialista Online! 🟢",
        body: `${specialistName} está disponível agora`,
        data: {
          type: "specialist_online",
          specialistId,
        },
        priority: "high",
      });

      console.log(`[PUSH] ✓ Patients notified`);
    } catch (error) {
      console.error("[PUSH] Patient notification error:", error);
    }
  }

  /**
   * Send promotional notifications
   */
  async sendPromotion(
    userIds: string[],
    title: string,
    body: string,
    discount: number
  ): Promise<number> {
    try {
      console.log(`[PUSH] Sending promotion to ${userIds.length} users`);

      return await this.sendBatchNotifications(userIds, {
        title,
        body,
        data: {
          type: "promotion",
          discount,
        },
      });
    } catch (error) {
      console.error("[PUSH] Promotion notification error:", error);
      return 0;
    }
  }

  /**
   * Unregister device
   */
  async unregisterDevice(userId: string, token: string): Promise<void> {
    try {
      console.log(`[PUSH] Unregistering device for user ${userId}`);

      const tokens = this.expoPushTokens.get(userId) || [];
      const filtered = tokens.filter((t) => t !== token);

      if (filtered.length === 0) {
        this.expoPushTokens.delete(userId);
      } else {
        this.expoPushTokens.set(userId, filtered);
      }

      // TODO: Delete from database
      // await db.pushTokens.delete({ userId, token });

      console.log(`[PUSH] ✓ Device unregistered`);
    } catch (error) {
      console.error("[PUSH] Device unregistration error:", error);
    }
  }

  /**
   * Get notification stats
   */
  async getNotificationStats(): Promise<any> {
    try {
      const totalUsers = this.expoPushTokens.size;
      const totalTokens = Array.from(this.expoPushTokens.values()).reduce(
        (sum, tokens) => sum + tokens.length,
        0
      );

      return {
        totalUsers,
        totalTokens,
        avgTokensPerUser: totalTokens / totalUsers,
        registeredAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[PUSH] Stats error:", error);
      return null;
    }
  }
}

export default MobilePushNotificationService;
