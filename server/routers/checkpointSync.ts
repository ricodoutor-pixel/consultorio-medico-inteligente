/**
 * Checkpoint Sync Router
 * Endpoints tRPC para sincronização de checkpoints com GitHub em tempo real
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getCheckpointSync } from "../services/CheckpointSyncServiceV2";

export const checkpointSyncRouter = router({
  /**
   * Obter status atual de sincronização
   */
  getStatus: publicProcedure.query(async () => {
    const syncService = getCheckpointSync();
    if (!syncService) {
      return {
        error: "Serviço de sincronização não inicializado",
      };
    }

    const status = syncService.getStatus();
    const stats = await syncService.getSyncStats();

    return {
      ...status,
      ...stats,
    };
  }),

  /**
   * Obter histórico de sincronizações
   */
  getHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const syncService = getCheckpointSync();
      if (!syncService) {
        return {
          error: "Serviço de sincronização não inicializado",
          history: [],
        };
      }

      const history = await syncService.getSyncHistory(input.limit);
      return {
        history,
        total: history.length,
      };
    }),

  /**
   * Obter estatísticas de sincronização
   */
  getStats: publicProcedure.query(async () => {
    const syncService = getCheckpointSync();
    if (!syncService) {
      return {
        error: "Serviço de sincronização não inicializado",
      };
    }

    return await syncService.getSyncStats();
  }),

  /**
   * Fazer commit manual (admin only)
   */
  manualCommit: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar se é admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Apenas administradores podem fazer commits manuais");
      }

      const syncService = getCheckpointSync();
      if (!syncService) {
        throw new Error("Serviço de sincronização não inicializado");
      }

      console.log(`[Checkpoint Sync] Commit manual solicitado: ${input.message}`);

      const result = await syncService.manualCommit(input.message);

      return {
        success: result.success,
        message: result.message,
      };
    }),

  /**
   * Fazer pull do GitHub (admin only)
   */
  pullFromGitHub: protectedProcedure.mutation(async ({ ctx }) => {
    // Verificar se é admin
    if (ctx.user?.role !== "admin") {
      throw new Error("Apenas administradores podem fazer pull do GitHub");
    }

    const syncService = getCheckpointSync();
    if (!syncService) {
      throw new Error("Serviço de sincronização não inicializado");
    }

    console.log("[Checkpoint Sync] Pull do GitHub solicitado");

    const result = await syncService.pullFromGitHub();

    return {
      success: result.success,
      message: result.message,
    };
  }),

  /**
   * Forçar sincronização imediata (admin only)
   */
  forceSync: protectedProcedure.mutation(async ({ ctx }) => {
    // Verificar se é admin
    if (ctx.user?.role !== "admin") {
      throw new Error("Apenas administradores podem forçar sincronização");
    }

    const syncService = getCheckpointSync();
    if (!syncService) {
      throw new Error("Serviço de sincronização não inicializado");
    }

    console.log("[Checkpoint Sync] Sincronização forçada solicitada");

    try {
      // Fazer commit automático
      const commitResult = await syncService.manualCommit(
        "🔄 Sincronização forçada"
      );

      return {
        success: commitResult.success,
        message: commitResult.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  /**
   * Obter últimas mudanças
   */
  getRecentChanges: publicProcedure
    .input(
      z.object({
        hours: z.number().min(1).max(168).default(24),
      })
    )
    .query(async ({ input }) => {
      const syncService = getCheckpointSync();
      if (!syncService) {
        return {
          error: "Serviço de sincronização não inicializado",
          changes: [],
        };
      }

      const history = await syncService.getSyncHistory(1000);
      const cutoffTime = Date.now() - input.hours * 60 * 60 * 1000;

      const recentChanges = history.filter(h => h.timestamp > cutoffTime);

      return {
        changes: recentChanges,
        total: recentChanges.length,
        period: `${input.hours} horas`,
      };
    }),

  /**
   * Obter resumo de sincronização
   */
  getSummary: publicProcedure.query(async () => {
    const syncService = getCheckpointSync();
    if (!syncService) {
      return {
        error: "Serviço de sincronização não inicializado",
      };
    }

    const stats = await syncService.getSyncStats();
    const history = await syncService.getSyncHistory(10);
    const status = syncService.getStatus();

    const successRate =
      stats.totalSyncs > 0
        ? Math.round((stats.successfulSyncs / stats.totalSyncs) * 100)
        : 0;

    return {
      status: {
        isRunning: status.isRunning,
        syncInProgress: status.syncInProgress,
      },
      statistics: {
        totalSyncs: stats.totalSyncs,
        successfulSyncs: stats.successfulSyncs,
        failedSyncs: stats.failedSyncs,
        successRate: `${successRate}%`,
        averageFilesPerSync: stats.averageFilesPerSync,
        averageLinesPerSync: stats.averageLinesPerSync,
      },
      lastSync: {
        time: new Date(stats.lastSyncTime).toISOString(),
        ago: Math.round((Date.now() - stats.lastSyncTime) / 1000) + "s",
      },
      recentActivity: history.map(h => ({
        id: h.id,
        timestamp: new Date(h.timestamp).toISOString(),
        type: h.type,
        status: h.status,
        message: h.message,
      })),
    };
  }),
});
