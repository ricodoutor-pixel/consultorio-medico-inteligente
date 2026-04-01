// @ts-nocheck
/**
 * Mercado Pago Integration - Club Planta y Raiz
 * Processamento de pagamentos de produtos com administração 24/7 pelo Manus CEO
 */

import axios from 'axios';
import { invokeLLM } from './llm';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'refunded';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress?: {
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
}

interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  description: string;
  payer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  payment_method_id: string;
  installments: number;
  net_received_amount: number;
}

/**
 * Classe para gerenciar pagamentos via Mercado Pago
 * Administrada 24/7 pelo Manus CEO
 */
export class MercadoPagoClubService {
  private apiUrl = 'https://api.mercadopago.com/v1';
  private accessToken = process.env.MERCADO_PAGO_API_KEY || '';
  private notificationUrl = `${process.env.BACKEND_URL}/api/webhooks/mercado-pago`;

  constructor() {
    if (!this.accessToken) {
      console.error('❌ MERCADO_PAGO_API_KEY não configurada!');
    }
  }

  /**
   * Criar preferência de pagamento (checkout)
   * Manus CEO: Administra automaticamente
   */
  async createPaymentPreference(order: Order): Promise<string> {
    try {
      console.log(`💳 Manus CEO: Criando preferência de pagamento para pedido ${order.id}`);

      const items = order.items.map((item) => ({
        id: item.productId,
        title: `Produto ${item.productId}`,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'BRL',
      }));

      const preference = {
        items,
        payer: {
          email: 'cliente@plantayraiz.com.br',
          name: 'Cliente Planta y Raiz',
          phone: {
            area_code: '11',
            number: '98713-1241',
          },
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/club/pagamento/sucesso`,
          failure: `${process.env.FRONTEND_URL}/club/pagamento/erro`,
          pending: `${process.env.FRONTEND_URL}/club/pagamento/pendente`,
        },
        auto_return: 'approved',
        notification_url: this.notificationUrl,
        external_reference: order.id,
        metadata: {
          orderId: order.id,
          userId: order.userId,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await axios.post(`${this.apiUrl}/checkout/preferences`, preference, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ Manus CEO: Preferência criada com sucesso - ${response.data.id}`);
      return response.data.init_point; // URL do checkout
    } catch (error) {
      console.error('❌ Erro ao criar preferência:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento (após confirmação do Mercado Pago)
   * Manus CEO: Valida e aprova automaticamente
   */
  async processPayment(paymentData: MercadoPagoPayment, orderId: string): Promise<Order> {
    try {
      console.log(`💰 Manus CEO: Processando pagamento ${paymentData.id} para pedido ${orderId}`);

      // Validar status do pagamento
      if (paymentData.status === 'approved') {
        console.log(`✅ Manus CEO: Pagamento aprovado! Valor: R$ ${paymentData.transaction_amount}`);

        // Atualizar status do pedido
        const order = await this.updateOrderStatus(orderId, 'approved', paymentData.id.toString());

        // Notificar cliente via Twilio
        await this.notifyCustomer(order, 'approved');

        // Registrar na auditoria
        await this.auditPayment(order, paymentData, 'approved');

        // Agendar envio automático
        await this.scheduleShipment(order);

        return order;
      } else if (paymentData.status === 'pending') {
        console.log(`⏳ Manus CEO: Pagamento pendente - aguardando confirmação`);
        await this.updateOrderStatus(orderId, 'processing', paymentData.id.toString());
        await this.notifyCustomer(
          { id: orderId } as Order,
          'pending'
        );
      } else if (paymentData.status === 'rejected') {
        console.log(`❌ Manus CEO: Pagamento rejeitado - motivo: ${paymentData.status_detail}`);
        await this.updateOrderStatus(orderId, 'rejected', paymentData.id.toString());
        await this.notifyCustomer({ id: orderId } as Order, 'rejected');
      }

      return {} as Order;
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      throw error;
    }
  }

  /**
   * Consultar status de pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<MercadoPagoPayment> {
    try {
      const response = await axios.get(`${this.apiUrl}/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao consultar pagamento:', error);
      throw error;
    }
  }

  /**
   * Processar reembolso (Manus CEO)
   */
  async processRefund(paymentId: string, amount?: number): Promise<void> {
    try {
      console.log(`🔄 Manus CEO: Processando reembolso para pagamento ${paymentId}`);

      const refundData = amount ? { amount } : {};

      const response = await axios.post(
        `${this.apiUrl}/payments/${paymentId}/refunds`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ Manus CEO: Reembolso processado com sucesso - ${response.data.id}`);
    } catch (error) {
      console.error('❌ Erro ao processar reembolso:', error);
      throw error;
    }
  }

  /**
   * Atualizar status do pedido
   */
  private async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    paymentId: string
  ): Promise<Order> {
    // Aqui você faria a atualização no banco de dados
    console.log(`📝 Manus CEO: Atualizando pedido ${orderId} para status ${status}`);

    return {
      id: orderId,
      userId: '',
      items: [],
      totalAmount: 0,
      status,
      paymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Notificar cliente via Twilio
   */
  private async notifyCustomer(order: Order, status: string): Promise<void> {
    try {
      const messages: Record<string, string> = {
        approved: `✅ Seu pagamento foi aprovado! Pedido #${order.id} será enviado em breve.`,
        pending: `⏳ Seu pagamento está sendo processado. Pedido #${order.id} em análise.`,
        rejected: `❌ Seu pagamento foi rejeitado. Pedido #${order.id} cancelado.`,
      };

      console.log(`📱 Manus CEO: Enviando notificação WhatsApp - ${messages[status]}`);

      // Aqui você faria a integração com Twilio
      // await twilioService.sendWhatsApp(customerPhone, messages[status]);
    } catch (error) {
      console.error('❌ Erro ao notificar cliente:', error);
    }
  }

  /**
   * Registrar na auditoria (Compliance)
   */
  private async auditPayment(
    order: Order,
    paymentData: MercadoPagoPayment,
    status: string
  ): Promise<void> {
    try {
      const auditLog = {
        timestamp: new Date(),
        orderId: order.id,
        paymentId: paymentData.id,
        amount: paymentData.transaction_amount,
        status,
        payer: paymentData.payer.email,
        agent: 'Manus CEO',
        action: 'payment_processed',
      };

      console.log(`📋 Manus CEO: Registrando na auditoria:`, auditLog);

      // Aqui você faria o registro no banco de dados
    } catch (error) {
      console.error('❌ Erro ao registrar auditoria:', error);
    }
  }

  /**
   * Agendar envio automático (Manus CEO)
   */
  private async scheduleShipment(order: Order): Promise<void> {
    try {
      console.log(`📦 Manus CEO: Agendando envio automático para pedido ${order.id}`);

      // Usar IA para determinar melhor transportadora
      const shipmentRecommendation = await invokeLLM({
        messages: [
          {
            role: 'system',
            content:
              'Você é um agente de logística. Recomende a melhor transportadora baseado no endereço e valor do pedido.',
          },
          {
            role: 'user',
            content: `Pedido: ${order.id}, Valor: R$ ${order.totalAmount}, Endereço: ${JSON.stringify(order.shippingAddress)}`,
          },
        ],
      });

      console.log(`🚚 Manus CEO: Recomendação de transportadora:`, shipmentRecommendation);

      // Aqui você faria a integração com a transportadora
    } catch (error) {
      console.error('❌ Erro ao agendar envio:', error);
    }
  }

  /**
   * Gerar relatório financeiro (Manus CEO)
   */
  async generateFinancialReport(startDate: Date, endDate: Date): Promise<void> {
    try {
      console.log(`📊 Manus CEO: Gerando relatório financeiro de ${startDate} a ${endDate}`);

      // Consultar pagamentos aprovados
      const response = await axios.get(`${this.apiUrl}/payments/search`, {
        params: {
          range: 'date_created',
          begin_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'approved',
          sort: 'date_created',
          criteria: 'desc',
          limit: 100,
        },
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const payments = response.data.results;
      const totalRevenue = payments.reduce(
        (sum: number, p: MercadoPagoPayment) => sum + p.transaction_amount,
        0
      );
      const totalFees = payments.reduce(
        (sum: number, p: MercadoPagoPayment) => sum + (p.transaction_amount - p.net_received_amount),
        0
      );

      const report = {
        period: `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
        totalPayments: payments.length,
        totalRevenue,
        totalFees,
        netRevenue: totalRevenue - totalFees,
        averageTicket: totalRevenue / payments.length,
        timestamp: new Date(),
        generatedBy: 'Manus CEO',
      };

      console.log(`✅ Manus CEO: Relatório gerado:`, report);

      // Aqui você faria o envio do relatório por email
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
    }
  }

  /**
   * Webhook handler para Mercado Pago
   */
  async handleWebhook(data: any): Promise<void> {
    try {
      console.log(`🔔 Manus CEO: Recebendo webhook do Mercado Pago:`, data);

      if (data.type === 'payment') {
        const payment = await this.getPaymentStatus(data.data.id);
        const orderId = data.data.external_reference;

        if (orderId) {
          await this.processPayment(payment, orderId);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
    }
  }
}

// Exportar instância singleton
export const mercadoPagoClub = new MercadoPagoClubService();
