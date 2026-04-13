export interface PaymentCreateRequest {
  amount: number;
  description: string;
  payerEmail: string;
  payerCpf?: string;
  externalReference: string;
  type: 'consultation' | 'subscription' | 'product';
  doctorId?: string;
  isSubscriber?: boolean;
}

export interface PaymentResult {
  id: string;
  status: string;
  statusDetail: string;
  qrCode?: string;
  qrCodeUrl?: string;
  paymentUrl?: string;
  amount: number;
  platformFee: number;
  doctorPayout: number;
}

export interface SplitCalculation {
  grossAmount: number;
  platformFeeRate: number;
  platformFee: number;
  doctorPayout: number;
  npsBonus: number;
  netDoctorPayout: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  action: string;
  data: {
    id: string;
    [key: string]: any;
  };
}
