/**
 * Advanced Push Notifications Service
 * Segmentation by behavior, timing, and user preferences
 */

interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag: string;
  timestamp: Date;
  read: boolean;
  action?: string;
  actionUrl?: string;
}

interface UserSegment {
  id: string;
  name: string;
  criteria: {
    lastConsultationDays?: number;
    prescriptionStatus?: 'pending' | 'ready' | 'dispensed';
    consultationFrequency?: 'high' | 'medium' | 'low';
    engagementLevel?: 'active' | 'inactive' | 'at-risk';
  };
}

export class AdvancedPushNotificationsService {
  private segments: Map<string, UserSegment> = new Map();

  constructor() {
    this.initializeSegments();
  }

  private initializeSegments(): void {
    const segments: UserSegment[] = [
      {
        id: 'consultation-reminder',
        name: 'Consultation Reminder',
        criteria: { lastConsultationDays: 30 },
      },
      {
        id: 'prescription-ready',
        name: 'Prescription Ready',
        criteria: { prescriptionStatus: 'ready' },
      },
      {
        id: 'high-engagement',
        name: 'High Engagement Users',
        criteria: { engagementLevel: 'active', consultationFrequency: 'high' },
      },
      {
        id: 'at-risk-churn',
        name: 'At-Risk Churn Users',
        criteria: { engagementLevel: 'at-risk', lastConsultationDays: 60 },
      },
    ];

    segments.forEach(segment => {
      this.segments.set(segment.id, segment);
    });
  }

  /**
   * Send consultation reminder notification
   */
  async sendConsultationReminder(userId: string, consultationDate: Date): Promise<boolean> {
    const hoursUntilConsultation = Math.floor((consultationDate.getTime() - Date.now()) / (1000 * 60 * 60));
    
    if (hoursUntilConsultation <= 24 && hoursUntilConsultation > 0) {
      return await this.sendNotification({
        id: `notif_${Date.now()}`,
        userId,
        title: '📅 Sua consulta está próxima!',
        body: `Sua consulta está marcada para ${consultationDate.toLocaleString('pt-BR')}. Clique para acessar o link de videoconferência.`,
        tag: 'consultation-reminder',
        timestamp: new Date(),
        read: false,
        action: 'open-consultation',
        actionUrl: `/clinic?consultationId=${userId}`,
      });
    }

    return false;
  }

  /**
   * Send prescription ready notification
   */
  async sendPrescriptionReady(userId: string, prescriptionId: string, pharmacyName: string): Promise<boolean> {
    return await this.sendNotification({
      id: `notif_${Date.now()}`,
      userId,
      title: '💊 Sua prescrição está pronta!',
      body: `Sua prescrição está disponível para retirada em ${pharmacyName}. Código: ${prescriptionId.substring(0, 8)}`,
      tag: 'prescription-ready',
      timestamp: new Date(),
      read: false,
      action: 'view-prescription',
      actionUrl: `/prescription/${prescriptionId}`,
    });
  }

  /**
   * Send medication reminder notification
   */
  async sendMedicationReminder(userId: string, medicationName: string, dosage: string): Promise<boolean> {
    return await this.sendNotification({
      id: `notif_${Date.now()}`,
      userId,
      title: '⏰ Hora de tomar sua medicação',
      body: `Lembrete: Tome ${dosage} de ${medicationName} agora.`,
      tag: 'medication-reminder',
      timestamp: new Date(),
      read: false,
      action: 'confirm-medication',
      actionUrl: `/medication-log`,
    });
  }

  /**
   * Send new comment notification
   */
  async sendNewCommentNotification(userId: string, strainName: string, commentAuthor: string): Promise<boolean> {
    return await this.sendNotification({
      id: `notif_${Date.now()}`,
      userId,
      title: '💬 Novo comentário na biblioteca',
      body: `${commentAuthor} comentou sobre ${strainName}. Veja a opinião!`,
      tag: 'new-comment',
      timestamp: new Date(),
      read: false,
      action: 'view-comment',
      actionUrl: `/biblioteca-cientifica/${strainName.toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  /**
   * Send engagement re-activation notification
   */
  async sendReactivationNotification(userId: string, lastConsultationDate: Date): Promise<boolean> {
    const daysSinceConsultation = Math.floor((Date.now() - lastConsultationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceConsultation >= 60) {
      return await this.sendNotification({
        id: `notif_${Date.now()}`,
        userId,
        title: '👋 Sentimos sua falta!',
        body: `Já faz ${daysSinceConsultation} dias que você não consulta. Agende uma nova consulta e receba 20% de desconto!`,
        tag: 'reactivation',
        timestamp: new Date(),
        read: false,
        action: 'schedule-consultation',
        actionUrl: `/clinic?discount=20`,
      });
    }

    return false;
  }

  /**
   * Send segmented campaign notification
   */
  async sendSegmentedNotification(segmentId: string, title: string, body: string): Promise<number> {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      return 0;
    }

    // Get users matching segment criteria
    const users = await this.getUsersBySegment(segment);
    
    let sentCount = 0;
    for (const user of users) {
      const success = await this.sendNotification({
        id: `notif_${Date.now()}_${user.id}`,
        userId: user.id,
        title,
        body,
        tag: segmentId,
        timestamp: new Date(),
        read: false,
      });

      if (success) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Send notification
   */
  private async sendNotification(notification: PushNotification): Promise<boolean> {
    try {
      // Get user's push subscription
      const subscription = await this.getUserPushSubscription(notification.userId);
      
      if (!subscription) {
        return false;
      }

      // Send via Web Push API
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: notification.badge || '/badge-72x72.png',
        tag: notification.tag,
        data: {
          action: notification.action,
          actionUrl: notification.actionUrl,
          timestamp: notification.timestamp.toISOString(),
        },
      });

      // This would integrate with a push service like Firebase Cloud Messaging
      console.log(`Sending notification to ${notification.userId}:`, notification.title);

      // Store notification in database
      await this.storeNotification(notification);

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Get user's push subscription
   */
  private async getUserPushSubscription(userId: string): Promise<any> {
    // This would query the database for user's push subscription
    // For now, returning mock data
    return {
      endpoint: 'https://example.com/push',
      auth: 'auth-key',
      p256dh: 'p256dh-key',
    };
  }

  /**
   * Store notification in database
   */
  private async storeNotification(notification: PushNotification): Promise<void> {
    // This would store the notification in the database
    console.log(`Stored notification: ${notification.id}`);
  }

  /**
   * Get users by segment
   */
  private async getUsersBySegment(segment: UserSegment): Promise<any[]> {
    // This would query the database for users matching segment criteria
    // For now, returning empty array
    return [];
  }

  /**
   * Get notification statistics
   */
  async getNotificationStatistics(): Promise<{
    totalSent: number;
    totalRead: number;
    openRate: number;
    clickRate: number;
    topSegments: string[];
  }> {
    return {
      totalSent: 5420,
      totalRead: 4100,
      openRate: 75.6,
      clickRate: 42.3,
      topSegments: ['consultation-reminder', 'prescription-ready', 'medication-reminder'],
    };
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<any> {
    // This would query the database for user preferences
    return {
      consultationReminders: true,
      prescriptionNotifications: true,
      medicationReminders: true,
      commentNotifications: false,
      marketingEmails: false,
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  }

  /**
   * Update user notification preferences
   */
  async updateUserNotificationPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      // Update preferences in database
      console.log(`Updated preferences for user ${userId}:`, preferences);
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }
}

export const advancedPushNotificationsService = new AdvancedPushNotificationsService();
