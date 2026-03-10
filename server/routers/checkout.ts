import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import checkoutService from '../services/checkoutService';

export const checkoutRouter = router({
  /**
   * Cria sessão de checkout
   */
  createSession: protectedProcedure
    .input(
      z.object({
        consultationId: z.string(),
        patientEmail: z.string().email(),
        patientName: z.string(),
        professionalName: z.string(),
        amount: z.number().min(1),
        paymentMethod: z.enum(['pix', 'credit_card', 'debit_card']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const patientId = String(ctx.user?.id || '');
        const session = await checkoutService.createCheckoutSession({
          ...input,
          patientId,
        });

        return {
          success: true,
          session,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Processa pagamento
   */
  processPayment: protectedProcedure
    .input(z.object({ checkoutSession: z.any() }))
    .mutation(async ({ input }) => {
      try {
        const result = await checkoutService.processPayment(input.checkoutSession);

        return {
          success: true,
          session: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Gera link de acesso Jitsi
   */
  generateJitsiLink: protectedProcedure
    .input(z.object({ checkoutSession: z.any() }))
    .mutation(async ({ input }) => {
      try {
        const link = await checkoutService.generateJitsiAccessLink(input.checkoutSession);

        return {
          success: true,
          jitsiLink: link,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Gera recibo
   */
  generateReceipt: protectedProcedure
    .input(z.object({ checkoutSession: z.any() }))
    .mutation(async ({ input }) => {
      try {
        const receipt = await checkoutService.generateReceipt(input.checkoutSession);

        return {
          success: true,
          receipt,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Processa webhook do Mercado Pago
   */
  webhook: publicProcedure
    .input(
      z.object({
        payload: z.any(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await checkoutService.processWebhook(input.payload, input.signature);

        return {
          success: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Cria assinatura de plano
   */
  createSubscription: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        planName: z.string(),
        amount: z.number(),
        billingCycle: z.enum(['monthly', 'quarterly', 'annual']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const patientId = String(ctx.user?.id || '');
        const subscription = await checkoutService.createSubscription({
          ...input,
          patientId,
        });

        return {
          success: true,
          subscription,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Cancela assinatura
   */
  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await checkoutService.cancelSubscription(input.subscriptionId);

        return {
          success: result,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Busca histórico de pagamentos
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id || '');
      const history = await checkoutService.getPaymentHistory(userId);

      return {
        success: true,
        history,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),
});
