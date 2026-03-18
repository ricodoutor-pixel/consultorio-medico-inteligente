import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { LoyaltyProgramService } from '../services/loyaltyProgramService';

export const loyaltyRouter = router({
  /**
   * Obter pontos do usuário
   */
  getUserPoints: protectedProcedure.query(async ({ ctx }) => {
    // Simular dados do banco de dados
    return {
      userId: ctx.user.id,
      totalPoints: 2450,
      availablePoints: 2450,
      usedPoints: 150,
      level: 'gold',
      nextLevelPoints: 3000,
      lastUpdated: new Date(),
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    };
  }),

  /**
   * Obter histórico de pontos
   */
  getPointsHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Simular histórico de transações
      return [
        {
          id: 'trans_001',
          userId: ctx.user.id,
          type: 'earned' as const,
          points: 150,
          description: 'Pontos ganhos em consulta (R$ 150.00)',
          relatedId: 'cons_001',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'trans_002',
          userId: ctx.user.id,
          type: 'earned' as const,
          points: 225,
          description: 'Pontos ganhos em compra (R$ 150.00)',
          relatedId: 'comp_001',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'trans_003',
          userId: ctx.user.id,
          type: 'redeemed' as const,
          points: -100,
          description: 'Desconto 10% resgatado',
          relatedId: 'redeem_001',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'trans_004',
          userId: ctx.user.id,
          type: 'bonus' as const,
          points: 100,
          description: 'Bônus de referência - Novo usuário',
          relatedId: 'user_ref_001',
          timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      ].slice(input.offset, input.offset + input.limit);
    }),

  /**
   * Obter recompensas disponíveis
   */
  getAvailableRewards: protectedProcedure.query(async ({ ctx }) => {
    return LoyaltyProgramService.generateDefaultRewards();
  }),

  /**
   * Resgatar pontos por recompensa
   */
  redeemReward: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
        pointsToSpend: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Simular resgate de recompensa
      return {
        success: true,
        message: 'Recompensa resgatada com sucesso!',
        redemption: {
          id: `redeem_${Date.now()}`,
          userId: ctx.user.id,
          rewardId: input.rewardId,
          pointsSpent: input.pointsToSpend,
          discountApplied: Math.floor(input.pointsToSpend * 0.2),
          usedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          active: true,
        },
      };
    }),

  /**
   * Adicionar pontos por consulta
   */
  addConsultationPoints: protectedProcedure
    .input(
      z.object({
        consultationId: z.string(),
        consultationValue: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const transaction = LoyaltyProgramService.addConsultationPoints(
        ctx.user.id,
        input.consultationValue,
        input.consultationId
      );

      return {
        success: true,
        message: `${transaction.points} pontos adicionados!`,
        transaction,
      };
    }),

  /**
   * Adicionar pontos por compra
   */
  addPurchasePoints: protectedProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        purchaseValue: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const transaction = LoyaltyProgramService.addPurchasePoints(
        ctx.user.id,
        input.purchaseValue,
        input.purchaseId
      );

      return {
        success: true,
        message: `${transaction.points} pontos adicionados!`,
        transaction,
      };
    }),

  /**
   * Adicionar pontos por referência
   */
  addReferralPoints: protectedProcedure
    .input(
      z.object({
        referredUserId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const transaction = LoyaltyProgramService.addReferralPoints(
        ctx.user.id,
        input.referredUserId
      );

      return {
        success: true,
        message: `${transaction.points} pontos de referência adicionados!`,
        transaction,
      };
    }),

  /**
   * Obter estatísticas de fidelização (admin)
   */
  getLoyaltyStats: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    if (ctx.user.role !== 'admin') {
      throw new Error('Acesso negado');
    }

    return {
      totalUsers: 1250,
      totalPointsIssued: 2500000,
      totalPointsRedeemed: 625000,
      averagePointsPerUser: 2000,
      redemptionRate: 0.25,
      levelDistribution: {
        bronze: 450,
        silver: 400,
        gold: 300,
        platinum: 100,
      },
      topRewards: [
        {
          rewardId: 'reward_001',
          rewardName: 'Desconto 10%',
          timesRedeemed: 450,
        },
        {
          rewardId: 'reward_002',
          rewardName: 'Desconto 20%',
          timesRedeemed: 300,
        },
        {
          rewardId: 'reward_003',
          rewardName: 'Consulta Grátis',
          timesRedeemed: 150,
        },
      ],
    };
  }),

  /**
   * Simular impacto do programa de fidelização
   */
  simulateLoyaltyImpact: publicProcedure
    .input(
      z.object({
        currentLTV: z.number().min(0),
        estimatedUsers: z.number().min(1),
        conversionIncrease: z.number().min(0).max(1).default(0.25),
      })
    )
    .query(async ({ input }) => {
      return LoyaltyProgramService.simulateLoyaltyImpact(
        input.currentLTV,
        input.estimatedUsers,
        input.conversionIncrease
      );
    }),

  /**
   * Obter recompensa recomendada para usuário
   */
  getRecommendedReward: protectedProcedure.query(async ({ ctx }) => {
    const userPoints = {
      userId: ctx.user.id,
      totalPoints: 2450,
      availablePoints: 2450,
      usedPoints: 150,
      level: 'gold' as const,
      nextLevelPoints: 3000,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };

    const rewards = LoyaltyProgramService.generateDefaultRewards();
    const recommended = LoyaltyProgramService.getRecommendedReward(userPoints, rewards);

    return recommended || rewards[0];
  }),

  /**
   * Obter benefícios do nível atual
   */
  getLevelBenefits: protectedProcedure.query(async ({ ctx }) => {
    const userPoints = {
      userId: ctx.user.id,
      totalPoints: 2450,
      availablePoints: 2450,
      usedPoints: 150,
      level: 'gold' as const,
      nextLevelPoints: 3000,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };

    const benefits: { [level: string]: string[] } = {
      bronze: [
        'Ganhe 1 ponto por R$ 1 em consultas',
        'Ganhe 1.5 pontos por R$ 1 em compras',
        'Acesso a recompensas básicas',
      ],
      silver: [
        'Ganhe 1.1 pontos por R$ 1 em consultas',
        'Ganhe 1.6 pontos por R$ 1 em compras',
        'Acesso prioritário a recompensas',
        'Bônus de 50 pontos por mês',
      ],
      gold: [
        'Ganhe 1.2 pontos por R$ 1 em consultas',
        'Ganhe 1.7 pontos por R$ 1 em compras',
        'Acesso prioritário a recompensas exclusivas',
        'Bônus de 100 pontos por mês',
        'Suporte prioritário',
      ],
      platinum: [
        'Ganhe 1.3 pontos por R$ 1 em consultas',
        'Ganhe 2 pontos por R$ 1 em compras',
        'Acesso VIP a eventos e promoções exclusivas',
        'Bônus de 200 pontos por mês',
        'Atendimento prioritário 24/7',
        'Consultas grátis mensais',
      ],
    };

    return {
      level: userPoints.level,
      benefits: benefits[userPoints.level] || [],
    };
  }),
});
