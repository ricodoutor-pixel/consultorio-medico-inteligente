/**
 * INTEGRAÇÃO COMPLETA COM MERCADO PAGO
 * Plantayraiz.com.br - Checkout Transparente
 * Data: 04 de Abril de 2026
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// Credenciais Mercado Pago
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'your_access_token';
const MP_PUBLIC_KEY = process.env.MERCADO_PAGO_PUBLIC_KEY || 'your_public_key';
const MP_CLIENT_ID = process.env.MERCADO_PAGO_CLIENT_ID || 'your_client_id';
const MP_CLIENT_SECRET = process.env.MERCADO_PAGO_CLIENT_SECRET || 'your_client_secret';

// URLs
const MP_API_URL = 'https://api.mercadopago.com/v1';
const SITE_URL = 'https://plantayraiz.com.br';
const LOG_DIR = '/tmp/mercado-pago';

// Inicializar cliente Axios
const mpClient = axios.create({
  baseURL: MP_API_URL,
  headers: {
    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// LOGGER
// ============================================================================

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
  };

  console.log(`[${timestamp}] [${level}] ${message}`, data);

  const logFile = path.join(LOG_DIR, `mp_${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// ============================================================================
// BANCO DE DADOS (Simulado)
// ============================================================================

class MercadoPagoDatabase {
  constructor() {
    this.payments = [];
    this.customers = [];
    this.coupons = [];
    this.transactions = [];
  }

  addPayment(payment) {
    const id = `PAY_${Date.now()}`;
    const newPayment = {
      id,
      ...payment,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };
    this.payments.push(newPayment);
    return newPayment;
  }

  updatePayment(id, updates) {
    const payment = this.payments.find((p) => p.id === id);
    if (payment) {
      Object.assign(payment, updates, { updatedAt: new Date().toISOString() });
    }
    return payment;
  }

  getPayment(id) {
    return this.payments.find((p) => p.id === id);
  }

  listPayments(filter = {}) {
    return this.payments.filter((p) => {
      if (filter.status && p.status !== filter.status) return false;
      if (filter.customerId && p.customerId !== filter.customerId) return false;
      return true;
    });
  }

  addCoupon(coupon) {
    const id = `COUP_${Date.now()}`;
    const newCoupon = {
      id,
      ...coupon,
      createdAt: new Date().toISOString(),
      active: true,
    };
    this.coupons.push(newCoupon);
    return newCoupon;
  }

  getCoupon(code) {
    return this.coupons.find((c) => c.code === code && c.active);
  }

  addTransaction(transaction) {
    this.transactions.push({
      ...transaction,
      timestamp: new Date().toISOString(),
    });
  }
}

const db = new MercadoPagoDatabase();

// ============================================================================
// FUNÇÕES: PAGAMENTOS
// ============================================================================

/**
 * Criar preferência de pagamento (Checkout Pro)
 */
async function createPaymentPreference(items, customerInfo = {}) {
  try {
    const preference = {
      items: items.map((item) => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.price,
        id: item.id,
      })),
      payer: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: {
          area_code: '55',
          number: customerInfo.phone?.replace(/\D/g, ''),
        },
      },
      back_urls: {
        success: `${SITE_URL}/payment/success`,
        failure: `${SITE_URL}/payment/failure`,
        pending: `${SITE_URL}/payment/pending`,
      },
      auto_return: 'approved',
      notification_url: `${SITE_URL}/api/webhooks/mercado-pago`,
    };

    const response = await mpClient.post('/checkout/preferences', preference);

    log('INFO', 'Preferência de pagamento criada', {
      preferenceId: response.data.id,
      items: items.length,
    });

    return response.data;
  } catch (error) {
    log('ERROR', 'Falha ao criar preferência', { error: error.message });
    throw error;
  }
}

/**
 * Criar pagamento com cartão (Checkout Transparente)
 */
