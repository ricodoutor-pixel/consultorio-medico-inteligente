/**
 * Admin Router
 * Administrative functions for managing users, investments, and platform
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getPendingWithdrawalRequests, updateWithdrawalRequest, getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Admin-only procedure wrapper
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * Get pending withdrawal requests
   */
  getPendingWithdrawals: adminProcedure.query(async () => {
    try {
      const withdrawals = await getPendingWithdrawalRequests();
      return {
        success: true,
        data: withdrawals.map((w) => ({
          id: w.id,
          userId: w.userId,
          amount: w.amount,
          status: w.status,
          createdAt: w.createdAt,
        })),
      };
    } catch (error) {
      console.error('[AdminRouter] Error getting pending withdrawals:', error);
      return { success: false, error: 'Erro ao buscar saques pendentes' };
    }
  }),

  /**
   * Approve withdrawal request
   */
  approveWithdrawal: adminProcedure
    .input(
      z.object({
        withdrawalId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateWithdrawalRequest(input.withdrawalId, {
          status: 'approved',
        });
        return { success: true, message: 'Saque aprovado' };
      } catch (error) {
        console.error('[AdminRouter] Error approving withdrawal:', error);
        return { success: false, error: 'Erro ao aprovar saque' };
      }
    }),

  /**
   * Reject withdrawal request
   */
  rejectWithdrawal: adminProcedure
    .input(
      z.object({
        withdrawalId: z.number().int().positive(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateWithdrawalRequest(input.withdrawalId, {
          status: 'rejected',
          rejectionReason: input.reason,
        });
        return { success: true, message: 'Saque rejeitado' };
      } catch (error) {
        console.error('[AdminRouter] Error rejecting withdrawal:', error);
        return { success: false, error: 'Erro ao rejeitar saque' };
      }
    }),

  /**
   * Get all users
   */
  getAllUsers: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false, error: 'Banco de dados nao disponivel' };
      }

      const allUsers = await db.select().from(users);
      return {
        success: true,
        data: allUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          lastSignedIn: u.lastSignedIn,
        })),
      };
    } catch (error) {
      console.error('[AdminRouter] Error getting all users:', error);
      return { success: false, error: 'Erro ao buscar usuarios' };
    }
  }),

  /**
   * Promote user to admin
   */
  promoteToAdmin: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: 'Banco de dados nao disponivel' };
        }

        await db.update(users).set({ role: 'admin' }).where(eq(users.id, input.userId));
        return { success: true, message: 'Usuario promovido a administrador' };
      } catch (error) {
        console.error('[AdminRouter] Error promoting user:', error);
        return { success: false, error: 'Erro ao promover usuario' };
      }
    }),

  /**
   * Get platform statistics
   */
  getStats: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false, error: 'Banco de dados nao disponivel' };
      }

      const allUsers = await db.select().from(users);

      return {
        success: true,
        data: {
          totalUsers: allUsers.length,
          adminUsers: allUsers.filter((u) => u.role === 'admin').length,
          regularUsers: allUsers.filter((u) => u.role === 'user').length,
        },
      };
    } catch (error) {
      console.error('[AdminRouter] Error getting stats:', error);
      return { success: false, error: 'Erro ao buscar estatisticas' };
    }
  }),
});
