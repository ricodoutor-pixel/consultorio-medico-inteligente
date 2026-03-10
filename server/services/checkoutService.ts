import crypto from 'crypto';

/**
 * Serviço de Checkout Automático com Mercado Pago
 * Integra pagamento PIX/Cartão com auto-confirmação de consulta
 */

export interface CheckoutSession {
  id: string;
  consultationId: string;
  patientId: string;
  amount: number;
  currency: 'BRL';
  paymentMethod: 'pix' | 'credit_card' | 'debit_card';
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled';
  mercadoPagoId?: string;
  pixQRCode?: string;
  pixCopyPaste?: string;
  createdAt: Date;
  expiresAt: Date;
  approvedAt?: Date;
  receiptUrl?: string;
  jitsiAccessLink?: string;
}

export interface WebhookPayload {
  id: string;
  type: string;
  data: {
    id: string;
  };
  action: string;
  api_version: string;
}

class CheckoutService {
  private mercadoPagoAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
  private mercadoPagoPublicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || '';
  private webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || 'webhook-secret';

  /**
   * Cria sessão de checkout
   */
  async createCheckoutSession(data: {
    consultationId: string;
    patientId: string;
    patientEmail: string;
    patientName: string;
    professionalName: string;
    amount: number;
    paymentMethod: 'pix' | 'credit_card' | 'debit_card';
  }): Promise<CheckoutSession> {
    try {
      const checkoutSession: CheckoutSession = {
        id: `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        consultationId: data.consultationId,
        patientId: data.patientId,
        amount: data.amount,
        currency: 'BRL',
        paymentMethod: data.paymentMethod,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      };

      // Simular integração com Mercado Pago
      if (data.paymentMethod === 'pix') {
        checkoutSession.pixQRCode = this.generatePixQRCode(data.amount);
        checkoutSession.pixCopyPaste = this.generatePixCopyPaste(data.amount);
      }

      checkoutSession.mercadoPagoId = `MP_${Date.now()}`;

      console.log(`[CHECKOUT] Sessão criada: ${checkoutSession.id}`);
      return checkoutSession;
    } catch (error) {
      throw new Error(`Falha ao criar sessão de checkout: ${error}`);
    }
  }

  /**
   * Processa pagamento
   */
  async processPayment(checkoutSession: CheckoutSession): Promise<CheckoutSession> {
    try {
      checkoutSession.status = 'processing';

      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      checkoutSession.status = 'approved';
      checkoutSession.approvedAt = new Date();

      console.log(`[CHECKOUT] Pagamento aprovado: ${checkoutSession.id}`);
      return checkoutSession;
    } catch (error) {
      checkoutSession.status = 'rejected';
      throw new Error(`Falha ao processar pagamento: ${error}`);
    }
  }

  /**
   * Gera link de acesso Jitsi após pagamento aprovado
   */
  async generateJitsiAccessLink(checkoutSession: CheckoutSession): Promise<string> {
    try {
      if (checkoutSession.status !== 'approved') {
        throw new Error('Pagamento não foi aprovado');
      }

      const jitsiLink = `https://meet.plantaeraiz.com/consultation-${checkoutSession.consultationId}`;
      checkoutSession.jitsiAccessLink = jitsiLink;

      console.log(`[CHECKOUT] Link Jitsi gerado: ${jitsiLink}`);
      return jitsiLink;
    } catch (error) {
      throw new Error(`Falha ao gerar link Jitsi: ${error}`);
    }
  }

  /**
   * Gera recibo de pagamento
   */
  async generateReceipt(checkoutSession: CheckoutSession): Promise<string> {
    try {
      const receipt = `
RECIBO DE PAGAMENTO
═══════════════════════════════════════════════════════════════

ID da Transação: ${checkoutSession.id}
ID Mercado Pago: ${checkoutSession.mercadoPagoId}
Data: ${checkoutSession.approvedAt?.toLocaleString('pt-BR')}

DETALHES DO PAGAMENTO:
Valor: R$ ${checkoutSession.amount.toFixed(2)}
Moeda: ${checkoutSession.currency}
Método: ${checkoutSession.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
Status: ${checkoutSession.status.toUpperCase()}

═══════════════════════════════════════════════════════════════

PRÓXIMOS PASSOS:
1. Acesse a consulta pelo link: ${checkoutSession.jitsiAccessLink}
2. Conecte-se 5 minutos antes do horário agendado
3. Tenha câmera e microfone testados

═══════════════════════════════════════════════════════════════

Conforme Lei Geral de Proteção de Dados (LGPD)
Plataforma Planta & Raiz - Telemedicina
      `;

      checkoutSession.receiptUrl = `https://plantaeraiz.com/receipts/${checkoutSession.id}`;

      return receipt;
    } catch (error) {
      throw new Error(`Falha ao gerar recibo: ${error}`);
    }
  }

  /**
   * Processa webhook do Mercado Pago
   */
  async processWebhook(payload: WebhookPayload, signature: string): Promise<boolean> {
    try {
      // Validar assinatura do webhook
      const isValid = this.validateWebhookSignature(JSON.stringify(payload), signature);
      if (!isValid) {
        throw new Error('Assinatura do webhook inválida');
      }

      // Processar diferentes tipos de eventos
      switch (payload.type) {
        case 'payment':
          await this.handlePaymentWebhook(payload);
          break;
        case 'plan':
          await this.handlePlanWebhook(payload);
          break;
        case 'subscription':
          await this.handleSubscriptionWebhook(payload);
          break;
        default:
          console.log(`[WEBHOOK] Tipo de evento desconhecido: ${payload.type}`);
      }

      return true;
    } catch (error) {
      console.error(`Erro ao processar webhook: ${error}`);
      return false;
    }
  }

  /**
   * Processa webhook de pagamento
   */
  private async handlePaymentWebhook(payload: WebhookPayload): Promise<void> {
    try {
      const paymentId = payload.data.id;

      // TODO: Buscar pagamento no banco de dados
      // TODO: Atualizar status da consulta
      // TODO: Gerar link Jitsi
      // TODO: Enviar email ao paciente
      // TODO: Notificar profissional

      console.log(`[WEBHOOK] Pagamento processado: ${paymentId}`);
    } catch (error) {
      console.error(`Erro ao processar webhook de pagamento: ${error}`);
    }
  }

  /**
   * Processa webhook de plano
   */
  private async handlePlanWebhook(payload: WebhookPayload): Promise<void> {
    try {
      console.log(`[WEBHOOK] Plano processado: ${payload.data.id}`);
    } catch (error) {
      console.error(`Erro ao processar webhook de plano: ${error}`);
    }
  }

  /**
   * Processa webhook de assinatura
   */
  private async handleSubscriptionWebhook(payload: WebhookPayload): Promise<void> {
    try {
      console.log(`[WEBHOOK] Assinatura processada: ${payload.data.id}`);
    } catch (error) {
      console.error(`Erro ao processar webhook de assinatura: ${error}`);
    }
  }

  /**
   * Valida assinatura do webhook
   */
  private validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error(`Erro ao validar assinatura: ${error}`);
      return false;
    }
  }

  /**
   * Gera QR Code PIX
   */
  private generatePixQRCode(amount: number): string {
    // Simular QR Code PIX
    const pixData = {
      amount: amount.toFixed(2),
      timestamp: new Date().toISOString(),
      reference: `PLANTA_${Date.now()}`,
    };

    return Buffer.from(JSON.stringify(pixData)).toString('base64');
  }

  /**
   * Gera cópia e cola PIX
   */
  private generatePixCopyPaste(amount: number): string {
    // Simular chave PIX cópia e cola
    return `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865802BR5913PLANTA E RAIZ6009SAO PAULO62410503***63041D3D`;
  }

  /**
   * Cria assinatura de plano
   */
  async createSubscription(data: {
    patientId: string;
    planId: string;
    planName: string;
    amount: number;
    billingCycle: 'monthly' | 'quarterly' | 'annual';
  }): Promise<any> {
    try {
      const subscription = {
        id: `sub_${Date.now()}`,
        patientId: data.patientId,
        planId: data.planId,
        planName: data.planName,
        amount: data.amount,
        billingCycle: data.billingCycle,
        status: 'active',
        createdAt: new Date(),
        nextBillingDate: this.calculateNextBillingDate(data.billingCycle),
      };

      console.log(`[SUBSCRIPTION] Assinatura criada: ${subscription.id}`);
      return subscription;
    } catch (error) {
      throw new Error(`Falha ao criar assinatura: ${error}`);
    }
  }

  /**
   * Calcula próxima data de cobrança
   */
  private calculateNextBillingDate(billingCycle: string): Date {
    const date = new Date();

    switch (billingCycle) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'annual':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date;
  }

  /**
   * Cancela assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // TODO: Chamar API Mercado Pago para cancelar
      console.log(`[SUBSCRIPTION] Assinatura cancelada: ${subscriptionId}`);
      return true;
    } catch (error) {
      throw new Error(`Falha ao cancelar assinatura: ${error}`);
    }
  }

  /**
   * Retorna histórico de pagamentos
   */
  async getPaymentHistory(patientId: string): Promise<any[]> {
    try {
      // TODO: Buscar histórico no banco de dados
      return [];
    } catch (error) {
      throw new Error(`Falha ao buscar histórico: ${error}`);
    }
  }
}

export default new CheckoutService();
