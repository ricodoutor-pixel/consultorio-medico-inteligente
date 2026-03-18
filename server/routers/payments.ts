import { protectedProcedure, router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { IntegratedPaymentService } from '../services/paymentService';

const paymentService = new IntegratedPaymentService(
  process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
);

export const paymentsRouter = router({
  // Obter planos de assinatura
  getSubscriptionPlans: protectedProcedure
    .query(async () => {
      return [
        {
          id: 1,
          name: 'Básico',
          price: 29.90,
          period: 'month',
          features: ['2 consultas/mês', 'Chat com profissional', 'Acesso à biblioteca'],
        },
        {
          id: 2,
          name: 'Premium',
          price: 79.90,
          period: 'month',
          features: ['Consultas ilimitadas', 'Prioridade no atendimento', 'Prescrições digitais'],
        },
      ];
    }),

  // Criar assinatura
  createSubscription: protectedProcedure
    .input(z.object({
      planId: z.number(),
      paymentMethod: z.enum(['pix', 'credit_card', 'debit_card']),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        subscriptionId: Math.random(),
        status: 'active',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentLink: 'https://mercadopago.com/checkout/abc123',
      };
    }),

  // Obter assinatura ativa
  getActiveSubscription: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        id: 1,
        plan: 'Premium',
        price: 79.90,
        status: 'active',
        startDate: '2026-01-15',
        nextBillingDate: '2026-03-15',
        autoRenew: true,
      };
    }),

  // Cancelar assinatura
  cancelSubscription: protectedProcedure
    .input(z.object({ reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: 'Assinatura cancelada',
        refundAmount: 0,
      };
    }),

  // Obter histórico de pagamentos
  getPaymentHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          date: '2026-02-15',
          amount: 79.90,
          method: 'PIX',
          status: 'paid',
          description: 'Assinatura Premium',
          receipt: 'REC-123456',
        },
      ];
    }),

  // Obter métodos de pagamento
  getPaymentMethods: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 1,
          type: 'credit_card',
          brand: 'Visa',
          lastDigits: '4242',
          expiryDate: '12/25',
          isDefault: true,
        },
      ];
    }),

  // Adicionar método de pagamento
  addPaymentMethod: protectedProcedure
    .input(z.object({
      type: z.enum(['credit_card', 'debit_card', 'pix']),
      cardNumber: z.string().optional(),
      expiryDate: z.string().optional(),
      cvv: z.string().optional(),
      pixKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        methodId: Math.random(),
        success: true,
        message: 'Método de pagamento adicionado',
      };
    }),

  // Remover método de pagamento
  removePaymentMethod: protectedProcedure
    .input(z.object({ methodId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Método de pagamento removido' };
    }),

  // Obter faturas
  getInvoices: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 'INV-001',
          date: '2026-02-15',
          amount: 79.90,
          status: 'paid',
          dueDate: '2026-03-15',
          downloadUrl: 'https://planta-raiz.com/invoices/inv-001.pdf',
        },
      ];
    }),

  // Processar reembolso
  processRefund: protectedProcedure
    .input(z.object({
      transactionId: z.string(),
      reason: z.string(),
      amount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        refundId: 'REF-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        status: 'processing',
        estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };
    }),

  // Obter status de pagamento
  getPaymentStatus: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ input }) => {
      return {
        transactionId: input.transactionId,
        status: 'completed',
        amount: 79.90,
        timestamp: new Date(),
        method: 'PIX',
      };
    }),

  // ========================================================================
  // DYNAMIC PRICING ENDPOINTS
  // ========================================================================

  // Obter preço do médico
  getDoctorPrice: publicProcedure
    .input(z.object({ doctorId: z.string() }))
    .query(async ({ input }) => {
      try {
        const price = await paymentService.pricingService.getDoctorPrice(input.doctorId);
        return { success: true, data: price };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
      }
    }),

  // Processar pagamento dinâmico
  processPaymentDynamic: protectedProcedure
    .input(
      z.object({
        consultationId: z.string(),
        doctorId: z.string(),
        patientId: z.string(),
        patientEmail: z.string().email(),
        doctorEmail: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (String(ctx.user?.id) !== input.patientId) {
          return { success: false, error: 'Sem permissão' };
        }
        const payment = await paymentService.processPayment(input);
        return { success: true, data: payment };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Erro ao processar pagamento' };
      }
    }),

  // Calcular comissões
  calculateCommissions: publicProcedure
    .input(z.object({ amount: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        const commissions = paymentService.commissionService.calculateCommissions(input.amount);
        return { success: true, data: commissions };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
      }
    }),

  // Dashboard do médico
  getDoctorDashboard: protectedProcedure
    .input(z.object({ doctorId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== 'admin' && String(ctx.user?.id) !== input.doctorId) {
          return { success: false, error: 'Sem permissão' };
        }
        const dashboard = await paymentService.dashboardService.getDoctorDashboard(input.doctorId);
        return { success: true, data: dashboard };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
      }
    }),
});
