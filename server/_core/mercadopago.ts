import axios from 'axios';

const MERCADO_PAGO_API = 'https://api.mercadopago.com/v1';

function getAccessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || '';
}

interface PaymentRequest {
  amount: number;
  description: string;
  payerEmail: string;
  payerId: string;
  externalReference: string;
  type: 'subscription' | 'consultation' | 'product';
}

interface PaymentResponse {
  id: string;
  status: string;
  statusDetail: string;
  qrCode?: string;
  qrCodeUrl?: string;
  paymentUrl?: string;
}

export async function createPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    const payload = {
      items: [
        {
          title: request.description,
          quantity: 1,
          unit_price: request.amount,
        },
      ],
      payer: {
        email: request.payerEmail,
      },
      external_reference: request.externalReference,
      notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment-success`,
        failure: `${process.env.FRONTEND_URL}/payment-failure`,
        pending: `${process.env.FRONTEND_URL}/payment-pending`,
      },
      auto_return: 'approved',
    };

    const response = await axios.post(`${MERCADO_PAGO_API}/checkout/preferences`, payload, {
      headers: {
         Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      id: response.data.id,
      status: 'pending',
      statusDetail: 'pending_payment',
      paymentUrl: response.data.init_point,
    };
  } catch (error) {
    console.error('[Mercado Pago] Erro ao criar pagamento:', error);
    throw new Error('Erro ao processar pagamento');
  }
}

export async function createPixPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    const payload = {
      transaction_amount: request.amount,
      description: request.description,
      payment_method_id: 'pix',
      payer: {
        email: request.payerEmail,
        identification: {
          type: 'CPF',
          number: request.payerId,
        },
      },
      external_reference: request.externalReference,
    };

    const response = await axios.post(`${MERCADO_PAGO_API}/payments`, payload, {
      headers: {
         Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      id: response.data.id,
      status: response.data.status,
      statusDetail: response.data.status_detail,
      qrCode: response.data.point_of_interaction?.qr_code?.in_store_order_id,
      qrCodeUrl: response.data.point_of_interaction?.qr_code?.qr_code_url,
    };
  } catch (error) {
    console.error('[Mercado Pago] Erro ao criar pagamento PIX:', error);
    throw new Error('Erro ao processar pagamento PIX');
  }
}

export async function getPaymentStatus(paymentId: string): Promise<any> {
  try {
    const response = await axios.get(`${MERCADO_PAGO_API}/payments/${paymentId}`, {
      headers: {
         Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    return {
      id: response.data.id,
      status: response.data.status,
      statusDetail: response.data.status_detail,
      amount: response.data.transaction_amount,
      paymentMethod: response.data.payment_method_id,
      createdAt: response.data.date_created,
      approvedAt: response.data.date_approved,
    };
  } catch (error) {
    console.error('[Mercado Pago] Erro ao obter status:', error);
    throw new Error('Erro ao obter status do pagamento');
  }
}

export async function refundPayment(paymentId: string, amount?: number): Promise<any> {
  try {
    const payload = amount ? { amount } : {};

    const response = await axios.post(
      `${MERCADO_PAGO_API}/payments/${paymentId}/refunds`,
      payload,
      {
        headers: {
           Authorization: `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      amount: response.data.amount,
      createdAt: response.data.date_created,
    };
  } catch (error) {
    console.error('[Mercado Pago] Erro ao reembolsar:', error);
    throw new Error('Erro ao processar reembolso');
  }
}

export function verifyWebhookSignature(body: any, signature: string, secret: string): boolean {
  try {
    // Implementar verificação de assinatura do Mercado Pago
    // Detalhes em: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/webhooks/v1/overview
    return true; // Simplificado para exemplo
  } catch (error) {
    console.error('[Mercado Pago] Erro ao verificar assinatura:', error);
    return false;
  }
}

export async function createSubscription(request: any): Promise<any> {
  try {
    const payload = {
      preapproval_plan_id: request.planId,
      payer_email: request.payerEmail,
      auto_recurring: {
        frequency: request.frequency || 1,
        frequency_type: request.frequencyType || 'months',
        transaction_amount: request.amount,
        currency_id: 'BRL',
      },
      back_url: `${process.env.FRONTEND_URL}/subscription-success`,
    };

    const response = await axios.post(`${MERCADO_PAGO_API}/preapproval`, payload, {
      headers: {
         Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      id: response.data.id,
      status: response.data.status,
      nextBillingDate: response.data.next_billing_date,
    };
  } catch (error) {
    console.error('[Mercado Pago] Erro ao criar assinatura:', error);
    throw new Error('Erro ao processar assinatura');
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<any> {
  try {
    const response = await axios.put(
      `${MERCADO_PAGO_API}/preapproval/${subscriptionId}`,
      { status: 'cancelled' },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      cancelledAt: new Date(),
    };
  } catch (error) {
    console.error('[Mercado Pago] Erro ao cancelar assinatura:', error);
    throw new Error('Erro ao cancelar assinatura');
  }
}
