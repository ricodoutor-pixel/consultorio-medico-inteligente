import { MercadoPagoClient } from './client';
import type { PaymentCreateRequest, PaymentResult, SplitCalculation } from './types';

// Fee rates per Estatuto 2026-2030
const FEE_RATES = {
  consultation: 0.07,  // 7% for consultations
  subscription: 0.07,  // 7% for subscriptions
  product: 0.05,       // 5% for marketplace products
} as const;

export function calculateSplit(amount: number, type: PaymentCreateRequest['type'], isSubscriber: boolean, npsBonus: number = 0): SplitCalculation {
  const feeRate = isSubscriber ? 0 : FEE_RATES[type];
  const platformFee = Number((amount * feeRate).toFixed(2));
  const doctorPayout = Number((amount - platformFee).toFixed(2));
  const netDoctorPayout = Number((doctorPayout + npsBonus).toFixed(2));

  return {
    grossAmount: amount,
    platformFeeRate: feeRate,
    platformFee,
    doctorPayout,
    npsBonus,
    netDoctorPayout,
  };
}

export async function processPixPayment(client: MercadoPagoClient, request: PaymentCreateRequest): Promise<PaymentResult> {
  const split = calculateSplit(request.amount, request.type, request.isSubscriber ?? false);

  const result = await client.createPixPayment({
    transaction_amount: request.amount,
    description: request.description,
    payment_method_id: 'pix',
    payer: {
      email: request.payerEmail,
      ...(request.payerCpf ? { identification: { type: 'CPF', number: request.payerCpf } } : {}),
    },
    external_reference: request.externalReference,
    application_fee: split.platformFee,
  });

  return {
    id: result.id,
    status: result.status,
    statusDetail: result.status_detail,
    qrCode: result.point_of_interaction?.qr_code?.in_store_order_id,
    qrCodeUrl: result.point_of_interaction?.qr_code?.qr_code_url,
    amount: request.amount,
    platformFee: split.platformFee,
    doctorPayout: split.doctorPayout,
  };
}

export async function processCheckoutPayment(
  client: MercadoPagoClient,
  request: PaymentCreateRequest,
  urls: { success: string; failure: string; pending: string; webhook: string }
): Promise<PaymentResult> {
  const split = calculateSplit(request.amount, request.type, request.isSubscriber ?? false);

  const result = await client.createPreference({
    items: [{ title: request.description, quantity: 1, unit_price: request.amount }],
    payer: { email: request.payerEmail },
    external_reference: request.externalReference,
    notification_url: urls.webhook,
    back_urls: { success: urls.success, failure: urls.failure, pending: urls.pending },
    auto_return: 'approved',
    application_fee: split.platformFee,
  });

  return {
    id: result.id,
    status: 'pending',
    statusDetail: 'pending_payment',
    paymentUrl: result.init_point,
    amount: request.amount,
    platformFee: split.platformFee,
    doctorPayout: split.doctorPayout,
  };
}
