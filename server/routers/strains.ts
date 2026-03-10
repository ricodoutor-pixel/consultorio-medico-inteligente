import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const strainsRouter = router({
  // Listar cepas
  list: publicProcedure
    .input(z.object({
      type: z.enum(['sativa', 'indica', 'hybrid']).optional(),
      effect: z.string().optional(),
      minCBD: z.number().optional(),
      maxTHC: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        strains: [
          {
            id: 1,
            name: "Charlotte's Web",
            type: 'sativa',
            thc: 0.3,
            cbd: 12,
            effects: ['Relaxamento', 'Foco'],
            rating: 4.9,
            reviews: 234,
          },
        ],
        total: 100,
        page: input.page,
      };
    }),

  // Obter detalhes da cepa
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: "Charlotte's Web",
        type: 'sativa',
        thc: 0.3,
        cbd: 12,
        effects: ['Relaxamento', 'Foco', 'Clareza'],
        flavor: ['Frutas', 'Madeira'],
        origin: 'EUA',
        description: 'Cepa medicinal com alto CBD e baixo THC',
        rating: 4.9,
        reviews: 234,
        medicalUses: ['Ansiedade', 'Insônia', 'Dor crônica'],
        growDifficulty: 'Fácil',
        floweringTime: '8-9 semanas',
      };
    }),

  // Buscar cepas por efeito
  searchByEffect: publicProcedure
    .input(z.object({ effect: z.string() }))
    .query(async ({ input }) => {
      return [
        { id: 1, name: "Charlotte's Web", effect: input.effect, rating: 4.9 },
        { id: 2, name: 'Harlequin', effect: input.effect, rating: 4.8 },
      ];
    }),

  // Obter cepas recomendadas
  getRecommendedStrains: publicProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      preferences: z.object({
        thcLevel: z.enum(['low', 'medium', 'high']).optional(),
        cbdLevel: z.enum(['low', 'medium', 'high']).optional(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          name: "Charlotte's Web",
          matchScore: 95,
          rating: 4.9,
          thc: 0.3,
          cbd: 12,
        },
      ];
    }),

  // Deixar review de cepa
  leaveStrainReview: protectedProcedure
    .input(z.object({
      strainId: z.number(),
      rating: z.number().min(1).max(5),
      text: z.string(),
      effects: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        id: Math.random(),
        strainId: input.strainId,
        userId: ctx.user.id,
        rating: input.rating,
        text: input.text,
        createdAt: new Date(),
      };
    }),

  // Salvar cepa favorita
  saveFavoriteStrain: protectedProcedure
    .input(z.object({ strainId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, message: 'Cepa salva nos favoritos' };
    }),

  // Obter cepas favoritas
  getFavoriteStrains: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        { id: 1, name: "Charlotte's Web", rating: 4.9 },
        { id: 2, name: 'Harlequin', rating: 4.8 },
      ];
    }),

  // Comparar cepas
  compareStrains: publicProcedure
    .input(z.object({ strainIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          name: "Charlotte's Web",
          thc: 0.3,
          cbd: 12,
          effects: ['Relaxamento'],
          rating: 4.9,
        },
      ];
    }),

  // Obter estatísticas de cepa
  getStrainStats: publicProcedure
    .input(z.object({ strainId: z.number() }))
    .query(async ({ input }) => {
      return {
        totalReviews: 234,
        avgRating: 4.9,
        mostCommonEffect: 'Relaxamento',
        recommendationRate: 92,
        medicalUseCount: 5,
      };
    }),
});
