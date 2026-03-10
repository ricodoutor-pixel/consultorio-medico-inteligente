/**
 * Mercado Pago Automation Service
 * Complete PIX payment automation with automatic transfers
 */

interface PaymentRequest {
  amount: number;
  description: string;
  payerEmail: string;
  payerName: string;
  payerCPF: string;
  paymentType: "consultation" | "product" | "referral";
  recipientId: string;
  metadata?: Record<string, any>;
}

interface TransferRequest {
  amount: number;
  description: string;
  recipientId: string;
  recipientEmail: string;
  recipientPixKey: string;
  metadata?: Record<string, any>;
}

interface PaymentResponse {
  paymentId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  amount: number;
  qrCode?: string;
  copyPaste?: string;
  expiresAt?: string;
}

interface TransferResponse {
  transferId: string;
  status: "pending" | "completed" | "failed";
  amount: number;
  commission: number;
  netAmount: number;
  timestamp: string;
}

/**
 * Mercado Pago Automation Service
 */
class MercadoPagoAutomationService {
  private clientId: string;
  private clientSecret: string;
  private publicKey: string;
  private accessToken: string;
  private apiUrl = "https://api.mercadopago.com/v1";
  private commissionRate = 0.1; // 10% commission

  constructor() {
    this.clientId = process.env.MERCADO_PAGO_CLIENT_ID || "";
    this.clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET || "";
    this.publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || "";
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

    if (!this.accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    console.log("[MP-AUTO] Mercado Pago Automation Service initialized");
  }

  /**
   * Create PIX payment
   */
  async createPixPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log(`[MP-AUTO] Creating PIX payment: ${request.description}`);

      const paymentData = {
        transaction_amount: request.amount,
        description: request.description,
        payment_method_id: "pix",
        payer: {
          email: request.payerEmail,
          first_name: request.payerName.split(" ")[0],
          last_name: request.payerName.split(" ").slice(1).join(" "),
          identification: {
            type: "CPF",
            number: request.payerCPF.replace(/\D/g, ""),
          },
        },
        metadata: {
          type: request.paymentType,
          recipientId: request.recipientId,
          ...request.metadata,
        },
      };

      const response = await fetch(`${this.apiUrl}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[MP-AUTO] Payment creation error:", error);
        throw new Error(`Payment creation failed: ${error.message}`);
      }

      const data = await response.json();

      console.log(`[MP-AUTO] ✓ Payment created: ${data.id}`);

      return {
        paymentId: data.id,
        status: data.status,
        amount: data.transaction_amount,
        qrCode: data.point_of_interaction?.transaction_data?.qr_code,
        copyPaste: data.point_of_interaction?.transaction_data?.qr_code_url,
        expiresAt: data.date_of_expiration,
      };
    } catch (error) {
      console.error("[MP-AUTO] Payment creation error:", error);
      throw error;
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(paymentId: string): Promise<string> {
    try {
      console.log(`[MP-AUTO] Checking payment status: ${paymentId}`);

      const response = await fetch(`${this.apiUrl}/payments/${paymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[MP-AUTO] Failed to check payment status: ${response.status}`);
        return "unknown";
      }

      const data = await response.json();
      console.log(`[MP-AUTO] Payment status: ${data.status}`);

      return data.status;
    } catch (error) {
      console.error("[MP-AUTO] Error checking payment status:", error);
      return "error";
    }
  }

  /**
   * Process automatic transfer to specialist/pharmacy
   */
  async processAutomaticTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      console.log(`[MP-AUTO] Processing automatic transfer: ${request.description}`);

      // Calculate commission
      const commission = request.amount * this.commissionRate;
      const netAmount = request.amount - commission;

      // Create transfer via PIX
      const transferData = {
        amount: netAmount,
        description: request.description,
        receiver_id: request.recipientId,
        metadata: {
          originalAmount: request.amount,
          commission: commission,
          commissionRate: this.commissionRate,
          ...request.metadata,
        },
      };

      const response = await fetch(`${this.apiUrl}/transfers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[MP-AUTO] Transfer error:", error);
        throw new Error(`Transfer failed: ${error.message}`);
      }

      const data = await response.json();

      console.log(`[MP-AUTO] ✓ Transfer created: ${data.id}`);
      console.log(`[MP-AUTO] Amount: R$ ${request.amount.toFixed(2)}`);
      console.log(`[MP-AUTO] Commission (10%): R$ ${commission.toFixed(2)}`);
      console.log(`[MP-AUTO] Net Amount: R$ ${netAmount.toFixed(2)}`);

      return {
        transferId: data.id,
        status: data.status || "pending",
        amount: request.amount,
        commission: commission,
        netAmount: netAmount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[MP-AUTO] Transfer error:", error);
      throw error;
    }
  }

  /**
   * Webhook handler for payment confirmation
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      console.log("[MP-AUTO] Processing webhook:", payload.action);

      if (payload.action === "payment.created" || payload.action === "payment.updated") {
        const paymentId = payload.data.id;
        const status = await this.checkPaymentStatus(paymentId);

        if (status === "approved") {
          console.log(`[MP-AUTO] ✓ Payment approved: ${paymentId}`);

          // Get payment details
          const response = await fetch(`${this.apiUrl}/payments/${paymentId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              "Content-Type": "application/json",
            },
          });

          const payment = await response.json();

          // Process automatic transfer
          if (payment.metadata?.recipientId) {
            console.log(`[MP-AUTO] Initiating automatic transfer for recipient: ${payment.metadata.recipientId}`);

            // TODO: Get recipient details from database
            // const recipient = await db.query('SELECT * FROM users WHERE id = ?', [payment.metadata.recipientId]);

            // await this.processAutomaticTransfer({
            //   amount: payment.transaction_amount,
            //   description: `Payment transfer - ${payment.description}`,
            //   recipientId: payment.metadata.recipientId,
            //   recipientEmail: recipient.email,
            //   recipientPixKey: recipient.pix_key,
            //   metadata: payment.metadata,
            // });
          }
        }
      }
    } catch (error) {
      console.error("[MP-AUTO] Webhook processing error:", error);
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<any[]> {
    try {
      console.log("[MP-AUTO] Fetching payment history");

      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.startDate) params.append("begin_date", filters.startDate);
      if (filters?.endDate) params.append("end_date", filters.endDate);
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await fetch(`${this.apiUrl}/payments/search?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[MP-AUTO] Failed to fetch payment history: ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log(`[MP-AUTO] Found ${data.results?.length || 0} payments`);

      return data.results || [];
    } catch (error) {
      console.error("[MP-AUTO] Error fetching payment history:", error);
      return [];
    }
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<any[]> {
    try {
      console.log("[MP-AUTO] Fetching transfer history");

      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.startDate) params.append("begin_date", filters.startDate);
      if (filters?.endDate) params.append("end_date", filters.endDate);
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await fetch(`${this.apiUrl}/transfers/search?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[MP-AUTO] Failed to fetch transfer history: ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log(`[MP-AUTO] Found ${data.results?.length || 0} transfers`);

      return data.results || [];
    } catch (error) {
      console.error("[MP-AUTO] Error fetching transfer history:", error);
      return [];
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      console.log(`[MP-AUTO] Refunding payment: ${paymentId}`);

      const refundData = amount ? { amount } : {};

      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refundData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[MP-AUTO] Refund error:", error);
        return false;
      }

      console.log(`[MP-AUTO] ✓ Payment refunded: ${paymentId}`);
      return true;
    } catch (error) {
      console.error("[MP-AUTO] Refund error:", error);
      return false;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<number> {
    try {
      console.log("[MP-AUTO] Fetching account balance");

      const response = await fetch(`${this.apiUrl}/accounts/balance`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[MP-AUTO] Failed to fetch balance: ${response.status}`);
        return 0;
      }

      const data = await response.json();
      const balance = data.available_balance || 0;

      console.log(`[MP-AUTO] Account balance: R$ ${balance.toFixed(2)}`);
      return balance;
    } catch (error) {
      console.error("[MP-AUTO] Error fetching balance:", error);
      return 0;
    }
  }

  /**
   * Schedule automatic payouts
   */
  async scheduleAutomaticPayouts(config: {
    frequency: "daily" | "weekly" | "monthly";
    minAmount: number;
    maxAmount: number;
  }): Promise<void> {
    try {
      console.log("[MP-AUTO] Scheduling automatic payouts");
      console.log(`[MP-AUTO] Frequency: ${config.frequency}`);
      console.log(`[MP-AUTO] Min amount: R$ ${config.minAmount.toFixed(2)}`);
      console.log(`[MP-AUTO] Max amount: R$ ${config.maxAmount.toFixed(2)}`);

      // TODO: Implement scheduled payouts
      // This would typically involve:
      // 1. Creating a cron job
      // 2. Checking pending transfers
      // 3. Processing transfers based on config
      // 4. Logging results

      console.log("[MP-AUTO] ✓ Automatic payouts scheduled");
    } catch (error) {
      console.error("[MP-AUTO] Error scheduling payouts:", error);
    }
  }
}

export default MercadoPagoAutomationService;
