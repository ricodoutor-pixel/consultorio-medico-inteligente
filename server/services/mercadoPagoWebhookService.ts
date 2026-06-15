import crypto from 'crypto';

export interface MercadoPagoNotification {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  resource: {
    id: string;
    status: string;
  };
  data: {
    id: string;
  };
}

export interface PaymentConfirmation {
  paymentId: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  amount: number;
  payer: string;
  timestamp: Date;
  confirmed: boolean;
}

export class MercadoPagoWebhookService {
  private static readonly WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || '';

  /**
   * Valida assinatura do webhook
   */
  static validateWebhookSignature(
    body: string,
    signature: string,
    timestamp: string
  ): boolean {
    const message = `${timestamp}.${body}`;
    const hash = crypto
      .createHmac('sha256', this.WEBHOOK_SECRET)
      .update(message)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Processa notificação de pagamento
   */
  static async processPaymentNotification(
    notification: MercadoPagoNotification
  ): Promise<PaymentConfirmation> {
    const paymentId = notification.data.id;
    const status = this.mapMercadoPagoStatus(notification.resource.status);

    const confirmation: PaymentConfirmation = {
      paymentId,
      status,
      amount: 0, // Será preenchido com dados reais do Mercado Pago
      payer: '', // Será preenchido com dados reais do Mercado Pago
      timestamp: new Date(),
      confirmed: status === 'approved',
    };

    return confirmation;
  }

  /**
   * Mapeia status do Mercado Pago para status interno
   */
  private static mapMercadoPagoStatus(
    mpStatus: string
  ): 'approved' | 'pending' | 'rejected' | 'cancelled' {
    const statusMap: { [key: string]: 'approved' | 'pending' | 'rejected' | 'cancelled' } = {
      'approved': 'approved',
      'pending': 'pending',
      'authorized': 'pending',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'cancelled',
      'charged_back': 'rejected',
    };

    return statusMap[mpStatus] || 'pending';
  }

  /**
   * Confirma pagamento automaticamente
   */
  static async confirmPayment(paymentId: string): Promise<{
    success: boolean;
    message: string;
    paymentData: PaymentConfirmation;
  }> {
    try {
      // Aqui você faria uma chamada real à API do Mercado Pago
      // Para este exemplo, simulamos a confirmação

      const paymentData: PaymentConfirmation = {
        paymentId,
        status: 'approved',
        amount: 100, // Mock
        payer: 'user@example.com',
        timestamp: new Date(),
        confirmed: true,
      };

      return {
        success: true,
        message: `Pagamento ${paymentId} confirmado com sucesso`,
        paymentData,
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao confirmar pagamento: ${error}`,
        paymentData: {
          paymentId,
          status: 'rejected',
          amount: 0,
          payer: '',
          timestamp: new Date(),
          confirmed: false,
        },
      };
    }
  }

  /**
   * Gera webhook payload para teste
   */
  static generateTestWebhookPayload(): MercadoPagoNotification {
    return {
      id: `webhook-${Date.now()}`,
      live_mode: false,
      type: 'payment',
      date_created: new Date().toISOString(),
      user_id: 123456789,
      resource: {
        id: `payment-${Date.now()}`,
        status: 'approved',
      },
      data: {
        id: `payment-${Date.now()}`,
      },
    };
  }

  /**
   * Processa múltiplas notificações em batch
   */
  static async processBatchNotifications(
    notifications: MercadoPagoNotification[]
  ): Promise<PaymentConfirmation[]> {
    const confirmations = await Promise.all(
      notifications.map((notification) => this.processPaymentNotification(notification))
    );

    return confirmations;
  }

  /**
   * Gera relatório de webhooks processados
   */
  static generateWebhookReport(confirmations: PaymentConfirmation[]): {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    successRate: number;
    totalAmount: number;
  } {
    const total = confirmations.length;
    const approved = confirmations.filter((c) => c.status === 'approved').length;
    const pending = confirmations.filter((c) => c.status === 'pending').length;
    const rejected = confirmations.filter((c) => c.status === 'rejected').length;
    const successRate = total > 0 ? (approved / total) * 100 : 0;
    const totalAmount = confirmations.reduce((sum, c) => sum + c.amount, 0);

    return {
      total,
      approved,
      pending,
      rejected,
      successRate: Math.round(successRate),
      totalAmount,
    };
  }

  /**
   * Envia notificação de pagamento confirmado
   */
  static async sendPaymentConfirmationNotification(
    paymentId: string,
    userEmail: string,
    amount: number
  ): Promise<boolean> {
    try {
      // Aqui você enviaria um email ou notificação push
      console.log(`Notificação de pagamento enviada para ${userEmail}: R$ ${amount}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  }

  /**
   * Reprocessa pagamentos com erro
   */
  static async retryFailedPayments(
    failedPayments: PaymentConfirmation[]
  ): Promise<PaymentConfirmation[]> {
    const retried = await Promise.all(
      failedPayments.map(async (payment) => {
        const result = await this.confirmPayment(payment.paymentId);
        return result.paymentData;
      })
    );

    return retried;
  }
}
