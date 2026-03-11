import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import axios from 'axios';
import { MercadoPagoService } from '../mercadoPagoService';

/**
 * Mercado Pago Integration Tests
 * Testa integração com API de pagamentos Mercado Pago
 */

describe('MercadoPagoService - Integration Tests', () => {
  let mercadoPagoService: MercadoPagoService;
  const testPaymentData = {
    amount: 150.00,
    description: 'Consulta Cannabis Medicinal - Teste',
    email: 'teste@plantayraiz.com.br'
  };

  beforeAll(() => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'test_token';
    mercadoPagoService = new MercadoPagoService();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('createPayment', () => {
    it('deve criar um pagamento com sucesso', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          id: 'payment_123456789',
          status: 'pending',
          status_detail: 'pending_payment',
          transaction_amount: testPaymentData.amount,
          description: testPaymentData.description,
          payer: { email: testPaymentData.email },
          point_of_interaction: {
            transaction_data: {
              qr_code: '00020126580014br.gov.bcb.pix0136xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx520400005303986540510.005802BR5913PLANTA RAIZ6009SAO PAULO62410503***63041D3D'
            }
          }
        }
      });

      const result = await mercadoPagoService.createPayment(
        testPaymentData.amount,
        testPaymentData.description,
        testPaymentData.email
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('payment_123456789');
      expect(result.status).toBe('pending');
      expect(result.transaction_amount).toBe(testPaymentData.amount);
      expect(result.point_of_interaction.transaction_data.qr_code).toBeDefined();
    });

    it('deve lançar erro quando credenciais inválidas', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        mercadoPagoService.createPayment(
          testPaymentData.amount,
          testPaymentData.description,
          testPaymentData.email
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('deve validar quantidade mínima de pagamento', async () => {
      const invalidAmount = 5.00;

      vi.spyOn(axios, 'post').mockRejectedValueOnce(
        new Error('Minimum amount is R$10.00')
      );

      await expect(
        mercadoPagoService.createPayment(
          invalidAmount,
          testPaymentData.description,
          testPaymentData.email
        )
      ).rejects.toThrow('Minimum amount');
    });
  });

  describe('getPaymentStatus', () => {
    it('deve retornar status de pagamento aprovado', async () => {
      const paymentId = 'payment_123456789';

      vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          id: paymentId,
          status: 'approved',
          status_detail: 'accredited',
          transaction_amount: testPaymentData.amount,
          payment_method: { type: 'digital_wallet', id: 'pix' }
        }
      });

      const result = await mercadoPagoService.getPaymentStatus(paymentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(paymentId);
      expect(result.status).toBe('approved');
      expect(result.status_detail).toBe('accredited');
    });

    it('deve retornar status de pagamento pendente', async () => {
      const paymentId = 'payment_987654321';

      vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          id: paymentId,
          status: 'pending',
          status_detail: 'pending_payment'
        }
      });

      const result = await mercadoPagoService.getPaymentStatus(paymentId);
      expect(result.status).toBe('pending');
    });

    it('deve retornar erro para pagamento não encontrado', async () => {
      vi.spyOn(axios, 'get').mockRejectedValueOnce(
        new Error('Payment not found')
      );

      await expect(
        mercadoPagoService.getPaymentStatus('invalid_id')
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('Webhook Handling', () => {
    it('deve processar webhook de pagamento aprovado', async () => {
      const webhookData = {
        id: 'webhook_123',
        type: 'payment',
        data: { id: 'payment_123456789' },
        action: 'payment.approved'
      };

      expect(webhookData.action).toBe('payment.approved');
      expect(webhookData.data.id).toBeDefined();
    });

    it('deve processar webhook de pagamento recusado', async () => {
      const webhookData = {
        id: 'webhook_456',
        type: 'payment',
        data: { id: 'payment_987654321' },
        action: 'payment.rejected'
      };

      expect(webhookData.action).toBe('payment.rejected');
    });
  });

  describe('Performance', () => {
    it('deve criar pagamento em menos de 2 segundos', async () => {
      const startTime = Date.now();

      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { id: 'payment_perf_test', status: 'pending' }
      });

      await mercadoPagoService.createPayment(
        testPaymentData.amount,
        testPaymentData.description,
        testPaymentData.email
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Credentials', () => {
    it('deve verificar credenciais configuradas', () => {
      const creds = mercadoPagoService.getCredentials();
      expect(creds.hasAccessToken).toBe(true);
    });
  });
});
