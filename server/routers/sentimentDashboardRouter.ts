/**
 * 📊 SENTIMENT DASHBOARD ROUTER — Endpoints tRPC para Dashboard Admin
 * 
 * Endpoints:
 * - sentimentDashboard.getOverview - Visão geral com KPIs
 * - sentimentDashboard.getEmotionDistribution - Distribuição de emoções
 * - sentimentDashboard.getTrendData - Dados de tendência temporal
 * - sentimentDashboard.getTopFrustratedUsers - Usuários mais frustrados
 * - sentimentDashboard.getUserSentimentHistory - Histórico de um usuário
 * - sentimentDashboard.getAggregatedStats - Estatísticas agregadas
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { userSentiments, sentimentStats, users } from '../../drizzle/schema';
import { eq, desc, gte, lte, and, count, sql } from 'drizzle-orm';

export const sentimentDashboardRouter = router({
  /**
   * Visão geral com KPIs principais
   */
  getOverview: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().min(1).max(365).default(30)
      })
    )
    .query(async ({ input, ctx }) => {
      // Verificar se é admin
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado');
      }

      try {
        const db = await getDb();
        if (!db) return null;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.daysBack);

        // Total de mensagens
        const totalMessages = await db
          .select({ count: count() })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate));

        // Score médio
        const avgScore = await db
          .select({
            avg: sql<number>`AVG(${userSentiments.score})`
          })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate));

        // Contagem por sentimento
        const sentimentCounts = await db
          .select({
            sentiment: userSentiments.sentiment,
            count: count()
          })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate))
          .groupBy(userSentiments.sentiment);

        // Usuários únicos
        const uniqueUsers = await db
          .selectDistinct({ userId: userSentiments.userId })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate));

        return {
          totalMessages: totalMessages[0]?.count || 0,
          avgScore: Math.round((avgScore[0]?.avg || 0) * 100) / 100,
          uniqueUsers: uniqueUsers.length,
          sentimentCounts: sentimentCounts.reduce(
            (acc, item) => {
              acc[item.sentiment] = item.count;
              return acc;
            },
            {} as Record<string, number>
          ),
          period: `Últimos ${input.daysBack} dias`
        };
      } catch (error) {
        console.error('[DASHBOARD] Erro ao obter overview:', error);
        return null;
      }
    }),

  /**
   * Distribuição de emoções (para gráfico pizza)
   */
  getEmotionDistribution: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().min(1).max(365).default(30)
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado');
      }

      try {
        const db = await getDb();
        if (!db) return [];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.daysBack);

        const distribution = await db
          .select({
            emotion: userSentiments.emotion,
            count: count(),
            avgScore: sql<number>`AVG(${userSentiments.score})`
          })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate))
          .groupBy(userSentiments.emotion);

        return distribution.map((item) => ({
          name: item.emotion,
          value: item.count,
          avgScore: Math.round((item.avgScore || 0) * 100) / 100,
          percentage: 0 // Será calculado no frontend
        }));
      } catch (error) {
        console.error('[DASHBOARD] Erro ao obter distribuição:', error);
        return [];
      }
    }),

  /**
   * Dados de tendência temporal
   */
  getTrendData: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().min(1).max(365).default(30),
        groupBy: z.enum(['day', 'week', 'month']).default('day')
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado');
      }

      try {
        const db = await getDb();
        if (!db) return [];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.daysBack);

        // Agrupar por data
        const trendData = await db
          .select({
            date: sql<string>`DATE(${userSentiments.createdAt})`,
            count: count(),
            avgScore: sql<number>`AVG(${userSentiments.score})`,
            positiveCount: sql<number>`SUM(CASE WHEN ${userSentiments.score} > 0 THEN 1 ELSE 0 END)`,
            negativeCount: sql<number>`SUM(CASE WHEN ${userSentiments.score} < 0 THEN 1 ELSE 0 END)`
          })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate))
          .groupBy(sql`DATE(${userSentiments.createdAt})`)
          .orderBy(sql`DATE(${userSentiments.createdAt})`);

        return trendData.map((item) => ({
          date: item.date,
          totalMessages: item.count || 0,
          avgScore: Math.round((item.avgScore || 0) * 100) / 100,
          positive: item.positiveCount || 0,
          negative: item.negativeCount || 0
        }));
      } catch (error) {
        console.error('[DASHBOARD] Erro ao obter tendências:', error);
        return [];
      }
    }),

  /**
   * Usuários mais frustrados
   */
  getTopFrustratedUsers: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        daysBack: z.number().min(1).max(365).default(30)
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado');
      }

      try {
        const db = await getDb();
        if (!db) return [];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.daysBack);

        // Usuários com mais mensagens negativas
        const frustratedUsers = await db
          .select({
            userId: userSentiments.userId,
            messageCount: count(),
            avgScore: sql<number>`AVG(${userSentiments.score})`,
            negativeCount: sql<number>`SUM(CASE WHEN ${userSentiments.score} < -20 THEN 1 ELSE 0 END)`,
            frustratedCount: sql<number>`SUM(CASE WHEN ${userSentiments.emotion} IN ('frustrated', 'angry') THEN 1 ELSE 0 END)`
          })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate))
          .groupBy(userSentiments.userId)
          .orderBy(sql`SUM(CASE WHEN ${userSentiments.emotion} IN ('frustrated', 'angry') THEN 1 ELSE 0 END) DESC`)
          .limit(input.limit);

        // Buscar nomes dos usuários
        const userIds = frustratedUsers.map((u) => u.userId);
        const userDetails = await db
          .select({ openId: users.openId, name: users.name, email: users.email })
          .from(users)
          .where(sql`${users.openId} IN (${userIds.join(',')})`);

        const userMap = new Map(userDetails.map((u) => [u.openId, u]));

        return frustratedUsers.map((item) => ({
          userId: item.userId,
          userName: userMap.get(item.userId)?.name || 'Usuário Anônimo',
          userEmail: userMap.get(item.userId)?.email || '',
          messageCount: item.messageCount || 0,
          avgScore: Math.round((item.avgScore || 0) * 100) / 100,
          frustratedCount: item.frustratedCount || 0,
          negativeCount: item.negativeCount || 0,
          riskLevel: (item.frustratedCount || 0) > 5 ? 'high' : (item.frustratedCount || 0) > 2 ? 'medium' : 'low'
        }));
      } catch (error) {
        console.error('[DASHBOARD] Erro ao obter usuários frustrados:', error);
        return [];
      }
    }),

  /**
   * Histórico de sentimento de um usuário
   */
  getUserSentimentHistory: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(20)
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado');
      }

      try {
        const db = await getDb();
        if (!db) return [];

        const history = await db
          .select()
          .from(userSentiments)
          .where(eq(userSentiments.userId, input.userId))
          .orderBy(desc(userSentiments.createdAt))
          .limit(input.limit);

        return history.map((item) => ({
          id: item.id,
          sentiment: item.sentiment,
          emotion: item.emotion,
          score: item.score,
          keywords: item.keywords ? JSON.parse(item.keywords) : [],
          messageContent: item.messageContent,
          createdAt: item.createdAt
        }));
      } catch (error) {
        console.error('[DASHBOARD] Erro ao obter histórico:', error);
        return [];
      }
    }),

  /**
   * Estatísticas agregadas
   */
  getAggregatedStats: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().min(1).max(365).default(30)
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado');
      }

      try {
        const db = await getDb();
        if (!db) return null;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.daysBack);

        // Estatísticas por emoção
        const emotionStats = await db
          .select({
            emotion: userSentiments.emotion,
            count: count(),
            avgScore: sql<number>`AVG(${userSentiments.score})`
          })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate))
          .groupBy(userSentiments.emotion);

        // Estatísticas por sentimento
        const sentimentStats = await db
          .select({
            sentiment: userSentiments.sentiment,
            count: count()
          })
          .from(userSentiments)
          .where(gte(userSentiments.createdAt, startDate))
          .groupBy(userSentiments.sentiment);

        return {
          emotionStats: emotionStats.map((e) => ({
            emotion: e.emotion,
            count: e.count,
            avgScore: Math.round((e.avgScore || 0) * 100) / 100
          })),
          sentimentStats: sentimentStats.map((s) => ({
            sentiment: s.sentiment,
            count: s.count
          }))
        };
      } catch (error) {
        console.error('[DASHBOARD] Erro ao obter stats agregadas:', error);
        return null;
      }
    })
});

export type SentimentDashboardRouter = typeof sentimentDashboardRouter;
