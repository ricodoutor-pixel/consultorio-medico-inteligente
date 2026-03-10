import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import realtimeNotificationsService from '../services/realtimeNotificationsService';

export const realtimeNotificationsRouter = router({
  /**
   * Registra subscription de push notification
   */
  registerPushSubscription: protectedProcedure
    .input(
      z.object({
        subscription: z.any(),
        userAgent: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id || '');
        const result = await realtimeNotificationsService.registerPushSubscription(
          userId,
          input.subscription,
          input.userAgent
        );

        return {
          success: true,
          subscription: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Envia notificação de consulta agendada
   */
  sendConsultationNotification: protectedProcedure
    .input(
      z.object({
        patientName: z.string(),
        professionalName: z.string(),
        consultationDate: z.date(),
        jitsiLink: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id || '');
        const result = await realtimeNotificationsService.sendConsultationNotification({
          userId,
          ...input,
        });

        return {
          success: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Envia notificação de nova mensagem
   */
  sendMessageNotification: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        senderName: z.string(),
        messagePreview: z.string(),
        conversationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await realtimeNotificationsService.sendMessageNotification(input);

        return {
          success: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Envia lembrete de medicação
   */
  sendMedicationReminder: protectedProcedure
    .input(
      z.object({
        medicationName: z.string(),
        dosage: z.string(),
        frequency: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id || '');
        const result = await realtimeNotificationsService.sendMedicationReminder({
          userId,
          ...input,
        });

        return {
          success: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Envia notificação de prescrição pronta
   */
  sendPrescriptionReadyNotification: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.string(),
        pharmacyName: z.string(),
        pickupAddress: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id || '');
        const result = await realtimeNotificationsService.sendPrescriptionReadyNotification({
          userId,
          ...input,
        });

        return {
          success: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Envia notificação de pagamento confirmado
   */
  sendPaymentConfirmedNotification: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        transactionId: z.string(),
        paymentMethod: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id || '');
        const result = await realtimeNotificationsService.sendPaymentConfirmedNotification({
          userId,
          ...input,
        });

        return {
          success: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Marca notificação como lida
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await realtimeNotificationsService.markAsRead(input.notificationId);

        return {
          success: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Busca notificações não lidas
   */
  getUnreadNotifications: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id || '');
      const notifications = await realtimeNotificationsService.getUnreadNotifications(userId);

      return {
        success: true,
        notifications,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),
});