async function createCardPayment(paymentData) {
  try {
    const payment = {
      transaction_amount: paymentData.amount,
      token: paymentData.token, // Token gerado no frontend
      description: paymentData.description,
      installments: paymentData.installments || 1,
      payment_method_id: 'credit_card',
      payer: {
        email: paymentData.email,
        first_name: paymentData.firstName,
        last_name: paymentData.lastName,
        identification: {
          type: 'CPF',
          number: paymentData.cpf?.replace(/\D/g, ''),
        },
      },
      metadata: {
        orderId: paymentData.orderId,
        userId: paymentData.userId,
      },
    };

    const response = await mpClient.post('/payments', payment);

    log('INFO', 'Pagamento com cartão criado', {
      paymentId: response.data.id,
      status: response.data.status,
      amount: paymentData.amount,
    });

    return response.data;
  } catch (error) {
    log('ERROR', 'Falha ao criar pagamento', { error: error.message });
    throw error;
  }
}

/**
 * Obter informações de pagamento
 */
async function getPaymentInfo(paymentId) {
  try {
    const response = await mpClient.get(`/payments/${paymentId}`);

    log('INFO', 'Informações de pagamento obtidas', {
      paymentId,
      status: response.data.status,
    });

    return response.data;
  } catch (error) {
    log('ERROR', 'Falha ao obter pagamento', { error: error.message });
    throw error;
  }
}

/**
 * Reembolsar pagamento
 */
async function refundPayment(paymentId, amount = null) {
  try {
    const refundData = {
      amount: amount || undefined,
    };

    const response = await mpClient.post(`/payments/${paymentId}/refunds`, refundData);

    log('INFO', 'Reembolso criado', {
      paymentId,
      refundId: response.data.id,
      amount: response.data.amount,
    });

    return response.data;
  } catch (error) {
    log('ERROR', 'Falha ao reembolsar', { error: error.message });
    throw error;
  }
}

// ============================================================================
// FUNÇÕES: CUPONS E PROMOÇÕES
// ============================================================================

/**
 * Criar cupom de desconto
 */
function createCoupon(couponData) {
  try {
    const coupon = {
      code: couponData.code.toUpperCase(),
      description: couponData.description,
      discountType: couponData.discountType, // 'PERCENTAGE' ou 'FIXED'
      discountValue: couponData.discountValue,
      maxUses: couponData.maxUses || null,
      currentUses: 0,
      expiresAt: couponData.expiresAt,
      minAmount: couponData.minAmount || 0,
      active: true,
    };

    const newCoupon = db.addCoupon(coupon);

    log('INFO', 'Cupom criado', { code: coupon.code });

    return newCoupon;
  } catch (error) {
    log('ERROR', 'Falha ao criar cupom', { error: error.message });
    throw error;
  }
}

/**
 * Validar e aplicar cupom
 */
