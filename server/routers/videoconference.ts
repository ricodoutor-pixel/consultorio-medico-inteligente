import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { createJitsiService, defaultJitsiConfig } from '../_core/jitsiIntegration';

const jitsiService = createJitsiService(defaultJitsiConfig);

export const videoconferenceRouter = router({
  /**
   * Gera token de acesso para sala Jitsi
   * Protegido: Apenas usuários autenticados
   */
  generateAccessToken: protectedProcedure
    .input(
      z.object({
        consultationId: z.string(),
        enableRecording: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const roomName = `consultation-${input.consultationId}`;

        const token = jitsiService.generateAccessToken({
          roomName,
          userName: ctx.user.name || 'Usuário',
          userEmail: ctx.user.email || 'user@plantaeraiz.com',
          userId: String(ctx.user.id),
          userRole: 'patient', // TODO: Integrar com schema para obter role correto
          consultationId: input.consultationId,
          enableRecording: input.enableRecording || false,
        });

        return {
          token: token.token,
          roomUrl: token.roomUrl,
          roomName,
          expiresIn: token.expiresIn,
        };
      } catch (error) {
        throw new Error(`Falha ao gerar token Jitsi: ${error}`);
      }
    }),

  /**
   * Valida token de acesso
   */
  validateToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(({ input }) => {
      const isValid = jitsiService.validateToken(input.token);
      return { isValid };
    }),

  /**
   * Processa webhook de evento Jitsi
   * Público: Chamado por webhook
   */
  processWebhookEvent: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        room: z.string(),
        participantId: z.string().optional(),
        participantName: z.string().optional(),
        recordingId: z.string().optional(),
        recordingUrl: z.string().optional(),
        duration: z.number().optional(),
        fileSize: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const event = jitsiService.processWebhookEvent(input);

        if (!event) {
          return { success: false, message: 'Tipo de evento não reconhecido' };
        }

        // TODO: Salvar evento no banco de dados
        console.log('Evento Jitsi processado:', event);

        // Se foi gravação finalizada, gerar relatório
        if (event.type === 'RECORDING_STOPPED') {
          // TODO: Gerar relatório de sessão e salvar no prontuário
        }

        return {
          success: true,
          event,
        };
      } catch (error) {
        throw new Error(`Falha ao processar webhook: ${error}`);
      }
    }),

  /**
   * Gera relatório de sessão para prontuário
   */
  generateSessionReport: protectedProcedure
    .input(
      z.object({
        consultationId: z.string(),
        roomName: z.string(),
        startTime: z.date(),
        endTime: z.date(),
        participants: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            role: z.enum(['patient', 'professional', 'admin']),
            joinTime: z.date(),
            leaveTime: z.date(),
          })
        ),
        recordingUrl: z.string().optional(),
        recordingDuration: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const report = jitsiService.generateSessionReport({
          roomName: input.roomName,
          participants: input.participants,
          recordingUrl: input.recordingUrl,
          recordingDuration: input.recordingDuration,
          startTime: input.startTime,
          endTime: input.endTime,
        });

        // TODO: Salvar relatório no prontuário do paciente
        console.log('Relatório de sessão gerado:', report);

        return {
          success: true,
          report,
        };
      } catch (error) {
        throw new Error(`Falha ao gerar relatório: ${error}`);
      }
    }),

  /**
   * Obtém configuração de iframe Jitsi
   */
  getIframeConfig: protectedProcedure
    .input(
      z.object({
        consultationId: z.string(),
        enableRecording: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const roomName = `consultation-${input.consultationId}`;

        const token = jitsiService.generateAccessToken({
          roomName,
          userName: ctx.user.name || 'Usuário',
          userEmail: ctx.user.email || 'user@plantaeraiz.com',
          userId: String(ctx.user.id),
          userRole: 'patient',
          consultationId: input.consultationId,
          enableRecording: input.enableRecording || false,
        });

        const config = jitsiService.getJitsiIframeConfig(
          {
            roomName,
            userName: ctx.user.name || 'Usuário',
            userEmail: ctx.user.email || 'user@plantaeraiz.com',
            userId: String(ctx.user.id),
            userRole: 'patient',
            consultationId: input.consultationId,
            enableRecording: input.enableRecording || false,
          },
          token.token
        );

        return config;
      } catch (error) {
        throw new Error(`Falha ao obter configuração: ${error}`);
      }
    }),

  /**
   * Valida permissões de usuário
   */
  validateUserPermissions: protectedProcedure
    .input(
      z.object({
        action: z.enum(['join', 'moderate', 'record', 'invite']),
      })
    )
    .query(({ input, ctx }) => {
      const userRole = 'patient'; // TODO: Obter do schema
      const hasPermission = jitsiService.validateUserPermissions(userRole, input.action);

      return {
        hasPermission,
        userRole,
        action: input.action,
      };
    }),
});
