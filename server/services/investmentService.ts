/**
 * Investment Service
 * Handles investment creation, management, and daily returns calculation
 */

import {
  getInvestmentPlans,
  getInvestmentPlanById,
  getUserInvestments,
  createInvestment,
  getUserBalance,
  updateUserBalance,
  createTransaction,
  createNotification,
} from '../db';
import type { InsertInvestment, Investment, InvestmentPlan } from '../../drizzle/schema';

/**
 * Get all available investment plans
 */
export async function getAvailablePlans(): Promise<InvestmentPlan[]> {
  return await getInvestmentPlans();
}

/**
 * Get plan details by ID
 */
export async function getPlanDetails(planId: number): Promise<InvestmentPlan | undefined> {
  return await getInvestmentPlanById(planId);
}

/**
 * Create a new investment
 */
export async function createNewInvestment(
  userId: number,
  planId: number,
  amount: number
): Promise<{ success: boolean; error?: string; investment?: Investment }> {
  try {
    // Validate plan exists
    const plan = await getPlanDetails(planId);
    if (!plan) {
      return { success: false, error: 'Plano de investimento não encontrado' };
    }

    // Validate amount is within plan range
    if (amount < plan.minAmount || amount > plan.maxAmount) {
      return {
        success: false,
        error: `Valor deve estar entre R$ ${(plan.minAmount / 100).toFixed(2)} e R$ ${(plan.maxAmount / 100).toFixed(2)}`,
      };
    }

    // Get user balance
    let balance = await getUserBalance(userId);
    if (!balance) {
      return { success: false, error: 'Saldo do usuário não encontrado' };
    }

    // Check if user has sufficient balance
    if (balance.availableBalance < amount) {
      return { success: false, error: 'Saldo insuficiente para este investimento' };
    }

    // Create investment
    const investment: InsertInvestment = {
      userId,
      planId,
      amount,
      accumulatedReturns: 0,
      status: 'active',
    };

    await createInvestment(investment);

    // Update user balance
    await updateUserBalance(userId, {
      availableBalance: balance.availableBalance - amount,
      investedAmount: balance.investedAmount + amount,
    });

    // Create transaction record
    await createTransaction({
      userId,
      type: 'deposit',
      amount,
      status: 'completed',
      description: `Investimento em plano ${plan.name}`,
    });

    // Create notification
    await createNotification({
      userId,
      type: 'deposit',
      title: 'Investimento Realizado',
      message: `Você investiu R$ ${(amount / 100).toFixed(2)} no plano ${plan.name}`,
      read: 0,
    });

    return { success: true };
  } catch (error) {
    console.error('[InvestmentService] Error creating investment:', error);
    return { success: false, error: 'Erro ao criar investimento' };
  }
}

/**
 * Get user's active investments
 */
export async function getUserActiveInvestments(userId: number): Promise<Investment[]> {
  const investments = await getUserInvestments(userId);
  return investments.filter((inv) => inv.status === 'active');
}

/**
 * Calculate daily returns for all active investments
 * This should be called by a cron job daily
 */
export async function calculateDailyReturns(): Promise<{ processed: number; error?: string }> {
  try {
    const plans = await getAvailablePlans();
    const investments = await getUserInvestments(0); // This needs to be updated to get all investments

    let processed = 0;

    // In production, this would fetch all active investments from the database
    // For now, this is a placeholder that shows the logic

    console.log('[InvestmentService] Daily returns calculation completed. Processed:', processed);
    return { processed };
  } catch (error) {
    console.error('[InvestmentService] Error calculating daily returns:', error);
    return { processed: 0, error: 'Erro ao calcular rendimentos diários' };
  }
}

/**
 * Get investment summary for user
 */
export async function getInvestmentSummary(userId: number) {
  try {
    const investments = await getUserActiveInvestments(userId);
    const balance = await getUserBalance(userId);

    if (!balance) {
      return null;
    }

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalReturns = investments.reduce((sum, inv) => sum + inv.accumulatedReturns, 0);

    return {
      totalInvested,
      totalReturns,
      availableBalance: balance.availableBalance,
      investedAmount: balance.investedAmount,
      totalEarnings: balance.totalEarnings,
      activeInvestments: investments.length,
    };
  } catch (error) {
    console.error('[InvestmentService] Error getting investment summary:', error);
    return null;
  }
}
