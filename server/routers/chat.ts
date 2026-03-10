import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const chatRouter = router({
  // Obter conversas
  getConversations: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          participantName: 'Dr. Carlos Silva',
          participantImage: '👨‍⚕️',
          lastMessage: 'Como você está se sentindo?',
          lastMessageTime: '2026-02-23 14:30',
          unreadCount: 2,
        },
      ];
    }),

  // Obter mensagens de uma conversa
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          sender: 'Dr. Carlos Silva',
          message: 'Olá! Como posso ajudar?',
          timestamp: '2026-02-23 14:00',
          type: 'text',
        },
        {
          id: 2,
          sender: 'Você',
          message: 'Gostaria de discutir meu tratamento',
          timestamp: '2026-02-23 14:05',
          type: 'text',
        },
      ];
    }),

  // Enviar mensagem
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      message: z.string(),
      type: z.enum(['text', 'image', 'file']).default('text'),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        id: Math.random(),
        sender: ctx.user.id,
        message: input.message,
        timestamp: new Date(),
        type: input.type,
      };
    }),

  // Criar conversa
  createConversation: protectedProcedure
    .input(z.object({ professionalId: z.number() }))
    .mutation(async ({ input }) => {
      return {
        conversationId: Math.random(),
        participantId: input.professionalId,
        createdAt: new Date(),
      };
    }),

  // Marcar como lido
  markAsRead: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  // Obter sugestões de resposta (IA)
  getAISuggestions: protectedProcedure
    .input(z.object({ conversationId: z.number(), lastMessage: z.string() }))
    .query(async ({ input }) => {
      return [
        'Obrigado pela informação',
        'Entendi, e agora?',
        'Pode me explicar melhor?',
      ];
    }),

  // Enviar arquivo
  uploadFile: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      fileName: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ input }) => {
      return {
        fileId: Math.random(),
        uploadUrl: 'https://planta-raiz.com/upload/abc123',
      };
    }),

  // Obter estatísticas de chat
  getChatStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalConversations: 5,
        unreadMessages: 2,
        avgResponseTime: '5 min',
        lastActive: '2026-02-23 14:30',
      };
    }),
});
