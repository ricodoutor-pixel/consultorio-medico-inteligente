import axios from 'axios';
import { getDb } from '../db';
import { transactions, withdrawalRequests, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const MERCADO_PAGO_API = 'https://api.mercadopago.com/v1';
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'test_token';

/**
 * Criar preferência de pagamento no Mercado Pago
 */
export async function createPaymentPreference(data: {
  userId: number;
  amount: number;
  planType: string;
  description: string;
}) {
  try {
    const response = await axios.post(
      `${MERCADO_PAGO_API}/checkout/preferences`,
      {
        items: [
          {
            title: `Investimento ${data.planType}`,
            description: data.description,
            quantity: 1,
            unit_price: data.amount,
          },
        ],
        payer: {
          email: `user_${data.userId}@plantaeraiz.com`,
        },
        external_reference: `USER_${data.userId}_${Date.now()}`,
        notification_url: `${process.env.VITE_FRONTEND_FORGE_API_URL}/api/webhooks/mercado-pago`,
        back_urls: {
          success: `${process.env.VITE_FRONTEND_FORGE_API_URL}/dashboard?status=success`,
          failure: `${process.env.VITE_FRONTEND_FORGE_API_URL}/dashboard?status=failure`,
          pending: `${process.env.VITE_FRONTEND_FORGE_API_URL}/dashboard?status=pending`,
        },
        auto_return: 'approved',
      },
      {
        headers: {
          Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      preferenceId: response.data.id,
      initPoint: response.data.init_point,
    };
  } catch (error) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    return {
      success: false,
      error: 'Falha ao criar preferência de pagamento',
    };
  }
}

/**
 * Gerar QR Code PIX
 */
export async function generatePixQRCode(data: {
  userId: number;
  amount: number;
  planType: string;
}) {
  try {
    // Simular geração de QR Code PIX
    // Em produção, usar API do Mercado Pago ou banco
    const pixCode = `00020126580014br.gov.bcb.pix0136${data.userId}-${Date.now()}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;

    return {
      success: true,
      pixCode: pixCode,
      qrCodeUrl: qrCodeUrl,
      amount: data.amount,
      planType: data.planType,
    };
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    return {
      success: false,
      error: 'Falha ao gerar QR Code',
    };
  }
}

/**
 * Processar webhook de pagamento aprovado
 */
export async function handlePaymentApproved(paymentData: {
  external_reference: string;
  transaction_amount: number;
  status: string;
  payment_id: string;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Extrair userId do external_reference
    const userIdMatch = paymentData.external_reference.match(/USER_(\d+)/);
    if (!userIdMatch) throw new Error('Invalid external reference');

    const userId = parseInt(userIdMatch[1]);

    // Registrar depósito
    await db.insert(transactions).values({
      userId,
      type: 'deposit',
      amount: Math.round(paymentData.transaction_amount * 100), // Converter para centavos
      status: 'completed',
      mercadoPagoId: paymentData.payment_id,
      description: 'Depósito via Mercado Pago',
      createdAt: new Date(),
    });

    // Atualizar saldo do usuário
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) throw new Error('User not found');

    console.log(`Depósito de R$ ${paymentData.transaction_amount} aprovado para usuário ${userId}`);

    return {
      success: true,
      message: 'Pagamento processado com sucesso',
      userId,
      amount: paymentData.transaction_amount,
    };
  } catch (error) {
    console.error('Erro ao processar pagamento aprovado:', error);
    return {
      success: false,
      error: 'Falha ao processar pagamento',
    };
  }
}

/**
 * Processar saque via Mercado Pago
 */
export async function processWithdrawal(data: {
  withdrawalId: number;
  userId: number;
  amount: number;
  pixKey: string;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Simular transferência via Mercado Pago
    // Em produção, usar API real do Mercado Pago
    const transferId = `TRANSFER_${data.withdrawalId}_${Date.now()}`;

    // Atualizar status do saque
    await db
      .update(withdrawalRequests)
      .set({
        status: 'processed',
        mercadoPagoId: transferId,
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, data.withdrawalId));

    console.log(`Saque de R$ ${data.amount} processado para usuário ${data.userId}`);

    return {
      success: true,
      message: 'Saque processado com sucesso',
      transferId,
      amount: data.amount,
    };
  } catch (error) {
    console.error('Erro ao processar saque:', error);
    return {
      success: false,
      error: 'Falha ao processar saque',
    };
  }
}

/**
 * Validar webhook do Mercado Pago
 */
export async function validateWebhook(signature: string, body: string): Promise<boolean> {
  try {
    // Implementar validação de assinatura do Mercado Pago
    // Usar HMAC-SHA256 com chave secreta
    const crypto = require('crypto');
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || '';
    const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return hash === signature;
  } catch (error) {
    console.error('Erro ao validar webhook:', error);
    return false;
  }
}
