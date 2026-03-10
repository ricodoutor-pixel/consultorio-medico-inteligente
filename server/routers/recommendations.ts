import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import {
  recommendProfessionals,
  recommendProducts,
  recommendStrains,
  generatePersonalizedRecommendations,
  calculateCompatibilityScore,
  findSimilarProfessionals,
} from '../services/recommendationService';

export const recommendationsRouter = router({
  // Obter recomendações de profissionais
  getProfessionalRecommendations: protectedProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      limit: z.number().default(5),
    }))
    .query(async ({ input, ctx }) => {
      const userProfile = {
        userId: String(ctx.user.id),
        age: 35,
        gender: 'M',
        symptoms: input.symptoms,
        medicalHistory: [],
        preferences: [],
        previousConsultations: [],
        purchaseHistory: [],
      };

      const availableProfessionals = [
        {
          id: '1',
          name: 'Dr. Carlos Silva',
          specialty: 'Medicina Cannabis',
          experience: 15,
          rating: 4.8,
          languages: ['Português', 'Inglês'],
          availability: ['Seg-Sex 9-18h'],
          price: 150,
        },
        {
          id: '2',
          name: 'Dra. Maria Santos',
          specialty: 'Psicologia Clínica',
          experience: 12,
          rating: 4.7,
          languages: ['Português'],
          availability: ['Seg-Sex 10-19h'],
          price: 120,
        },
      ];

      const recommendations = await recommendProfessionals(
        userProfile,
        availableProfessionals,
        input.limit
      );

      return {
        success: true,
        recommendations,
      };
    }),

  // Obter recomendações de produtos
  getProductRecommendations: protectedProcedure
    .input(z.object({
      limit: z.number().default(5),
    }))
    .query(async ({ input, ctx }) => {
      const userProfile = {
        userId: String(ctx.user.id),
        age: 35,
        gender: 'M',
        symptoms: ['ansiedade', 'insônia'],
        medicalHistory: [],
        preferences: ['natural', 'orgânico'],
        previousConsultations: [],
        purchaseHistory: ['Óleo CBD 500mg', 'Chá de Camomila'],
      };

      const availableProducts = [
        {
          id: '1',
          name: 'Óleo CBD Premium 1000mg',
          category: 'Óleos',
          price: 150,
          rating: 4.9,
          description: 'Óleo CBD de alta concentração',
          benefits: ['Ansiedade', 'Insônia', 'Dor'],
        },
        {
          id: '2',
          name: 'Cápsulas CBD 25mg',
          category: 'Cápsulas',
          price: 80,
          rating: 4.6,
          description: 'Cápsulas de CBD com dosagem precisa',
          benefits: ['Ansiedade', 'Inflamação'],
        },
      ];

      const recommendations = await recommendProducts(
        userProfile,
        availableProducts,
        input.limit
      );

      return {
        success: true,
        recommendations,
      };
    }),

  // Obter recomendações de variedades
  getStrainRecommendations: protectedProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      limit: z.number().default(5),
    }))
    .query(async ({ input, ctx }) => {
      const userProfile = {
        userId: String(ctx.user.id),
        age: 35,
        gender: 'M',
        symptoms: input.symptoms,
        medicalHistory: [],
        preferences: [],
        previousConsultations: [],
        purchaseHistory: [],
      };

      const availableStrains = [
        {
          id: '1',
          name: 'Charlotte\'s Web',
          thcLevel: 0.3,
          cbdLevel: 17,
          effects: ['Relaxamento', 'Foco'],
          flavors: ['Herbal', 'Terroso'],
          rating: 4.9,
          reviews: 234,
        },
        {
          id: '2',
          name: 'Harlequin',
          thcLevel: 5,
          cbdLevel: 10,
          effects: ['Alerta', 'Criatividade'],
          flavors: ['Frutas', 'Herbal'],
          rating: 4.7,
          reviews: 189,
        },
      ];

      const recommendations = await recommendStrains(
        userProfile,
        availableStrains,
        input.limit
      );

      return {
        success: true,
        recommendations,
      };
    }),

  // Obter recomendações personalizadas
  getPersonalizedRecommendations: protectedProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
    }))
    .query(async ({ input, ctx }) => {
      const userProfile = {
        userId: String(ctx.user.id),
        age: 35,
        gender: 'M',
        symptoms: input.symptoms,
        medicalHistory: [],
        preferences: [],
        previousConsultations: [],
        purchaseHistory: [],
      };

      const recommendations = await generatePersonalizedRecommendations(userProfile);

      return {
        success: true,
        recommendations,
      };
    }),

  // Calcular compatibilidade com profissional
  calculateProfessionalCompatibility: protectedProcedure
    .input(z.object({
      professionalId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const userProfile = {
        userId: String(ctx.user.id),
        age: 35,
        gender: 'M',
        symptoms: [],
        medicalHistory: [],
        preferences: [],
        previousConsultations: [],
        purchaseHistory: [],
      };

      const professional = {
        id: input.professionalId,
        name: 'Dr. Carlos Silva',
        specialty: 'Medicina Cannabis',
        experience: 15,
        rating: 4.8,
        languages: ['Português', 'Inglês'],
        availability: ['Seg-Sex 9-18h'],
        price: 150,
      };

      const score = calculateCompatibilityScore(userProfile, professional);

      return {
        success: true,
        score,
        percentage: `${Math.round(score)}%`,
      };
    }),

  // Encontrar profissionais similares
  findSimilarProfessionals: publicProcedure
    .input(z.object({
      professionalId: z.string(),
      limit: z.number().default(5),
    }))
    .query(async ({ input }) => {
      const targetProfessional = {
        id: input.professionalId,
        name: 'Dr. Carlos Silva',
        specialty: 'Medicina Cannabis',
        experience: 15,
        rating: 4.8,
        languages: ['Português', 'Inglês'],
        availability: ['Seg-Sex 9-18h'],
        price: 150,
      };

      const allProfessionals = [
        {
          id: '2',
          name: 'Dra. Maria Santos',
          specialty: 'Medicina Cannabis',
          experience: 12,
          rating: 4.7,
          languages: ['Português', 'Inglês'],
          availability: ['Seg-Sex 10-19h'],
          price: 140,
        },
        {
          id: '3',
          name: 'Dr. João Costa',
          specialty: 'Medicina Cannabis',
          experience: 10,
          rating: 4.6,
          languages: ['Português'],
          availability: ['Seg-Sex 8-17h'],
          price: 120,
        },
      ];

      const similar = findSimilarProfessionals(
        targetProfessional,
        allProfessionals,
        input.limit
      );

      return {
        success: true,
        professionals: similar,
      };
    }),

  // Obter trending recommendations
  getTrendingRecommendations: publicProcedure
    .query(async () => {
      return {
        success: true,
        trending: [
          {
            id: '1',
            name: 'Dr. Carlos Silva',
            type: 'professional',
            rating: 4.8,
            consultations: 342,
          },
          {
            id: '2',
            name: 'Óleo CBD Premium',
            type: 'product',
            rating: 4.9,
            sales: 1200,
          },
          {
            id: '3',
            name: 'Charlotte\'s Web',
            type: 'strain',
            rating: 4.9,
            reviews: 234,
          },
        ],
      };
    }),

  // Salvar preferências de recomendação
  saveRecommendationPreferences: protectedProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      preferences: z.array(z.string()),
      specialties: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        message: 'Preferências salvas com sucesso',
      };
    }),

  // Obter histórico de recomendações
  getRecommendationHistory: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        success: true,
        history: [
          {
            id: '1',
            type: 'professional',
            name: 'Dr. Carlos Silva',
            date: '2026-02-20',
            action: 'viewed',
          },
          {
            id: '2',
            type: 'product',
            name: 'Óleo CBD',
            date: '2026-02-19',
            action: 'purchased',
          },
        ],
      };
    }),
});
