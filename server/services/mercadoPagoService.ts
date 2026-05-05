import axios from 'axios';
import crypto from 'crypto';

const MP_API_BASE = 'https://api.mercadopago.com';

function getAccessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
}

function getPublicKey() {
  return process.env.MERCADO_PAGO_PUBLIC_KEY || '';
}

interface PIXPaymentRequest {
  amount: number;
  description: string;
  externalReference: string;
  notificationUrl?: string;
}

interface PIXQRCodeResponse {
  qrCode: string;
  qrCodeUrl: string;
  pixCode: string;
  expiresAt: string;
}

/**
 * Gera um código PIX aleatório para pagamento
 */
export function generateRandomPixCode(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}${random}`.substring(0, 32);
}

/**
 * Cria um pagamento PIX via Mercado Pago
 */
export async function createPixPayment(request: PIXPaymentRequest): Promise<PIXQRCodeResponse> {
  try {
    const pixCode = generateRandomPixCode();
    
    const paymentData = {
      transaction_amount: request.amount,
      description: request.description,
      payment_method_id: 'pix',
      payer: {
        email: 'customer@example.com',
      },
      external_reference: request.externalReference,
      notification_url: request.notificationUrl || `${process.env.VITE_APP_URL || 'https://localhost:3000'}/api/webhooks/mercadopago`,
    };

    const response = await axios.post(
      `${MP_API_BASE}/v1/payments`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      qrCode: response.data.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeUrl: response.data.point_of_interaction?.transaction_data?.qr_code_url || '',
      pixCode: pixCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    throw new Error('Falha ao criar pagamento PIX');
  }
}

/**
 * Obtém informações de um pagamento
 */
export async function getPaymentInfo(paymentId: string) {
  try {
    const response = await axios.get(
      `${MP_API_BASE}/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      amount: response.data.transaction_amount,
      description: response.data.description,
      externalReference: response.data.external_reference,
      createdAt: response.data.date_created,
    };
  } catch (error) {
    console.error('Erro ao obter informações do pagamento:', error);
    throw new Error('Falha ao obter informações do pagamento');
  }
}

/**
 * Processa um webhook do Mercado Pago
 */
export async function processWebhook(data: any) {
  try {
    if (data.type === 'payment') {
      const paymentId = data.data.id;
      const paymentInfo = await getPaymentInfo(paymentId);
      
      return {
        success: true,
        paymentId: paymentId,
        status: paymentInfo.status,
        amount: paymentInfo.amount,
      };
    }
    
    return { success: false, message: 'Tipo de webhook não reconhecido' };
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    throw error;
  }
}

/**
 * Cria um pagamento recorrente para afiliados
 */
export async function createRecurringPayment(request: PIXPaymentRequest) {
  try {
    const response = await axios.post(
      `${MP_API_BASE}/v1/recurring_payments`,
      {
        payer_email: 'affiliate@example.com',
        back_url: `${process.env.VITE_APP_URL || 'https://localhost:3000'}/affiliates`,
        reason: request.description,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: request.amount,
          currency_id: 'BRL',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erro ao criar pagamento recorrente:', error);
    throw new Error('Falha ao criar pagamento recorrente');
  }
}

/**
 * Calcula o split automático entre partes interessadas
 */
export function calculateSplit(totalAmount: number) {
  return {
    producers: totalAmount * 0.45,
    cotistas: totalAmount * 0.25,
    affiliates: totalAmount * 0.15,
    reserve: totalAmount * 0.10,
    platform: totalAmount * 0.05,
  };
}

/**
 * Calcula comissões de afiliados (3 níveis)
 */
export function calculateAffiliateCommission(amount: number, level: 1 | 2 | 3) {
  const commissionRates = {
    1: 0.20,
    2: 0.12,
    3: 0.08,
  };

  return amount * commissionRates[level];
}

/**
 * Cria transferencia PIX para especialista/farmacia
 */
export async function createPixTransfer(data: {
  amount: number;
  pixKey: string;
  description: string;
  recipientId: string;
}) {
  try {
    const response = await axios.post(
      `${MP_API_BASE}/v1/transfers`,
      {
        amount: data.amount,
        receiver_id: data.recipientId,
        description: data.description,
        transfer_account_id: 'wallet',
      },
      {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
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
    console.error('Erro ao criar transferencia PIX:', error);
    throw new Error('Falha ao criar transferencia PIX');
  }
}

/**
 * Verifica status de transferencia
 */
export async function getTransferStatus(transferId: string) {
  try {
    const response = await axios.get(
      `${MP_API_BASE}/v1/transfers/${transferId}`,
      {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      amount: response.data.amount,
      createdAt: response.data.date_created,
      completedAt: response.data.date_completed,
    };
  } catch (error) {
    console.error('Erro ao obter status de transferencia:', error);
    throw new Error('Falha ao obter status de transferencia');
  }
}

/**
 * Reembolsa pagamento
 */
export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const response = await axios.post(
      `${MP_API_BASE}/v1/payments/${paymentId}/refunds`,
      amount ? { amount } : {},
      {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
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
    console.error('Erro ao reembolsar pagamento:', error);
    throw new Error('Falha ao reembolsar pagamento');
  }
}

/**
 * Calcula comissao de plataforma (10%)
 */
export function calculatePlatformCommission(amount: number) {
  const commission = amount * 0.1;
  const userAmount = amount - commission;

  return {
    totalAmount: amount,
    platformCommission: commission,
    userAmount: userAmount,
  };
}

/**
 * Processa pagamento com split automatico
 */
export async function processPaymentWithSplit(data: {
  amount: number;
  description: string;
  externalReference: string;
  specialistId?: string;
  pharmacyId?: string;
}) {
  try {
    const payment = await createPixPayment({
      amount: data.amount,
      description: data.description,
      externalReference: data.externalReference,
    });

    const commission = calculatePlatformCommission(data.amount);

    return {
      payment,
      commission,
      status: 'pending',
    };
  } catch (error) {
    console.error('Erro ao processar pagamento com split:', error);
    throw error;
  }
}

/**
 * Classe MercadoPagoService - Interface orientada a objeto
 * Compatível com testes de integração
 */
export class MercadoPagoService {
  private accessToken: string;
  private apiBase: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || getAccessToken();
    this.apiBase = MP_API_BASE;
  }

  async createPayment(amount: number, description: string, email: string) {
    const response = await axios.post(
      `${this.apiBase}/v1/payments`,
      {
        transaction_amount: amount,
        description,
        payment_method_id: 'pix',
        payer: { email },
      },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  async getPaymentStatus(paymentId: string) {
    const response = await axios.get(
      `${this.apiBase}/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );
    return response.data;
  }

  async createRefund(paymentId: string, amount?: number) {
    const response = await axios.post(
      `${this.apiBase}/v1/payments/${paymentId}/refunds`,
      amount ? { amount } : {},
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  async createTransfer(amount: number, receiverId: string, description: string) {
    const response = await axios.post(
      `${this.apiBase}/v1/transfers`,
      { amount, receiver_id: receiverId, description },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  getCredentials() {
    return {
      configured: !!this.accessToken && !!getPublicKey(),
      hasAccessToken: !!this.accessToken,
      hasPublicKey: !!getPublicKey(),
      hasClientId: !!process.env.MERCADO_PAGO_CLIENT_ID,
      hasClientSecret: !!process.env.MERCADO_PAGO_CLIENT_SECRET,
    };
  }
}
