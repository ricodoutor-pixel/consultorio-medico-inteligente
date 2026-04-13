import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export class MercadoPagoClient {
  private client: AxiosInstance;

  constructor(accessToken: string) {
    this.client = axios.create({
      baseURL: 'https://api.mercadopago.com',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  async createPreference(data: {
    items: { title: string; quantity: number; unit_price: number }[];
    payer: { email: string };
    external_reference: string;
    notification_url?: string;
    back_urls?: { success: string; failure: string; pending: string };
    auto_return?: string;
    application_fee?: number;
  }) {
    const { data: result } = await this.client.post('/checkout/preferences', data);
    return result;
  }

  async createPixPayment(data: {
    transaction_amount: number;
    description: string;
    payment_method_id: 'pix';
    payer: { email: string; identification?: { type: string; number: string } };
    external_reference: string;
    application_fee?: number;
  }) {
    const { data: result } = await this.client.post('/v1/payments', data);
    return result;
  }

  async getPayment(paymentId: string) {
    const { data } = await this.client.get(`/v1/payments/${paymentId}`);
    return data;
  }

  async refundPayment(paymentId: string, amount?: number) {
    const { data } = await this.client.post(`/v1/payments/${paymentId}/refunds`, amount ? { amount } : {});
    return data;
  }

  async createSubscription(data: {
    preapproval_plan_id?: string;
    payer_email: string;
    auto_recurring: {
      frequency: number;
      frequency_type: string;
      transaction_amount: number;
      currency_id: string;
    };
    back_url: string;
  }) {
    const { data: result } = await this.client.post('/preapproval', data);
    return result;
  }

  async cancelSubscription(subscriptionId: string) {
    const { data } = await this.client.put(`/preapproval/${subscriptionId}`, { status: 'cancelled' });
    return data;
  }

  validateWebhookSignature(body: string, signature: string, timestamp: string, secret: string): boolean {
    if (!signature || !timestamp || !secret) return false;
    const data = `${timestamp}.${body}`;
    const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return hash === signature;
  }

  async healthCheck(): Promise<{ ok: boolean; responseTime: number }> {
    const start = Date.now();
    try {
      await this.client.get('/v1/payment_methods');
      return { ok: true, responseTime: Date.now() - start };
    } catch {
      return { ok: false, responseTime: Date.now() - start };
    }
  }
}

export const createMercadoPagoClient = (): MercadoPagoClient => {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
  return new MercadoPagoClient(token);
};
