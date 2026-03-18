/**
 * Mercado Pago Integration Service
 * Handles payments, subscriptions, and financial transactions
 * 
 * Environment Variables Required:
 * - VITE_MERCADO_PAGO_PUBLIC_KEY: Public key for frontend
 * - MERCADO_PAGO_ACCESS_TOKEN: Access token for backend (server-side only)
 */

interface PaymentData {
  planId: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  email: string;
  phone: string;
  installments?: number;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  status?: string;
  message: string;
  redirectUrl?: string;
}

interface SubscriptionData {
  planId: string;
  userId: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  autoRenew: boolean;
}

interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  status?: string;
  message: string;
  nextBillingDate?: string;
}

interface CommissionPaymentData {
  affiliateId: string;
  amount: number;
  commissionLevel: 1 | 2 | 3;
  referenceId: string;
  description: string;
}

interface CommissionPaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  message: string;
  estimatedDate?: string;
}

interface WithdrawalData {
  userId: string;
  amount: number;
  bankAccount: {
    bankCode: string;
    accountType: 'checking' | 'savings';
    accountNumber: string;
    accountHolder: string;
    cpf: string;
  };
}

interface WithdrawalResponse {
  success: boolean;
  withdrawalId?: string;
  status?: string;
  message: string;
  estimatedDate?: string;
}

/**
 * Initialize Mercado Pago
 * Must be called on app startup
 */
export async function initializeMercadoPago(): Promise<void> {
  const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
  
  if (!publicKey) {
    console.error('[Mercado Pago] Public key not configured');
    throw new Error('Mercado Pago public key is required');
  }

  // Initialize Mercado Pago SDK (frontend)
  if (typeof window !== 'undefined') {
    try {
      // @ts-ignore - Mercado Pago SDK
      window.MercadoPago = new window.MercadoPago(publicKey, {
        locale: 'pt-BR'
      });
    } catch (error) {
      console.error('[Mercado Pago] Failed to initialize SDK:', error);
    }
  }
}

/**
 * Create a payment for a single consultation or service
 */
export async function createPayment(data: PaymentData): Promise<PaymentResponse> {
  try {
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: data.planId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        email: data.email,
        phone: data.phone,
        installments: data.installments || 1,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Payment creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      paymentId: result.id,
      status: result.status,
      message: 'Payment created successfully',
      redirectUrl: result.init_point, // Redirect to Mercado Pago checkout
    };
  } catch (error) {
    console.error('[Mercado Pago] Payment creation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Payment creation failed',
    };
  }
}

/**
 * Create a subscription (SaaS plan)
 */
export async function createSubscription(data: SubscriptionData): Promise<SubscriptionResponse> {
  try {
    const response = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: data.planId,
        userId: data.userId,
        planName: data.planName,
        amount: data.amount,
        billingCycle: data.billingCycle,
        autoRenew: data.autoRenew,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Subscription creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      subscriptionId: result.id,
      status: result.status,
      message: 'Subscription created successfully',
      nextBillingDate: result.nextBillingDate,
    };
  } catch (error) {
    console.error('[Mercado Pago] Subscription creation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Subscription creation failed',
    };
  }
}

/**
 * Process commission payment (Nível 1, 2, ou 3)
 */
export async function processCommissionPayment(data: CommissionPaymentData): Promise<CommissionPaymentResponse> {
  try {
    const response = await fetch('/api/commissions/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        affiliateId: data.affiliateId,
        amount: data.amount,
        commissionLevel: data.commissionLevel,
        referenceId: data.referenceId,
        description: data.description,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Commission payment failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      transactionId: result.transactionId,
      status: result.status,
      message: 'Commission payment processed successfully',
      estimatedDate: result.estimatedDate,
    };
  } catch (error) {
    console.error('[Mercado Pago] Commission payment error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Commission payment failed',
    };
  }
}

/**
 * Process withdrawal (Saque)
 * Applies 5% fee unless user has Clínica Família plan
 */
export async function processWithdrawal(data: WithdrawalData): Promise<WithdrawalResponse> {
  try {
    const response = await fetch('/api/withdrawals/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: data.userId,
        amount: data.amount,
        bankAccount: data.bankAccount,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Withdrawal failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      withdrawalId: result.id,
      status: result.status,
      message: 'Withdrawal processed successfully',
      estimatedDate: result.estimatedDate,
    };
  } catch (error) {
    console.error('[Mercado Pago] Withdrawal error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Withdrawal failed',
    };
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(paymentId: string): Promise<{
  success: boolean;
  status?: string;
  amount?: number;
  payer?: string;
  createdAt?: string;
  message: string;
}> {
  try {
    const response = await fetch(`/api/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment status: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      status: result.status,
      amount: result.transaction_amount,
      payer: result.payer?.email,
      createdAt: result.date_created,
      message: 'Payment status retrieved successfully',
    };
  } catch (error) {
    console.error('[Mercado Pago] Get payment status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get payment status',
    };
  }
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus(subscriptionId: string): Promise<{
  success: boolean;
  status?: string;
  planName?: string;
  nextBillingDate?: string;
  autoRenew?: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get subscription status: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      status: result.status,
      planName: result.planName,
      nextBillingDate: result.nextBillingDate,
      autoRenew: result.autoRenew,
      message: 'Subscription status retrieved successfully',
    };
  } catch (error) {
    console.error('[Mercado Pago] Get subscription status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get subscription status',
    };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<{
  success: boolean;
  message: string;
  cancelledAt?: string;
}> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel subscription: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: 'Subscription cancelled successfully',
      cancelledAt: result.cancelledAt,
    };
  } catch (error) {
    console.error('[Mercado Pago] Cancel subscription error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

/**
 * Webhook handler for Mercado Pago events
 * Should be called from backend API endpoint
 */
export async function handleMercadoPagoWebhook(event: any): Promise<void> {
  try {
    const { type, data } = event;

    switch (type) {
      case 'payment':
        console.log('[Mercado Pago] Payment webhook received:', data.id);
        // Update payment status in database
        // Trigger commission calculation if needed
        break;

      case 'subscription':
        console.log('[Mercado Pago] Subscription webhook received:', data.id);
        // Update subscription status in database
        // Trigger renewal notifications if needed
        break;

      case 'transfer':
        console.log('[Mercado Pago] Transfer webhook received:', data.id);
        // Update withdrawal status in database
        break;

      default:
        console.warn('[Mercado Pago] Unknown webhook type:', type);
    }
  } catch (error) {
    console.error('[Mercado Pago] Webhook handling error:', error);
  }
}

export default {
  initializeMercadoPago,
  createPayment,
  createSubscription,
  processCommissionPayment,
  processWithdrawal,
  getPaymentStatus,
  getSubscriptionStatus,
  cancelSubscription,
  handleMercadoPagoWebhook,
};
