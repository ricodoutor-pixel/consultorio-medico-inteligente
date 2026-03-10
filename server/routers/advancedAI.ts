import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import advancedAIService, { PatientProfile } from '../services/advancedAIService';

export const advancedAIRouter = router({
  /**
   * Realiza diagnóstico avançado com IA
   */
  performDiagnosis: protectedProcedure
    .input(
      z.object({
        age: z.number(),
        gender: z.enum(['M', 'F', 'O']),
        symptoms: z.array(z.string()),
        medicalHistory: z.array(z.string()),
        currentMedications: z.array(z.string()),
        allergies: z.array(z.string()),
        lifestyle: z.object({
          smoker: z.boolean(),
          alcohol: z.boolean(),
          exercise: z.number(),
          stress: z.number(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const profile: PatientProfile = {
          id: String(ctx.user?.id || ''),
          ...input,
          consultationHistory: 0,
          satisfactionScore: 0,
        };

        const diagnosis = await advancedAIService.performAdvancedDiagnosis(profile);

        return {
          success: true,
          diagnosis,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Prediz risco de churn
   */
  predictChurn: protectedProcedure
    .input(
      z.object({
        age: z.number(),
        gender: z.enum(['M', 'F', 'O']),
        symptoms: z.array(z.string()),
        medicalHistory: z.array(z.string()),
        currentMedications: z.array(z.string()),
        allergies: z.array(z.string()),
        lifestyle: z.object({
          smoker: z.boolean(),
          alcohol: z.boolean(),
          exercise: z.number(),
          stress: z.number(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id || '');
        const profile: PatientProfile = {
          id: userId,
          ...input,
          consultationHistory: 0,
          satisfactionScore: 0,
        };

        const prediction = await advancedAIService.predictChurnRisk(userId, profile);

        return {
          success: true,
          prediction,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Gera recomendações personalizadas
   */
  getPersonalizedRecommendations: protectedProcedure
    .input(
      z.object({
        age: z.number(),
        gender: z.enum(['M', 'F', 'O']),
        symptoms: z.array(z.string()),
        medicalHistory: z.array(z.string()),
        currentMedications: z.array(z.string()),
        allergies: z.array(z.string()),
        lifestyle: z.object({
          smoker: z.boolean(),
          alcohol: z.boolean(),
          exercise: z.number(),
          stress: z.number(),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id || '');
        const profile: PatientProfile = {
          id: userId,
          ...input,
          consultationHistory: 0,
          satisfactionScore: 0,
        };

        const recommendations = await advancedAIService.generatePersonalizedRecommendations(
          userId,
          profile
        );

        return {
          success: true,
          recommendations,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Analisa padrões de medicação
   */
  analyzeMedicationPatterns: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id || '');
      const analysis = await advancedAIService.analyzeMedicationPatterns(userId);

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Detecta anomalias
   */
  detectAnomalies: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id || '');
      const anomalies = await advancedAIService.detectAnomalies(userId);

      return {
        success: true,
        anomalies,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Gera insights de saúde
   */
  getHealthInsights: protectedProcedure
    .input(
      z.object({
        age: z.number(),
        gender: z.enum(['M', 'F', 'O']),
        symptoms: z.array(z.string()),
        medicalHistory: z.array(z.string()),
        currentMedications: z.array(z.string()),
        allergies: z.array(z.string()),
        lifestyle: z.object({
          smoker: z.boolean(),
          alcohol: z.boolean(),
          exercise: z.number(),
          stress: z.number(),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id || '');
        const profile: PatientProfile = {
          id: userId,
          ...input,
          consultationHistory: 0,
          satisfactionScore: 0,
        };

        const insights = await advancedAIService.generateHealthInsights(userId, profile);

        return {
          success: true,
          insights,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),
});
