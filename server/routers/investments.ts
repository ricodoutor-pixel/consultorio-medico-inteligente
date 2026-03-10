/**
 * Investment Router
 * Handles investment-related tRPC procedures
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  getAvailablePlans,
  createNewInvestment,
  getUserActiveInvestments,
  getInvestmentSummary,
} from '../services/investmentService';

export const investmentRouter = router({
  /**
   * Get all available investment plans
   */
  getPlans: protectedProcedure.query(async () => {
    try {
      const plans = await getAvailablePlans();
      return {
        success: true,
        data: plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          minAmount: plan.minAmount,
          maxAmount: plan.maxAmount,
          dailyReturnPercentage: plan.dailyReturnPercentage / 100, // Convert to percentage
        })),
      };
    } catch (error) {
      console.error('[InvestmentRouter] Error getting plans:', error);
      return { success: false, error: 'Erro ao buscar planos' };
    }
  }),

  /**
   * Create a new investment
   */
  createInvestment: protectedProcedure
    .input(
      z.object({
        planId: z.number().int().positive(),
        amount: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createNewInvestment(ctx.user.id, input.planId, input.amount);
        return result;
      } catch (error) {
        console.error('[InvestmentRouter] Error creating investment:', error);
        return { success: false, error: 'Erro ao criar investimento' };
      }
    }),

  /**
   * Get user's active investments
   */
  getActiveInvestments: protectedProcedure.query(async ({ ctx }) => {
    try {
      const investments = await getUserActiveInvestments(ctx.user.id);
      return {
        success: true,
        data: investments.map((inv) => ({
          id: inv.id,
          planId: inv.planId,
          amount: inv.amount,
          accumulatedReturns: inv.accumulatedReturns,
          status: inv.status,
          createdAt: inv.createdAt,
        })),
      };
    } catch (error) {
      console.error('[InvestmentRouter] Error getting active investments:', error);
      return { success: false, error: 'Erro ao buscar investimentos' };
    }
  }),

  /**
   * Get investment summary
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const summary = await getInvestmentSummary(ctx.user.id);
      if (!summary) {
        return { success: false, error: 'Resumo não encontrado' };
      }
      return { success: true, data: summary };
    } catch (error) {
      console.error('[InvestmentRouter] Error getting summary:', error);
      return { success: false, error: 'Erro ao buscar resumo' };
    }
  }),
});
