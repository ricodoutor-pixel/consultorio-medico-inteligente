import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  createPixPayment,
  getPaymentInfo,
  processWebhook,
  generateRandomPixCode,
  calculateSplit,
  calculateAffiliateCommission,
} from "../services/mercadoPagoService";

export const mercadopagoRouter = router({
  // Criar pagamento PIX
  createPixPayment: publicProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        description: z.string(),
        externalReference: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const payment = await createPixPayment({
          amount: input.amount,
          description: input.description,
          externalReference: input.externalReference,
        });

        return {
          success: true,
          qrCode: payment.qrCode,
          qrCodeUrl: payment.qrCodeUrl,
          pixCode: payment.pixCode,
          expiresAt: payment.expiresAt,
          amount: input.amount,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar pagamento",
        };
      }
    }),

  // Obter informações do pagamento
  getPaymentInfo: publicProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const payment = await getPaymentInfo(input.paymentId);
        return {
          success: true,
          payment,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao obter pagamento",
        };
      }
    }),

  // Processar webhook do Mercado Pago
  webhook: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      try {
        const result = await processWebhook(input);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao processar webhook",
        };
      }
    }),

  // Gerar código PIX aleatório
  generatePixCode: publicProcedure.query(() => {
    const pixCode = generateRandomPixCode();
    return {
      pixCode,
      qrCodeExample: "00020126720014br.gov.bcb.pix0136" + pixCode + "0210Depositos5204000053039865802BR5918Planta Y Raiz Ltda6009Sao Paulo62230519daqr38654794199698063045F59",
    };
  }),

  // Calcular split automático
  calculateSplit: publicProcedure
    .input(z.object({ amount: z.number().positive() }))
    .query(({ input }) => {
      const split = calculateSplit(input.amount);
      return {
        total: input.amount,
        split: {
          producers: split.producers,
          cotistas: split.cotistas,
          affiliates: split.affiliates,
          reserve: split.reserve,
          platform: split.platform,
        },
      };
    }),

  // Calcular comissão de afiliado
  calculateAffiliateCommission: publicProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        level: z.enum(["1", "2", "3"]),
      })
    )
    .query(({ input }) => {
      const level = parseInt(input.level) as 1 | 2 | 3;
      const commission = calculateAffiliateCommission(input.amount, level);
      const rates = { 1: 0.20, 2: 0.12, 3: 0.08 };

      return {
        amount: input.amount,
        level: level,
        rate: rates[level],
        commission: commission,
      };
    }),

  // Validar credenciais do Mercado Pago
  validateCredentials: publicProcedure.query(() => {
    const hasPublicKey = !!process.env.MERCADO_PAGO_PUBLIC_KEY;
    const hasAccessToken = !!process.env.MERCADO_PAGO_ACCESS_TOKEN;

    return {
      configured: hasPublicKey && hasAccessToken,
      publicKeyConfigured: hasPublicKey,
      accessTokenConfigured: hasAccessToken,
    };
  }),
});
