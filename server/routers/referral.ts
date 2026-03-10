// ============================================================================
// REFERRAL ROUTER — ENDPOINTS DO PROGRAMA DE REFERÊNCIA
// Planta & Raiz 3.0 — Recompensas Automáticas para Médicos
// ============================================================================

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { referralProgramService } from '../services/referralProgramService';

export const referralRouter = router({
  /**
   * Gerar link de referência para médico
   */
  generateLink: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const referralLink = await referralProgramService.generateReferralLink(ctx.user.id);

      return {
        success: true,
        data: referralLink,
      };
    } catch (error) {
      console.error('[Referral] Erro ao gerar link:', error);
      return {
        success: false,
        error: 'Erro ao gerar link de referência',
      };
    }
  }),

  /**
   * Registrar clique em link de referência
   */
  trackClick: publicProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await referralProgramService.processReferralClick(input.code);

        return {
          success: true,
          message: 'Clique registrado',
        };
      } catch (error) {
        console.error('[Referral] Erro ao registrar clique:', error);
        return {
          success: false,
          error: 'Erro ao registrar clique',
        };
      }
    }),

  /**
   * Processar conversão de referência
   */
  processConversion: publicProcedure
    .input(
      z.object({
        code: z.string(),
        newDoctorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const reward = await referralProgramService.processReferralConversion(input.code, input.newDoctorId);

        return {
          success: true,
          data: reward,
        };
      } catch (error) {
        console.error('[Referral] Erro ao processar conversão:', error);
        return {
          success: false,
          error: 'Erro ao processar conversão',
        };
      }
    }),

  /**
   * Obter estatísticas de referência
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const stats = await referralProgramService.getReferralStats(ctx.user.id);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('[Referral] Erro ao obter estatísticas:', error);
      return {
        success: false,
        error: 'Erro ao obter estatísticas',
      };
    }
  }),

  /**
   * Obter tier de referência
   */
  getTier: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const tier = await referralProgramService.getReferralTier(ctx.user.id);

      return {
        success: true,
        data: tier,
      };
    } catch (error) {
      console.error('[Referral] Erro ao obter tier:', error);
      return {
        success: false,
        error: 'Erro ao obter tier',
      };
    }
  }),

  /**
   * Obter recompensas pendentes
   */
  getPendingRewards: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const stats = await referralProgramService.getReferralStats(ctx.user.id);

      return {
        success: true,
        data: {
          pendingRewards: stats.pendingRewards,
          paidRewards: stats.paidRewards,
          totalRewards: stats.totalRewards,
        },
      };
    } catch (error) {
      console.error('[Referral] Erro ao obter recompensas:', error);
      return {
        success: false,
        error: 'Erro ao obter recompensas',
      };
    }
  }),

  /**
   * Aprovar recompensa (admin only)
   */
  approveReward: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user?.role !== 'admin') {
          return {
            success: false,
            error: 'Acesso negado',
          };
        }

        await referralProgramService.approveReferralReward(input.rewardId);

        return {
          success: true,
          message: 'Recompensa aprovada',
        };
      } catch (error) {
        console.error('[Referral] Erro ao aprovar recompensa:', error);
        return {
          success: false,
          error: 'Erro ao aprovar recompensa',
        };
      }
    }),

  /**
   * Pagar recompensa (admin only)
   */
  payReward: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user?.role !== 'admin') {
          return {
            success: false,
            error: 'Acesso negado',
          };
        }

        await referralProgramService.payReferralReward(input.rewardId);

        return {
          success: true,
          message: 'Recompensa paga',
        };
      } catch (error) {
        console.error('[Referral] Erro ao pagar recompensa:', error);
        return {
          success: false,
          error: 'Erro ao pagar recompensa',
        };
      }
    }),
});
