/**
 * Transactions Router
 * Handles transaction history, deposits, and withdrawals
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getUserTransactions, createWithdrawalRequest, getUserWithdrawalRequests, getUserBalance } from '../db';

export const transactionRouter = router({
  /**
   * Get user transaction history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        type: z.enum(['deposit', 'withdrawal', 'earnings', 'commission']).optional(),
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const transactions = await getUserTransactions(ctx.user.id);

        let filtered = transactions;
        if (input.type) {
          filtered = filtered.filter((t) => t.type === input.type);
        }

        const paginated = filtered.slice(input.offset, input.offset + input.limit);

        return {
          success: true,
          data: {
            transactions: paginated.map((t) => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              status: t.status,
              description: t.description,
              createdAt: t.createdAt,
            })),
            total: filtered.length,
          },
        };
      } catch (error) {
        console.error('[TransactionRouter] Error getting transaction history:', error);
        return { success: false, error: 'Erro ao buscar historico de transacoes' };
      }
    }),

  /**
   * Request withdrawal
   */
  requestWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().positive(),
        bankData: z.object({
          accountType: z.enum(['checking', 'savings']),
          accountNumber: z.string(),
          bankCode: z.string(),
          accountHolder: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const balance = await getUserBalance(ctx.user.id);
        if (!balance || balance.availableBalance < input.amount) {
          return { success: false, error: 'Saldo insuficiente para saque' };
        }

        const result = await createWithdrawalRequest({
          userId: ctx.user.id,
          amount: input.amount,
          status: 'pending',
          bankData: JSON.stringify(input.bankData),
        });

        if (!result) {
          return { success: false, error: 'Erro ao criar solicitacao de saque' };
        }

        return { success: true, data: { message: 'Solicitacao de saque criada com sucesso' } };
      } catch (error) {
        console.error('[TransactionRouter] Error requesting withdrawal:', error);
        return { success: false, error: 'Erro ao solicitar saque' };
      }
    }),

  /**
   * Get withdrawal requests
   */
  getWithdrawals: protectedProcedure.query(async ({ ctx }) => {
    try {
      const withdrawals = await getUserWithdrawalRequests(ctx.user.id);

      return {
        success: true,
        data: withdrawals.map((w) => ({
          id: w.id,
          amount: w.amount,
          status: w.status,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })),
      };
    } catch (error) {
      console.error('[TransactionRouter] Error getting withdrawals:', error);
      return { success: false, error: 'Erro ao buscar saques' };
    }
  }),
});
