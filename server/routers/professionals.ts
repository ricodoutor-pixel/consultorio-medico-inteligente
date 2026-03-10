import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const professionalsRouter = router({
  // Listar profissionais com filtros
  list: publicProcedure
    .input(z.object({
      specialty: z.string().optional(),
      language: z.string().optional(),
      minRating: z.number().optional(),
      maxPrice: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const professionals = [
        {
          id: 1,
          name: 'Dr. Carlos Silva',
          specialty: 'Psiquiatria',
          rating: 4.9,
          reviews: 234,
          pricePerSession: 150,
          languages: ['Português', 'Inglês'],
          image: '👨‍⚕️',
          verified: true,
          online: true,
          nextAvailable: '2026-02-24 14:00',
        },
        {
          id: 2,
          name: 'Dra. Maria Santos',
          specialty: 'Neurologia',
          rating: 4.8,
          reviews: 189,
          pricePerSession: 180,
          languages: ['Português', 'Espanhol'],
          image: '👩‍⚕️',
          verified: true,
          online: false,
          nextAvailable: '2026-02-25 10:00',
        },
      ];

      return {
        professionals,
        total: professionals.length,
        page: input.page,
        limit: input.limit,
      };
    }),

  // Obter detalhes de um profissional
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: 'Dr. Carlos Silva',
        specialty: 'Psiquiatria',
        bio: 'Especialista em cannabis medicinal com 15 anos de experiência',
        rating: 4.9,
        reviews: 234,
        pricePerSession: 150,
        languages: ['Português', 'Inglês'],
        verified: true,
        credentials: ['CRM-SP 123456', 'Especialista SBPC'],
        availability: [
          { day: 'Segunda', times: ['09:00', '14:00', '16:00'] },
          { day: 'Terça', times: ['10:00', '15:00'] },
        ],
      };
    }),

  // Buscar profissionais por especialidade
  searchBySpecialty: publicProcedure
    .input(z.object({ specialty: z.string() }))
    .query(async ({ input }) => {
      return [
        { id: 1, name: 'Dr. Carlos Silva', specialty: input.specialty, rating: 4.9 },
        { id: 2, name: 'Dra. Ana Costa', specialty: input.specialty, rating: 4.7 },
      ];
    }),

  // Verificar disponibilidade
  checkAvailability: publicProcedure
    .input(z.object({
      professionalId: z.number(),
      date: z.string(),
      time: z.string(),
    }))
    .query(async ({ input }) => {
      return { available: true };
    }),

  // Agendar consulta (protegido)
  scheduleConsultation: protectedProcedure
    .input(z.object({
      professionalId: z.number(),
      date: z.string(),
      time: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        id: Math.random(),
        professionalId: input.professionalId,
        userId: ctx.user.id,
        date: input.date,
        time: input.time,
        status: 'scheduled',
        confirmationCode: 'CONS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      };
    }),

  // Cancelar consulta (protegido)
  cancelConsultation: protectedProcedure
    .input(z.object({ consultationId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Consulta cancelada com sucesso' };
    }),

  // Obter consultas do usuário (protegido)
  getUserConsultations: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          professional: 'Dr. Carlos Silva',
          date: '2026-02-24',
          time: '14:00',
          status: 'scheduled',
          type: 'video',
        },
      ];
    }),

  // Deixar review (protegido)
  leaveReview: protectedProcedure
    .input(z.object({
      professionalId: z.number(),
      rating: z.number().min(1).max(5),
      text: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        id: Math.random(),
        professionalId: input.professionalId,
        userId: ctx.user.id,
        rating: input.rating,
        text: input.text,
        createdAt: new Date(),
      };
    }),

  // Obter profissionais recomendados baseado em pré-entrevista
  getRecommendedProfessionals: publicProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      preferences: z.object({
        language: z.string().optional(),
        maxPrice: z.number().optional(),
        specialty: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          name: 'Dr. Carlos Silva',
          specialty: 'Psiquiatria',
          matchScore: 95,
          rating: 4.9,
          pricePerSession: 150,
        },
        {
          id: 2,
          name: 'Dra. Maria Santos',
          specialty: 'Neurologia',
          matchScore: 87,
          rating: 4.8,
          pricePerSession: 180,
        },
      ];
    }),

  // Obter estatísticas de profissional (para dashboard)
  getProfessionalStats: protectedProcedure
    .input(z.object({ professionalId: z.number() }))
    .query(async ({ input }) => {
      return {
        totalConsultations: 234,
        totalEarnings: 35100,
        avgRating: 4.9,
        responseTime: '5 min',
        cancellationRate: 2,
      };
    }),
});
