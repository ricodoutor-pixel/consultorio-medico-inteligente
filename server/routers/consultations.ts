import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const consultationsRouter = router({
  // Pré-entrevista com IA
  submitPreInterview: publicProcedure
    .input(z.object({
      symptoms: z.string(),
      duration: z.string(),
      previousUse: z.boolean(),
      medications: z.string(),
      allergies: z.string(),
      availability: z.string(),
      budget: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        sessionId: Math.random(),
        recommendations: [
          { id: 1, name: 'Dr. Carlos', matchScore: 95 },
          { id: 2, name: 'Dra. Maria', matchScore: 87 },
        ],
        nextStep: 'select_professional',
      };
    }),

  // Agendar consulta
  scheduleConsultation: protectedProcedure
    .input(z.object({
      professionalId: z.number(),
      date: z.string(),
      time: z.string(),
      type: z.enum(['video', 'chat', 'phone']),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        consultationId: Math.random(),
        confirmationCode: 'CONS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        status: 'scheduled',
        accessLink: 'https://planta-raiz.com/consultation/abc123',
      };
    }),

  // Obter consultas agendadas
  getScheduledConsultations: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          professional: 'Dr. Carlos Silva',
          date: '2026-02-24',
          time: '14:00',
          type: 'video',
          status: 'scheduled',
          accessLink: 'https://planta-raiz.com/consultation/abc123',
        },
      ];
    }),

  // Iniciar consulta
  startConsultation: protectedProcedure
    .input(z.object({ consultationId: z.number() }))
    .mutation(async ({ input }) => {
      return {
        roomId: 'room-' + Math.random().toString(36).substr(2, 9),
        token: 'token-' + Math.random().toString(36).substr(2, 20),
      };
    }),

  // Finalizar consulta
  endConsultation: protectedProcedure
    .input(z.object({ consultationId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Consulta finalizada' };
    }),

  // Obter histórico de consultas
  getConsultationHistory: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          professional: 'Dr. Carlos Silva',
          date: '2026-02-15',
          duration: 45,
          notes: 'Prescrição de óleo CBD',
          prescription: { id: 1, medication: 'Óleo CBD 500mg' },
        },
      ];
    }),

  // Obter prontuário
  getMedicalRecord: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        userId: ctx.user.id,
        symptoms: ['Ansiedade', 'Insônia'],
        medications: ['Óleo CBD'],
        allergies: [],
        consultations: 5,
        lastConsultation: '2026-02-15',
      };
    }),

  // Atualizar prontuário
  updateMedicalRecord: protectedProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      medications: z.array(z.string()),
      allergies: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, message: 'Prontuário atualizado' };
    }),

  // Obter prescrições
  getPrescriptions: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          medication: 'Óleo CBD 500mg',
          dosage: '1 gota 2x ao dia',
          duration: '30 dias',
          doctor: 'Dr. Carlos Silva',
          date: '2026-02-15',
        },
      ];
    }),

  // Cancelar consulta
  cancelConsultation: protectedProcedure
    .input(z.object({ consultationId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Consulta cancelada' };
    }),

  // Reagendar consulta
  rescheduleConsultation: protectedProcedure
    .input(z.object({
      consultationId: z.number(),
      newDate: z.string(),
      newTime: z.string(),
    }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Consulta reagendada' };
    }),
});
