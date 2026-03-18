/**
 * 🐸 VERDINHO CHAT ROUTER — Endpoints tRPC para Chat com IA
 * 
 * Endpoints:
 * - verdinho.sendMessage - Enviar mensagem e receber resposta IA
 * - verdinho.getHistory - Obter histórico de conversas
 * - verdinho.clearHistory - Limpar histórico
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { invokeLLM } from '../_core/llm';
import { getDb } from '../db';
import { conversationHistory } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const verdinhoChatRouter = router({
  /**
   * Enviar mensagem para Verdinho IA
   * Retorna resposta gerada pela IA
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string()
            })
          )
          .optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { message, conversationHistory: history = [] } = input;
      const userId = ctx.user.openId || String(ctx.user.id);

      try {
        // Construir contexto da conversa
        const systemPrompt = `Você é o Verdinho, um assistente IA amigável e prestativo da plataforma Planta & Raiz. 
Sua missão é ajudar usuários com dúvidas sobre:
- Acesso a medicamentos à base de cannabis
- Agendamento de consultas com especialistas
- Planos e preços
- Segurança de dados e privacidade
- Processo de consulta telemedicina
- Prescrições digitais
- Conformidade ANVISA/LGPD

Sempre seja educado, empático e forneça informações precisas baseadas na plataforma.
Se não souber a resposta, sugira contatar o suporte.
Responda em português brasileiro.`;

        // Preparar mensagens para LLM
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...history.map((h) => ({
            role: h.role as 'user' | 'assistant',
            content: h.content
          })),
          { role: 'user' as const, content: message }
        ];

        // Chamar LLM
        const response = await invokeLLM({
          messages: messages as any
        });

        const aiResponse =
          response.choices[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';

        // Salvar no banco de dados
        const db = await getDb();
        if (db) {
          // Salvar mensagem do usuário no banco
          await db.insert(conversationHistory).values({
            id: `msg-user-${Date.now()}`,
            userId: userId,
            role: 'user',
            content: message
          });

          // Salvar resposta da IA no banco
          await db.insert(conversationHistory).values({
            id: `msg-assistant-${Date.now()}`,
            userId: userId,
            role: 'assistant',
            content: aiResponse
          });
        }

        return {
          response: aiResponse,
          timestamp: new Date()
        };
      } catch (error) {
        console.error('[VERDINHO] Erro ao processar mensagem:', error);
        throw new Error('Erro ao processar sua mensagem. Tente novamente.');
      }
    }),

  /**
   * Obter histórico de conversas do usuário
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.openId || String(ctx.user.id);

    try {
      const db = await getDb();
      if (!db) return [];

      const history = await db
        .select()
        .from(conversationHistory)
        .where(eq(conversationHistory.userId, userId))
        .orderBy(conversationHistory.createdAt)
        .limit(50); // Últimas 50 mensagens

      return history.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt
      }));
    } catch (error) {
      console.error('[VERDINHO] Erro ao obter histórico:', error);
      return [];
    }
  }),

  /**
   * Limpar histórico de conversas do usuário
   */
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.openId || String(ctx.user.id);

    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Deletar todas as mensagens do usuário
      await db.delete(conversationHistory).where(eq(conversationHistory.userId, userId));

      return {
        success: true,
        message: 'Histórico de conversas limpo com sucesso'
      };
    } catch (error) {
      console.error('[VERDINHO] Erro ao limpar histórico:', error);
      throw new Error('Erro ao limpar histórico. Tente novamente.');
    }
  })
});

export type VerdinhoChatRouter = typeof verdinhoChatRouter;
