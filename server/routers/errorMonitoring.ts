// ============================================================================
// ERROR MONITORING ROUTER — Endpoints tRPC para Monitoramento
// Planta & Raiz 3.0 — Alertas Inteligentes
// ============================================================================

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { errorMonitoring } from '../services/errorMonitoringService';
import { z } from 'zod';

export const errorMonitoringRouter = router({
  /**
   * Registrar erro do cliente
   */
  logClientError: publicProcedure
    .input(
      z.object({
        message: z.string(),
        stack: z.string().optional(),
        context: z.record(z.any()).optional(),
        endpoint: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const error = errorMonitoring.logError({
        level: 'error',
        message: input.message,
        stack: input.stack,
        context: input.context,
        endpoint: input.endpoint,
      });

      return {
        success: true,
        errorId: error.id,
      };
    }),

  /**
   * Registrar tempo de resposta
   */
  recordResponseTime: publicProcedure
    .input(
      z.object({
        duration: z.number(),
      })
    )
    .mutation(({ input }) => {
      errorMonitoring.recordResponseTime(input.duration);
      return { success: true };
    }),

  /**
   * Obter métricas do sistema
   */
  getMetrics: publicProcedure.query(() => {
    return errorMonitoring.getMetrics();
  }),

  /**
   * Obter saúde do sistema
   */
  getSystemHealth: publicProcedure.query(() => {
    return errorMonitoring.getSystemHealth();
  }),

  /**
   * Obter erros não resolvidos (admin only)
   */
  getUnresolvedErrors: protectedProcedure.query(({ ctx }) => {
    // Verificar se é admin
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    return errorMonitoring.getUnresolvedErrors();
  }),

  /**
   * Obter alertas não notificados (admin only)
   */
  getUnnotifiedAlerts: protectedProcedure.query(({ ctx }) => {
    // Verificar se é admin
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    return errorMonitoring.getUnnotifiedAlerts();
  }),

  /**
   * Resolver erro (admin only)
   */
  resolveError: protectedProcedure
    .input(
      z.object({
        errorId: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      // Verificar se é admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      errorMonitoring.resolveError(input.errorId);

      return {
        success: true,
        message: 'Erro resolvido',
      };
    }),

  /**
   * Obter status de saúde em tempo real
   */
  getHealthStatus: publicProcedure.query(() => {
    const health = errorMonitoring.getSystemHealth();
    const metrics = errorMonitoring.getMetrics();

    return {
      status: health.status,
      uptime: health.uptime,
      errorRate: health.errorRate,
      avgResponseTime: health.avgResponseTime,
      activeErrors: health.activeErrors,
      activeAlerts: health.activeAlerts,
      totalErrors: metrics.totalErrors,
      errorsByLevel: metrics.errorsByLevel,
      errorsByType: metrics.errorsByType,
      p95ResponseTime: metrics.p95ResponseTime,
      p99ResponseTime: metrics.p99ResponseTime,
    };
  }),
});

export default errorMonitoringRouter;