function applyCoupon(couponCode, amount) {
  try {
    const coupon = db.getCoupon(couponCode);

    if (!coupon) {
      throw new Error('Cupom inválido ou expirado');
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      throw new Error('Cupom atingiu limite de usos');
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new Error('Cupom expirado');
    }

    if (amount < coupon.minAmount) {
      throw new Error(`Valor mínimo: R$ ${coupon.minAmount}`);
    }

    // Calcular desconto
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (amount * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'FIXED') {
      discount = coupon.discountValue;
    }

    const finalAmount = Math.max(0, amount - discount);

    log('INFO', 'Cupom aplicado', {
      code: couponCode,
      discount,
      finalAmount,
    });

    return {
      valid: true,
      discount,
      finalAmount,
      coupon,
    };
  } catch (error) {
    log('ERROR', 'Falha ao aplicar cupom', { error: error.message });
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Listar cupons ativos
 */
function listActiveCoupons() {
  return db.coupons.filter((c) => c.active);
}

// ============================================================================
// FUNÇÕES: RELATÓRIOS E ANÁLISE
// ============================================================================

/**
 * Obter resumo de vendas
 */
function getSalesSummary(startDate = null, endDate = null) {
  try {
    let payments = db.listPayments({ status: 'APPROVED' });

    if (startDate) {
      payments = payments.filter((p) => new Date(p.createdAt) >= new Date(startDate));
    }

    if (endDate) {
      payments = payments.filter((p) => new Date(p.createdAt) <= new Date(endDate));
    }

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      averageAmount: payments.length > 0 ? payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length : 0,
      payments,
    };

    log('INFO', 'Resumo de vendas gerado', summary);

    return summary;
  } catch (error) {
    log('ERROR', 'Falha ao gerar resumo', { error: error.message });
    throw error;
  }
}

/**
 * Obter estatísticas de cupons
 */
function getCouponStats() {
  try {
    const stats = {
      totalCoupons: db.coupons.length,
      activeCoupons: db.coupons.filter((c) => c.active).length,
      totalUses: db.coupons.reduce((sum, c) => sum + c.currentUses, 0),
      totalDiscounts: db.coupons.reduce((sum, c) => sum + (c.currentUses * c.discountValue), 0),
      coupons: db.coupons,
    };

    log('INFO', 'Estatísticas de cupons geradas', stats);

    return stats;
  } catch (error) {
    log('ERROR', 'Falha ao gerar estatísticas', { error: error.message });
    throw error;
  }
}

/**
 * Obter análise de transações
 */
function getTransactionAnalysis() {
  try {
    const transactions = db.transactions;

    const analysis = {
      totalTransactions: transactions.length,
      successfulTransactions: transactions.filter((t) => t.status === 'SUCCESS').length,
      failedTransactions: transactions.filter((t) => t.status === 'FAILED').length,
      totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      averageAmount: transactions.length > 0 ? transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length : 0,
      successRate: transactions.length > 0 ? (transactions.filter((t) => t.status === 'SUCCESS').length / transactions.length) * 100 : 0,
    };

    log('INFO', 'Análise de transações gerada', analysis);

    return analysis;
  } catch (error) {
    log('ERROR', 'Falha ao gerar análise', { error: error.message });
    throw error;
  }
}

// ============================================================================
// WEBHOOK: Processar Notificações do Mercado Pago
// ============================================================================

/**
 * Processar webhook de pagamento
 */
function processPaymentWebhook(webhookData) {
  try {
    const { action, data } = webhookData;

    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id;

      log('INFO', 'Webhook recebido', {
        action,
        paymentId,
      });

      // Aqui você pode atualizar o banco de dados com o status do pagamento
      // db.updatePayment(paymentId, { status: data.status });

      return {
        success: true,
        message: 'Webhook processado com sucesso',
      };
    }

    return {
      success: false,
      message: 'Ação não reconhecida',
    };
  } catch (error) {
    log('ERROR', 'Falha ao processar webhook', { error: error.message });
    throw error;
  }
}

// ============================================================================
// EXPORTAR FUNÇÕES
// ============================================================================

module.exports = {
  // Pagamentos
  createPaymentPreference,
  createCardPayment,
  getPaymentInfo,
  refundPayment,

  // Cupons
  createCoupon,
  applyCoupon,
  listActiveCoupons,

  // Relatórios
  getSalesSummary,
  getCouponStats,
  getTransactionAnalysis,

  // Webhooks
  processPaymentWebhook,

  // Banco de dados
  db,
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

if (require.main === module) {
  // Exemplo de uso
  (async () => {
    try {
      // Criar cupom
      const coupon = createCoupon({
        code: 'DESCONTO10',
        description: 'Desconto de 10% em todos os planos',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        expiresAt: '2026-12-31',
      });

      console.log('✅ Cupom criado:', coupon);

      // Aplicar cupom
      const result = applyCoupon('DESCONTO10', 100);
      console.log('✅ Cupom aplicado:', result);

      // Resumo de vendas
      const summary = getSalesSummary();
      console.log('📊 Resumo de vendas:', summary);
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }
  })();
}
