/**
 * Affiliate Router
 * Handles referral codes, tracking, and commission management
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  getAffiliateInfo,
  getUserReferralCode,
  getAffiliateStats,
  validateReferralCode,
  generateReferralLink,
} from '../services/affiliateService';

export const affiliateRouter = router({
  /**
   * Get affiliate info for current user
   */
  getInfo: protectedProcedure.query(async ({ ctx }) => {
    try {
      const affiliate = await getAffiliateInfo(ctx.user.id);
      if (!affiliate) {
        return { success: false, error: 'Afiliado nao encontrado' };
      }
      return {
        success: true,
        data: {
          referralCode: affiliate.referralCode,
          totalReferrals: affiliate.totalReferrals,
          totalCommissions: affiliate.totalCommissions,
          commissionRate: affiliate.commissionRate,
        },
      };
    } catch (error) {
      console.error('[AffiliateRouter] Error getting affiliate info:', error);
      return { success: false, error: 'Erro ao buscar informacoes de afiliado' };
    }
  }),

  /**
   * Get referral code
   */
  getReferralCode: protectedProcedure.query(async ({ ctx }) => {
    try {
      const code = await getUserReferralCode(ctx.user.id);
      if (!code) {
        return { success: false, error: 'Codigo de referencia nao encontrado' };
      }
      return { success: true, data: { code } };
    } catch (error) {
      console.error('[AffiliateRouter] Error getting referral code:', error);
      return { success: false, error: 'Erro ao buscar codigo de referencia' };
    }
  }),

  /**
   * Get affiliate statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await getAffiliateStats(ctx.user.id);
      if (!stats) {
        return { success: false, error: 'Estatisticas nao encontradas' };
      }
      return { success: true, data: stats };
    } catch (error) {
      console.error('[AffiliateRouter] Error getting affiliate stats:', error);
      return { success: false, error: 'Erro ao buscar estatisticas' };
    }
  }),

  /**
   * Generate referral link
   */
  generateLink: protectedProcedure
    .input(
      z.object({
        baseUrl: z.string().url().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const code = await getUserReferralCode(ctx.user.id);
        if (!code) {
          return { success: false, error: 'Codigo de referencia nao encontrado' };
        }
        const link = generateReferralLink(code, input.baseUrl);
        return { success: true, data: { link } };
      } catch (error) {
        console.error('[AffiliateRouter] Error generating referral link:', error);
        return { success: false, error: 'Erro ao gerar link de referencia' };
      }
    }),

  /**
   * Validate referral code
   */
  validateCode: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const referrerId = await validateReferralCode(input.code);
        if (!referrerId) {
          return { success: false, error: 'Codigo de referencia invalido' };
        }
        return { success: true, data: { referrerId } };
      } catch (error) {
        console.error('[AffiliateRouter] Error validating referral code:', error);
        return { success: false, error: 'Erro ao validar codigo de referencia' };
      }
    }),
});
