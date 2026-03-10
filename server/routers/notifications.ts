import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const notificationsRouter = router({
  // Obter notificações
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          title: 'Lembrete de medicação',
          message: 'Hora de tomar seu óleo CBD',
          type: 'reminder',
          timestamp: '2026-02-23 14:00',
          read: false,
        },
        {
          id: 2,
          title: 'Consulta agendada',
          message: 'Sua consulta com Dr. Carlos está confirmada para amanhã',
          type: 'appointment',
          timestamp: '2026-02-23 10:00',
          read: true,
        },
      ];
    }),

  // Marcar notificação como lida
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  // Marcar todas como lidas
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      return { success: true };
    }),

  // Deletar notificação
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  // Obter preferências de notificação
  getNotificationPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        medicationReminders: true,
        appointmentReminders: true,
        promotions: false,
        newsletter: true,
      };
    }),

  // Atualizar preferências
  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      medicationReminders: z.boolean().optional(),
      appointmentReminders: z.boolean().optional(),
      promotions: z.boolean().optional(),
      newsletter: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Preferências atualizadas' };
    }),

  // Obter lembretes de medicação
  getMedicationReminders: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          medication: 'Óleo CBD 500mg',
          dosage: '1 gota',
          time: '08:00',
          frequency: 'Diariamente',
          nextReminder: '2026-02-24 08:00',
        },
      ];
    }),

  // Definir lembrete de medicação
  setMedicationReminder: protectedProcedure
    .input(z.object({
      medication: z.string(),
      dosage: z.string(),
      time: z.string(),
      frequency: z.enum(['daily', 'weekly', 'monthly']),
    }))
    .mutation(async ({ input }) => {
      return {
        reminderId: Math.random(),
        success: true,
        message: 'Lembrete configurado',
      };
    }),

  // Obter lembretes de consulta
  getAppointmentReminders: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          professional: 'Dr. Carlos Silva',
          date: '2026-02-24',
          time: '14:00',
          reminderTime: '13:30',
          status: 'pending',
        },
      ];
    }),

  // Contar notificações não lidas
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return { unreadCount: 3 };
    }),
});
