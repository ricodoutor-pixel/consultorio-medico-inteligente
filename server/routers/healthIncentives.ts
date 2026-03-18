import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { HealthDataIncentivesService } from '../services/healthDataIncentivesService';

export const healthIncentivesRouter = router({
  /**
   * Registrar sincronização de dados de saúde e ganhar pontos
   */
  recordHealthDataSync: protectedProcedure
    .input(
      z.object({
        wearableType: z.enum(['apple_healthkit', 'fitbit', 'oura', 'manual']),
        dataType: z.enum(['heart_rate', 'sleep', 'steps', 'stress', 'temperature', 'oxygen', 'recovery']),
        streak: z.number().min(1),
        isFirstSync: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const reward = HealthDataIncentivesService.recordHealthDataSync(
        ctx.user.id,
        input.wearableType,
        input.dataType,
        input.streak,
        input.isFirstSync
      );

      // Aplicar bônus por tipo de wearable
      const wearableBonus = HealthDataIncentivesService.getWearableBonus(input.wearableType);
      const totalPoints = Math.round(reward.pointsEarned * wearableBonus);

      // Gerar notificação
      const notification = HealthDataIncentivesService.generatePointsNotification(reward);

      return {
        success: true,
        pointsEarned: totalPoints,
        notification,
        reward: {
          ...reward,
          pointsEarned: totalPoints,
        },
      };
    }),

  /**
   * Obter badges disponíveis
   */
  getAvailableBadges: publicProcedure.query(() => {
    return HealthDataIncentivesService.getAvailableBadges();
  }),

  /**
   * Verificar badges conquistados pelo usuário
   */
  checkBadgeAchievements: protectedProcedure
    .input(
      z.object({
        totalSyncs: z.number(),
        streak: z.number(),
        totalPoints: z.number(),
        dataTypesSynced: z.array(z.string()),
        sleepSyncs: z.number(),
        stepsSyncs: z.number(),
        stressAverage: z.number(),
        earnedBadges: z.array(z.string()),
      })
    )
    .query(({ input }) => {
      const badges = HealthDataIncentivesService.getAvailableBadges();
      const newBadges = badges.filter(badge =>
        HealthDataIncentivesService.checkBadgeAchievement(
          'user_id', // Será substituído pelo ctx.user.id
          badge.id,
          input
        )
      );

      return {
        newBadges,
        totalBadges: badges.length,
        earnedCount: input.earnedBadges.length,
      };
    }),

  /**
   * Obter desafios disponíveis
   */
  getAvailableChallenges: publicProcedure.query(() => {
    return HealthDataIncentivesService.getAvailableChallenges();
  }),

  /**
   * Verificar se desafio foi completado
   */
  checkChallengeCompletion: protectedProcedure
    .input(
      z.object({
        challengeId: z.string(),
        currentValue: z.number(),
        target: z.number(),
      })
    )
    .query(({ input }) => {
      const completed = HealthDataIncentivesService.checkChallengeCompletion(
        input.challengeId,
        input.currentValue,
        input.target
      );

      return {
        completed,
        progress: (input.currentValue / input.target) * 100,
      };
    }),

  /**
   * Obter próximo desafio recomendado
   */
  getNextChallenge: protectedProcedure
    .input(
      z.object({
        completedChallenges: z.array(z.string()),
        dataTypesSynced: z.array(z.string()),
      })
    )
    .query(({ input }) => {
      return HealthDataIncentivesService.getNextChallenge(input);
    }),

  /**
   * Calcular progresso para próximo tier
   */
  getProgressToNextTier: protectedProcedure
    .input(z.object({ totalPoints: z.number() }))
    .query(({ input }) => {
      return HealthDataIncentivesService.calculateProgressToNextTier(input.totalPoints);
    }),

  /**
   * Obter estatísticas de incentivos do usuário
   */
  getUserIncentiveStats: protectedProcedure.query(({ ctx }) => {
    return HealthDataIncentivesService.getUserIncentiveStats(ctx.user.id);
  }),

  /**
   * Gerar relatório de incentivos
   */
  generateIncentiveReport: protectedProcedure.query(({ ctx }) => {
    return HealthDataIncentivesService.generateIncentiveReport(ctx.user.id);
  }),

  /**
   * Obter bônus por tipo de wearable
   */
  getWearableBonus: publicProcedure
    .input(z.enum(['apple_healthkit', 'fitbit', 'oura', 'manual']))
    .query(({ input }) => {
      const bonus = HealthDataIncentivesService.getWearableBonus(input);
      return {
        wearableType: input,
        bonus,
        bonusPercentage: (bonus - 1) * 100,
      };
    }),

  /**
   * Listar todos os wearables com seus bônus
   */
  getWearableBonuses: publicProcedure.query(() => {
    const wearables = ['apple_healthkit', 'fitbit', 'oura', 'manual'] as const;
    return wearables.map(wearable => ({
      wearableType: wearable,
      bonus: HealthDataIncentivesService.getWearableBonus(wearable),
      bonusPercentage: (HealthDataIncentivesService.getWearableBonus(wearable) - 1) * 100,
    }));
  }),
});
