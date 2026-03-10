import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const analyticsRouter = router({
  // Dashboard geral
  getDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalConsultations: 12,
        totalSpent: 1800.00,
        activeSubscriptions: 2,
        nextConsultation: '2026-02-24 14:00',
        healthScore: 78,
      };
    }),

  // Gráfico de consultas por mês
  getConsultationsChart: protectedProcedure
    .input(z.object({ period: z.enum(['month', 'quarter', 'year']).default('month') }))
    .query(async ({ input }) => {
      return {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        data: [2, 4, 3, 5, 6, 4],
      };
    }),

  // Gráfico de gastos
  getExpensesChart: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        labels: ['Consultas', 'Medicamentos', 'Produtos'],
        data: [1200, 450, 150],
      };
    }),

  // Gráfico de saúde
  getHealthChart: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        labels: ['Ansiedade', 'Insônia', 'Dor', 'Inflamação'],
        data: [85, 72, 68, 90],
      };
    }),

  // Relatório de prescrições
  getPrescriptionsReport: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          medication: 'Óleo CBD 500mg',
          dosage: '1 gota 2x ao dia',
          startDate: '2026-01-15',
          endDate: '2026-02-15',
          effectiveness: 85,
        },
      ];
    }),

  // Relatório de atividade
  getActivityReport: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return {
        totalActivities: 45,
        consultations: 12,
        medicationAdherence: 92,
        averageRating: 4.8,
      };
    }),

  // Exportar dados
  exportData: protectedProcedure
    .input(z.object({ format: z.enum(['pdf', 'csv', 'json']) }))
    .mutation(async ({ input, ctx }) => {
      return {
        downloadUrl: 'https://planta-raiz.com/export/abc123.' + input.format,
        fileName: 'relatorio-' + new Date().toISOString() + '.' + input.format,
      };
    }),

  // Obter tendências
  getTrends: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        consultationTrend: '+25%',
        healthScoreTrend: '+15%',
        medicationAdherenceTrend: '+8%',
        satisfactionTrend: '+12%',
      };
    }),

  // Obter recomendações personalizadas
  getRecommendations: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        'Aumente a frequência de consultas para melhor acompanhamento',
        'Considere adicionar exercícios físicos ao seu tratamento',
        'Melhore a adesão ao medicamento (92% de conformidade)',
      ];
    }),
});
