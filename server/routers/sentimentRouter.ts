/**
 * 🎭 SENTIMENT ROUTER — Endpoints tRPC para Análise de Sentimento
 * 
 * Endpoints:
 * - sentiment.analyze - Analisar sentimento de uma mensagem
 * - sentiment.getStats - Obter estatísticas de sentimento do usuário
 * - sentiment.getHistory - Obter histórico de sentimentos
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import SentimentAnalysisService from '../services/sentimentAnalysisService';
import { getDb } from '../db';
import { userSentiments, sentimentStats } from '../../drizzle/schema';
import { eq, desc, limit } from 'drizzle-orm';

export const sentimentRouter = router({
  /**
   * Analisar sentimento de uma mensagem
   */
  analyze: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        messageId: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { message, messageId } = input;
      const userId = ctx.user.openId || String(ctx.user.id);

      try {
        // Analisar sentimento
        const analysis = await SentimentAnalysisService.analyzeSentiment(message);

        // Obter recomendação de ação
        const actionRec = SentimentAnalysisService.getActionRecommendation(
          analysis.emotion,
          analysis.sentiment
        );

        // Salvar no banco de dados
        const db = await getDb();
        if (db && messageId) {
          const id = `sentiment-${Date.now()}`;
          
          await db.insert(userSentiments).values({
            id,
            userId,
            messageId,
            sentiment: analysis.sentiment,
            emotion: analysis.emotion,
            score: analysis.score,
            keywords: JSON.stringify(analysis.keywords),
            messageContent: message
          });

          // Atualizar estatísticas agregadas
          await this.updateUserStats(db, userId);
        }

        return {
          ...analysis,
          action: actionRec
        };
      } catch (error) {
        console.error('[SENTIMENT] Erro ao analisar:', error);
        throw new Error('Erro ao analisar sentimento');
      }
    }),

  /**
   * Obter estatísticas de sentimento do usuário
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.openId || String(ctx.user.id);

    try {
      const db = await getDb();
      if (!db) return null;

      const stats = await db
        .select()
        .from(sentimentStats)
        .where(eq(sentimentStats.userId, userId))
        .limit(1);

      return stats[0] || null;
    } catch (error) {
      console.error('[SENTIMENT] Erro ao obter stats:', error);
      return null;
    }
  }),

  /**
   * Obter histórico de sentimentos
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20)
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user.openId || String(ctx.user.id);

      try {
        const db = await getDb();
        if (!db) return [];

        const history = await db
          .select()
          .from(userSentiments)
          .where(eq(userSentiments.userId, userId))
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
        console.error('[SENTIMENT] Erro ao obter histórico:', error);
        return [];
      }
    }),

  /**
   * Obter insights de sentimento (para dashboard)
   */
  getInsights: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.openId || String(ctx.user.id);

    try {
      const db = await getDb();
      if (!db) return null;

      // Obter últimos 50 sentimentos
      const sentiments = await db
        .select()
        .from(userSentiments)
        .where(eq(userSentiments.userId, userId))
        .orderBy(desc(userSentiments.createdAt))
        .limit(50);

      if (sentiments.length === 0) {
        return {
          totalMessages: 0,
          avgScore: 0,
          trend: 'neutral',
          emotionDistribution: {},
          recentEmotions: []
        };
      }

      // Calcular estatísticas
      const sentimentData = sentiments.map((s) => ({
        score: s.score,
        emotion: s.emotion
      }));

      const stats = SentimentAnalysisService.calculateAggregateStats(sentimentData);

      // Distribuição de emoções
      const emotionDistribution = sentiments.reduce(
        (acc, s) => {
          acc[s.emotion] = (acc[s.emotion] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Tendência (últimos 10 vs anteriores)
      const recent10 = sentiments.slice(0, 10);
      const recentAvg = recent10.reduce((sum, s) => sum + s.score, 0) / recent10.length;
      const trend = recentAvg > 20 ? 'improving' : recentAvg < -20 ? 'declining' : 'stable';

      return {
        totalMessages: sentiments.length,
        avgScore: stats.avgScore,
        trend,
        emotionDistribution,
        recentEmotions: recent10.map((s) => ({
          emotion: s.emotion,
          score: s.score,
          createdAt: s.createdAt
        }))
      };
    } catch (error) {
      console.error('[SENTIMENT] Erro ao obter insights:', error);
      return null;
    }
  })
});

// Helper para atualizar estatísticas do usuário
sentimentRouter.updateUserStats = async (db: any, userId: string) => {
  try {
    const sentiments = await db
      .select()
      .from(userSentiments)
      .where(eq(userSentiments.userId, userId));

    if (sentiments.length === 0) return;

    const sentimentData = sentiments.map((s: any) => ({
      score: s.score,
      emotion: s.emotion
    }));

    const stats = SentimentAnalysisService.calculateAggregateStats(sentimentData);

    // Upsert stats
    const existingStats = await db
      .select()
      .from(sentimentStats)
      .where(eq(sentimentStats.userId, userId))
      .limit(1);

    if (existingStats.length > 0) {
      await db
        .update(sentimentStats)
        .set({
          totalMessages: sentiments.length,
          avgSentimentScore: stats.avgScore,
          positiveCount: stats.positiveCount,
          negativeCount: stats.negativeCount,
          neutralCount: stats.neutralCount,
          mostFrequentEmotion: stats.mostFrequentEmotion
        })
        .where(eq(sentimentStats.userId, userId));
    } else {
      await db.insert(sentimentStats).values({
        id: `stats-${userId}-${Date.now()}`,
        userId,
        totalMessages: sentiments.length,
        avgSentimentScore: stats.avgScore,
        positiveCount: stats.positiveCount,
        negativeCount: stats.negativeCount,
        neutralCount: stats.neutralCount,
        mostFrequentEmotion: stats.mostFrequentEmotion
      });
    }
  } catch (error) {
    console.error('[SENTIMENT] Erro ao atualizar stats:', error);
  }
};

export type SentimentRouter = typeof sentimentRouter;
