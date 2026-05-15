import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import crypto from 'crypto';
import { TRPCError } from '@trpc/server';
import { handlePaymentApproved } from '../services/mercadoPagoIntegration';
import { notifyDepositConfirmed } from '../services/notificationsService';
import { ClickSignService } from '../services/clicksignService';

function verifyMpSignature(rawBody: string, signature: string, timestamp: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp || !rawBody) return false;
  try {
    const message = `${timestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(signature, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const webhookRouter = router({
  /**
   * Webhook do Mercado Pago para pagamentos
   */
  mercadoPago: publicProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.string(),
        data: z.object({
          id: z.string().optional(),
        }).optional(),
        action: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const signature = (ctx.req.headers['x-signature'] as string) || '';
        const timestamp = (ctx.req.headers['x-timestamp'] as string) || '';
        const rawBody = (ctx.req as any).rawBody
          ? (ctx.req as any).rawBody.toString('utf8')
          : JSON.stringify(ctx.req.body ?? input);

        if (!verifyMpSignature(rawBody, signature, timestamp)) {
          console.error('[Webhook] Invalid Mercado Pago signature');
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid webhook signature' });
        }

        console.log('[Webhook] Recebido webhook do Mercado Pago:', input);

        if (input.type !== 'payment') {
          console.log('[Webhook] Tipo de notificação ignorado:', input.type);
          return { success: true, message: 'Notificação ignorada' };
        }

        // TODO: Buscar detalhes do pagamento da API do Mercado Pago
        // const paymentDetails = await getPaymentDetails(input.data?.id);

        // Simular dados de pagamento para teste
        const paymentData = {
          external_reference: input.id,
          transaction_amount: 100.00, // Valor em reais
          status: 'approved',
          payment_id: input.data?.id || input.id,
        };

        // Processar pagamento aprovado
        const result = await handlePaymentApproved(paymentData);

        if (result.success && result.userId) {
          // Enviar notificação ao usuário
          await notifyDepositConfirmed(result.userId, paymentData.transaction_amount * 100);
        }

        return result;
      } catch (error) {
        console.error('[Webhook] Erro ao processar webhook:', error);
        return {
          success: false,
          error: 'Erro ao processar webhook',
        };
      }
    }),

  /**
   * Webhook para confirmação de saque
   */
  withdrawalConfirmed: publicProcedure
    .input(
      z.object({
        withdrawalId: z.number(),
        status: z.enum(['approved', 'rejected', 'processed']),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[Webhook] Saque confirmado:', input);

        // TODO: Atualizar status do saque no banco de dados
        // TODO: Enviar notificação ao usuário

        return {
          success: true,
          message: 'Saque processado com sucesso',
        };
      } catch (error) {
        console.error('[Webhook] Erro ao processar saque:', error);
        return {
          success: false,
          error: 'Erro ao processar saque',
        };
      }
    }),

  /**
   * Webhook da ClickSign para assinaturas
   */
  clicksign: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      try {
        console.log('[Webhook] Recebido webhook da ClickSign:', input);
        await ClickSignService.handleWebhook(input);
        return { success: true };
      } catch (error) {
        console.error('[Webhook] Erro ao processar webhook ClickSign:', error);
        return { success: false, error: 'Erro ao processar webhook ClickSign' };
      }
    }),

  /**
   * Health check do webhook
   */
  health: publicProcedure.query(() => {
    return {
      success: true,
      message: 'Webhook server is running',
      timestamp: new Date(),
    };
  }),
});
