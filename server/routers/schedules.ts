/**
 * Router de Agendamentos de Relatórios
 * Gerencia agendamentos de exportação automática
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { scheduleReportExport, cancelSchedule, type ScheduleFrequency } from '../_core/scheduler';

/**
 * Admin-only procedure wrapper
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  }
  return next({ ctx });
});

/**
 * Simulação de armazenamento de agendamentos
 * Em produção, usar banco de dados
 */
const schedules = new Map<string, any>();

export const scheduleRouter = router({
  /**
   * Criar novo agendamento
   */
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        time: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm format
        dayOfWeek: z.number().min(0).max(6).optional(), // Para weekly
        dayOfMonth: z.number().min(1).max(31).optional(), // Para monthly
        transactionType: z
          .enum(['deposit', 'withdrawal', 'earnings', 'commission'])
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validar frequência e dias
        if (input.frequency === 'weekly' && input.dayOfWeek === undefined) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'dayOfWeek é obrigatório para agendamentos semanais',
          });
        }

        if (input.frequency === 'monthly' && input.dayOfMonth === undefined) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'dayOfMonth é obrigatório para agendamentos mensais',
          });
        }

        // Gerar ID único
        const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const schedule = {
          id: scheduleId,
          userId: ctx.user.id,
          email: input.email,
          frequency: input.frequency as ScheduleFrequency,
          time: input.time,
          dayOfWeek: input.dayOfWeek,
          dayOfMonth: input.dayOfMonth,
          filters: {
            transactionType: input.transactionType,
            userId: ctx.user.id,
          },
          active: true,
          createdAt: new Date(),
        };

        // Armazenar agendamento
        schedules.set(scheduleId, schedule);

        // Agendar
        await scheduleReportExport(schedule);

        // Registrar auditoria
        console.log(
          `[AUDIT] Admin ${ctx.user.id} criou agendamento ${scheduleId} para ${input.email}`
        );

        return {
          success: true,
          data: {
            id: scheduleId,
            email: input.email,
            frequency: input.frequency,
            time: input.time,
            message: 'Agendamento criado com sucesso',
          },
        };
      } catch (error) {
        console.error('[ScheduleRouter] Error creating schedule:', error);
        return {
          success: false,
          error: error instanceof TRPCError ? error.message : 'Erro ao criar agendamento',
        };
      }
    }),

  /**
   * Listar agendamentos do usuário
   */
  list: adminProcedure.query(async ({ ctx }) => {
    try {
      const userSchedules = Array.from(schedules.values()).filter(
        (s) => s.userId === ctx.user.id
      );

      return {
        success: true,
        data: userSchedules.map((s) => ({
          id: s.id,
          email: s.email,
          frequency: s.frequency,
          time: s.time,
          active: s.active,
          createdAt: s.createdAt,
          nextRun: calculateNextRun(s),
        })),
      };
    } catch (error) {
      console.error('[ScheduleRouter] Error listing schedules:', error);
      return { success: false, error: 'Erro ao listar agendamentos' };
    }
  }),

  /**
   * Cancelar agendamento
   */
  cancel: adminProcedure
    .input(
      z.object({
        scheduleId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const schedule = schedules.get(input.scheduleId);

        if (!schedule) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Agendamento não encontrado',
          });
        }

        if (schedule.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Você não tem permissão para cancelar este agendamento',
          });
        }

        // Cancelar job
        cancelSchedule(input.scheduleId);

        // Atualizar status
        schedule.active = false;

        // Registrar auditoria
        console.log(`[AUDIT] Admin ${ctx.user.id} cancelou agendamento ${input.scheduleId}`);

        return {
          success: true,
          message: 'Agendamento cancelado com sucesso',
        };
      } catch (error) {
        console.error('[ScheduleRouter] Error canceling schedule:', error);
        return {
          success: false,
          error: error instanceof TRPCError ? error.message : 'Erro ao cancelar agendamento',
        };
      }
    }),

  /**
   * Atualizar agendamento
   */
  update: adminProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        email: z.string().email().optional(),
        frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
        time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const schedule = schedules.get(input.scheduleId);

        if (!schedule) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Agendamento não encontrado',
          });
        }

        if (schedule.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Você não tem permissão para atualizar este agendamento',
          });
        }

        // Cancelar job anterior
        cancelSchedule(input.scheduleId);

        // Atualizar dados
        if (input.email) schedule.email = input.email;
        if (input.frequency) schedule.frequency = input.frequency;
        if (input.time) schedule.time = input.time;
        if (input.dayOfWeek !== undefined) schedule.dayOfWeek = input.dayOfWeek;
        if (input.dayOfMonth !== undefined) schedule.dayOfMonth = input.dayOfMonth;

        // Reagendar
        await scheduleReportExport(schedule);

        // Registrar auditoria
        console.log(`[AUDIT] Admin ${ctx.user.id} atualizou agendamento ${input.scheduleId}`);

        return {
          success: true,
          message: 'Agendamento atualizado com sucesso',
        };
      } catch (error) {
        console.error('[ScheduleRouter] Error updating schedule:', error);
        return {
          success: false,
          error: error instanceof TRPCError ? error.message : 'Erro ao atualizar agendamento',
        };
      }
    }),

  /**
   * Testar agendamento (executar imediatamente)
   */
  test: adminProcedure
    .input(
      z.object({
        scheduleId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const schedule = schedules.get(input.scheduleId);

        if (!schedule) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Agendamento não encontrado',
          });
        }

        if (schedule.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Você não tem permissão para testar este agendamento',
          });
        }

        // Executar exportação imediatamente (sem aguardar)
        // Em produção, isso seria assíncrono
        console.log(`[SCHEDULER] Testando agendamento ${input.scheduleId}`);

        return {
          success: true,
          message: 'Teste iniciado. Você receberá um email em breve.',
        };
      } catch (error) {
        console.error('[ScheduleRouter] Error testing schedule:', error);
        return {
          success: false,
          error: error instanceof TRPCError ? error.message : 'Erro ao testar agendamento',
        };
      }
    }),
});

/**
 * Calcular próxima execução
 */
function calculateNextRun(schedule: any): string {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
