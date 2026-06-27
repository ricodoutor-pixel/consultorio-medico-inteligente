// ============================================================================
// MONITORING ROUTER — ENDPOINTS DE MONITORAMENTO
// Planta & Raiz 3.0 — Alertas Inteligentes e Métricas em Tempo Real
// ============================================================================

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { createLogger } from '../_core/logger';
import { z } from 'zod';
import { paymentMonitoringService } from '../services/paymentMonitoringService';
import { getIntegrationHealth, logIntegrationStatus } from '../services/integrationHealth';

const logger = createLogger('monitoring');

export const monitoringRouter = router({
  /**
   * Obter métricas atuais de pagamento
   */
  getMetrics: publicProcedure.query(async () => {
    try {
      const metrics = paymentMonitoringService.getCurrentMetrics();

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      logger.error('erro ao obter métricas', { error });
      return {
        success: false,
        error: 'Erro ao obter métricas',
      };
    }
  }),

  /**
   * Obter anomalias não resolvidas
   */
  getAnomalies: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Apenas admin pode acessar
      if (ctx.user?.role !== 'admin') {
        return {
          success: false,
          error: 'Acesso negado',
        };
      }

      const anomalies = paymentMonitoringService.getUnresolvedAnomalies();

      return {
        success: true,
        data: anomalies,
        count: anomalies.length,
      };
    } catch (error) {
      logger.error('erro ao obter anomalias', { error });
      return {
        success: false,
        error: 'Erro ao obter anomalias',
      };
    }
  }),

  /**
   * Obter relatório de anomalias
   */
  getAnomalyReport: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Apenas admin pode acessar
      if (ctx.user?.role !== 'admin') {
        return {
          success: false,
          error: 'Acesso negado',
        };
      }

      const report = paymentMonitoringService.getAnomalyReport();

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      logger.error('erro ao obter relatório', { error });
      return {
        success: false,
        error: 'Erro ao obter relatório',
      };
    }
  }),

  /**
   * Iniciar monitoramento
   */
  startMonitoring: protectedProcedure
    .input(
      z.object({
        intervalMs: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Apenas admin pode acessar
        if (ctx.user?.role !== 'admin') {
          return {
            success: false,
            error: 'Acesso negado',
          };
        }

        paymentMonitoringService.startMonitoring(input.intervalMs || 60000);

        return {
          success: true,
          message: 'Monitoramento iniciado',
        };
      } catch (error) {
        console.error('[Monitoring] Erro ao iniciar monitoramento:', error);
        return {
          success: false,
          error: 'Erro ao iniciar monitoramento',
        };
      }
    }),

  /**
   * Parar monitoramento
   */
  stopMonitoring: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Apenas admin pode acessar
      if (ctx.user?.role !== 'admin') {
        return {
          success: false,
          error: 'Acesso negado',
        };
      }

      paymentMonitoringService.stopMonitoring();

      return {
        success: true,
        message: 'Monitoramento parado',
      };
    } catch (error) {
      logger.error('erro ao parar monitoramento', { error });
      return {
        success: false,
        error: 'Erro ao parar monitoramento',
      };
    }
  }),

  /**
   * Obter saúde do sistema
   */
  getSystemHealth: publicProcedure.query(async () => {
    try {
      const metrics = paymentMonitoringService.getCurrentMetrics();
      const integrations = getIntegrationHealth();
      logIntegrationStatus();

      const health = {
        status: 'healthy' as const,
        timestamp: new Date(),
        metrics: {
          successRate: metrics?.successRate || 0,
          declineRate: metrics?.declineRate || 0,
          fraudRate: metrics?.fraudRate || 0,
          averageAmount: metrics?.averageAmount || 0,
        },
        integrations,
      };

      // Verificar se há problemas críticos
      if (metrics && metrics.declineRate > 0.15) {
        health.status = 'warning';
      }

      if (metrics && metrics.fraudRate > 0.05) {
        health.status = 'critical';
      }

      if (integrations.some((integration) => !integration.configured)) {
        health.status = health.status === 'critical' ? 'critical' : 'warning';
      }

      return {
        success: true,
        data: health,
      };
    } catch (error) {
      logger.error('erro ao obter saúde do sistema', { error });
      return {
        success: false,
        error: 'Erro ao obter saúde do sistema',
      };
    }
  }),
});
