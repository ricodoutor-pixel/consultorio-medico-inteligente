/**
 * CONFIGURAÇÃO MERCADO PAGO - CREDENCIAIS REAIS
 * Checkout Transparente + Webhooks
 */

import MercadoPago from 'mercadopago';

export class MercadoPagoConfig {
  private static instance: MercadoPagoConfig;

  constructor() {
    // Configurar credenciais do Mercado Pago
    MercadoPago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
      integrator_id: process.env.MERCADO_PAGO_INTEGRATOR_ID,
    });

    console.log('✅ Mercado Pago configurado com sucesso');
  }

  static getInstance(): MercadoPagoConfig {
    if (!MercadoPagoConfig.instance) {
      MercadoPagoConfig.instance = new MercadoPagoConfig();
    }
    return MercadoPagoConfig.instance;
  }

  /**
   * Criar preferência de pagamento (Checkout Pro)
   */
  async createPaymentPreference(data: {
    items: Array<{
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
    }>;
    payer: {
      email: string;
      name?: string;
    };
    external_reference: string;
    back_urls: {
      success: string;
      failure: string;
      pending: string;
    };
  }) {
    try {
      const preference = new MercadoPago.Preference({
        items: data.items,
        payer: data.payer,
        external_reference: data.external_reference,
        back_urls: data.back_urls,
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL}/api/mercado-pago/webhook`,
      });

      const response = await preference.save();
      console.log('✅ Preferência criada:', response.body.id);
      return response.body;
    } catch (error) {
      console.error('❌ Erro ao criar preferência:', error);
      throw error;
    }
  }

  /**
   * Criar pagamento com cartão (Checkout Transparente)
   */
  async createCardPayment(data: {
    transaction_amount: number;
    token: string;
    description: string;
    installments: number;
    payer: {
      email: string;
      identification: {
        type: string;
        number: string;
      };
    };
    statement_descriptor?: string;
  }) {
    try {
      const payment = new MercadoPago.Payment({
        transaction_amount: data.transaction_amount,
        token: data.token,
        description: data.description,
        installments: data.installments,
        payment_method_id: 'credit_card',
        payer: data.payer,
        statement_descriptor: data.statement_descriptor || 'PLANTAYRAIZ',
        notification_url: `${process.env.APP_URL}/api/mercado-pago/webhook`,
      });

      const response = await payment.save();
      console.log('✅ Pagamento processado:', response.body.id);
      return response.body;
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      throw error;
    }
  }

  /**
   * Obter informações de pagamento
   */
  async getPaymentInfo(paymentId: number) {
    try {
      const response = await MercadoPago.payment.findById(paymentId);
      console.log('✅ Informações do pagamento obtidas:', response.body.id);
      return response.body;
    } catch (error) {
      console.error('❌ Erro ao obter informações:', error);
      throw error;
    }
  }

  /**
   * Reembolsar pagamento
   */
  async refundPayment(paymentId: number, amount?: number) {
    try {
      const refund = new MercadoPago.Refund({
        payment_id: paymentId,
        amount: amount,
      });

      const response = await refund.save();
      console.log('✅ Reembolso processado:', response.body.id);
      return response.body;
    } catch (error) {
      console.error('❌ Erro ao reembolsar:', error);
      throw error;
    }
  }

  /**
   * Processar webhook de pagamento
   */
  async processPaymentWebhook(data: {
    id: string;
    type: string;
    data: {
      id: string;
    };
  }) {
    try {
      if (data.type === 'payment') {
        const paymentId = data.data.id;
        const paymentInfo = await this.getPaymentInfo(Number(paymentId));

        console.log('✅ Webhook processado:', {
          id: paymentInfo.id,
          status: paymentInfo.status,
          amount: paymentInfo.transaction_amount,
        });

        return paymentInfo;
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Criar tokenização de cartão
   */
  async createCardToken(data: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: number;
    cardExpirationYear: number;
    securityCode: string;
  }) {
    try {
      const token = new MercadoPago.CardToken({
        cardNumber: data.cardNumber,
        cardholderName: data.cardholderName,
        cardExpirationMonth: data.cardExpirationMonth,
        cardExpirationYear: data.cardExpirationYear,
        securityCode: data.securityCode,
      });

      const response = await token.save();
      console.log('✅ Token de cartão criado:', response.body.id);
      return response.body;
    } catch (error) {
      console.error('❌ Erro ao criar token:', error);
      throw error;
    }
  }

  /**
   * Listar métodos de pagamento
   */
  async getPaymentMethods() {
    try {
      const response = await MercadoPago.paymentMethod.all();
      console.log('✅ Métodos de pagamento obtidos');
      return response.body;
    } catch (error) {
      console.error('❌ Erro ao obter métodos:', error);
      throw error;
    }
  }

  /**
   * Obter instituições de crédito
   */
  async getIssuers(paymentMethodId: string) {
    try {
      const response = await MercadoPago.issuer.all({
        payment_method_id: paymentMethodId,
      });
      console.log('✅ Instituições obtidas');
      return response.body;
    } catch (error) {
      console.error('❌ Erro ao obter instituições:', error);
      throw error;
    }
  }

  /**
   * Obter parcelamentos disponíveis
   */
  async getInstallments(
    amount: number,
    paymentMethodId: string,
    issuerId?: string
  ) {
    try {
      const response = await MercadoPago.installment.all({
        amount: amount,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId,
      });
      console.log('✅ Parcelamentos obtidos');
      return response.body;
    } catch (error) {
      console.error('❌ Erro ao obter parcelamentos:', error);
      throw error;
    }
  }
}

/**
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS
 * 
 * MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_aqui
 * MERCADO_PAGO_PUBLIC_KEY=sua_public_key_aqui
 * MERCADO_PAGO_CLIENT_ID=seu_client_id_aqui
 * MERCADO_PAGO_CLIENT_SECRET=seu_client_secret_aqui
 * MERCADO_PAGO_INTEGRATOR_ID=seu_integrator_id_aqui (opcional)
 * APP_URL=https://plantayraiz.com.br
 */

/**
 * FLUXO DE CHECKOUT TRANSPARENTE
 * 
 * 1. Frontend: Captura dados do cartão
 * 2. Frontend: Cria token com Mercado Pago.js
 * 3. Frontend: Envia token para backend
 * 4. Backend: Processa pagamento com token
 * 5. Backend: Retorna status do pagamento
 * 6. Frontend: Redireciona para sucesso/erro
 * 7. Backend: Recebe webhook de confirmação
 * 8. Backend: Atualiza status no banco de dados
 * 
 * ENDPOINTS NECESSÁRIOS
 * 
 * POST /api/mercado-pago/create-preference
 * POST /api/mercado-pago/create-payment
 * GET /api/mercado-pago/payment/:id
 * POST /api/mercado-pago/refund
 * POST /api/mercado-pago/webhook
 * GET /api/mercado-pago/payment-methods
 * GET /api/mercado-pago/issuers/:paymentMethodId
 * GET /api/mercado-pago/installments
 */

/**
 * TESTES COM CARTÃO DE TESTE
 * 
 * Cartão Aprovado:
 * - Número: 5031 7557 3453 2521
 * - Validade: 11/25
 * - CVV: 123
 * - Titular: TEST USER
 * 
 * Cartão Recusado:
 * - Número: 5031 4332 1540 6351
 * - Validade: 11/25
 * - CVV: 123
 * - Titular: TEST USER
 */
