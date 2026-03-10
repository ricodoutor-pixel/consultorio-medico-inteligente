import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const profileRouter = router({
  // Obter perfil do usuário
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        id: ctx.user.id,
        name: ctx.user.name || 'Usuário',
        email: ctx.user.email,
        phone: '(11) 98765-4321',
        birthDate: '1990-05-15',
        gender: 'M',
        cpf: '123.456.789-00',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        avatar: '👤',
        verified: true,
      };
    }),

  // Atualizar perfil
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      birthDate: z.string().optional(),
      gender: z.enum(['M', 'F', 'O']).optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        message: 'Perfil atualizado com sucesso',
        profile: { ...input, id: ctx.user.id },
      };
    }),

  // Alterar senha
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
      confirmPassword: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new Error('Senhas não conferem');
      }
      return { success: true, message: 'Senha alterada com sucesso' };
    }),

  // Obter histórico de atividades
  getActivityHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          action: 'Consulta realizada',
          description: 'Consulta com Dr. Carlos Silva',
          timestamp: '2026-02-15 14:00',
          type: 'consultation',
        },
        {
          id: 2,
          action: 'Medicação adicionada',
          description: 'Óleo CBD 500mg',
          timestamp: '2026-02-15 14:30',
          type: 'medication',
        },
      ];
    }),

  // Obter configurações de privacidade
  getPrivacySettings: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        profileVisibility: 'private',
        showConsultationHistory: false,
        allowMessages: true,
        dataSharing: false,
        twoFactorAuth: false,
      };
    }),

  // Atualizar configurações de privacidade
  updatePrivacySettings: protectedProcedure
    .input(z.object({
      profileVisibility: z.enum(['public', 'private']).optional(),
      showConsultationHistory: z.boolean().optional(),
      allowMessages: z.boolean().optional(),
      dataSharing: z.boolean().optional(),
      twoFactorAuth: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Configurações de privacidade atualizadas' };
    }),

  // Deletar conta
  deleteAccount: protectedProcedure
    .input(z.object({ password: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        message: 'Conta deletada. Você será redirecionado em 5 segundos.',
      };
    }),

  // Obter estatísticas do perfil
  getProfileStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalConsultations: 12,
        totalSpent: 1800.00,
        memberSince: '2025-06-15',
        healthScore: 78,
        adherenceRate: 92,
      };
    }),

  // Verificar email
  verifyEmail: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Email verificado com sucesso' };
    }),

  // Reenviar código de verificação
  resendVerificationCode: protectedProcedure
    .mutation(async ({ ctx }) => {
      return { success: true, message: 'Código enviado para ' + ctx.user.email };
    }),
});
