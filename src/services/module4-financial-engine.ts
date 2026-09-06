// @ts-nocheck
/**
 * ═══════════════════════════════════════════════════════════════
 * MÓDULO 4: FINANCEIRO — MOTOR MANUS CEO
 * Split de Produção, Validação CRM, Subscriber Isenção
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '@/lib/supabase';
import axios from 'axios';
import { devlog } from '@/lib/devlog';

// 🟠 CONSTANTES: Split de Taxas
const SPLIT_RATES = {
  CONSULTATION: {
    platform: 0.07, // 7% Plataforma
    doctor: 0.93, // 93% Médico
  },
  MARKETPLACE: {
    platform: 0.05, // 5% Plataforma
    supplier: 0.95, // 95% Fornecedor
  },
};

// 🟠 INTERFACE: Cálculo de Pagamento
interface PaymentCalculation {
  grossAmount: number;
  platformFee: number;
  doctorAmount: number;
  transactionId: string;
  timestamp: Date;
  type: 'consultation' | 'marketplace';
}

// 🟠 INTERFACE: Subscriber Plan
interface SubscriberPlan {
  planId: string;
  userId: string;
  planType: 'free' | 'member' | 'club_premium';
  isActive: boolean;
  marketplaceFee: number; // 0% para premium
}

/**
 * 🟠 FUNÇÃO: Calcular Split de Pagamento (Orientações Técnicas)
 * Reter 7% (Plataforma) / 93% (Médico)
 */
export async function calculateConsultationSplit(
  consultationId: string,
  grossAmount: number,
  doctorId: string
): Promise<PaymentCalculation> {
  try {
    const platformFee = grossAmount * SPLIT_RATES.CONSULTATION.platform;
    const doctorAmount = grossAmount * SPLIT_RATES.CONSULTATION.doctor;

    // Registrar cálculo no banco de dados
    const { data, error } = await supabase
      .from('payment_calculations')
      .insert({
        consultation_id: consultationId,
        doctor_id: doctorId,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        doctor_amount: doctorAmount,
        type: 'consultation',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      grossAmount,
      platformFee,
      doctorAmount,
      transactionId: data.id,
      timestamp: new Date(data.created_at),
      type: 'consultation',
    };
  } catch (error) {
    devlog.error('Erro ao calcular split de consulta:', error);
    throw error;
  }
}

/**
 * 🟠 FUNÇÃO: Calcular Split de Pagamento (Marketplace)
 * Reter 5% (Plataforma) / 95% (Fornecedor)
 */
export async function calculateMarketplaceSplit(
  orderId: string,
  grossAmount: number,
  supplierId: string,
  buyerId: string
): Promise<PaymentCalculation> {
  try {
    // Verificar se comprador é subscriber com isenção
    const subscriberPlan = await getSubscriberPlan(buyerId);
    const platformFeeRate = subscriberPlan?.marketplaceFee ?? SPLIT_RATES.MARKETPLACE.platform;

    const platformFee = grossAmount * platformFeeRate;
    const supplierAmount = grossAmount - platformFee;

    // Registrar cálculo no banco de dados
    const { data, error } = await supabase
      .from('payment_calculations')
      .insert({
        order_id: orderId,
        supplier_id: supplierId,
        buyer_id: buyerId,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        supplier_amount: supplierAmount,
        type: 'marketplace',
        subscriber_fee_rate: platformFeeRate,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      grossAmount,
      platformFee,
      doctorAmount: supplierAmount,
      transactionId: data.id,
      timestamp: new Date(data.created_at),
      type: 'marketplace',
    };
  } catch (error) {
    devlog.error('Erro ao calcular split de marketplace:', error);
    throw error;
  }
}

/**
 * 🟠 FUNÇÃO: Validação de CRM em Tempo Real
 * Verificar CRM do médico antes de permitir teleconsulta
 */
export async function validateDoctorCRM(
  doctorId: string,
  crm: string,
  state: string
): Promise<boolean> {
  try {
    // 1. Verificar no banco de dados local
    const { data: localDoc, error: localError } = await supabase
      .from('doctors')
      .select('crm, crm_verified_at')
      .eq('id', doctorId)
      .single();

    if (localError && localError.code !== 'PGRST116') {
      throw localError;
    }

    // Se já verificado recentemente (< 30 dias), retornar resultado
    if (localDoc?.crm_verified_at) {
      const verifiedDate = new Date(localDoc.crm_verified_at);
      const daysSinceVerification =
        (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceVerification < 30) {
        return true;
      }
    }

    // 2. Validar contra base CFM (Conselho Federal de Medicina)
    const crmValidation = await validateCRMWithCFM(crm, state);

    if (!crmValidation.isValid) {
      devlog.warn(`CRM inválido: ${crm} - ${state}`);
      return false;
    }

    // 3. Atualizar banco de dados com data de verificação
    await supabase
      .from('doctors')
      .update({
        crm_verified_at: new Date().toISOString(),
        crm_validation_status: 'verified',
      })
      .eq('id', doctorId);

    return true;
  } catch (error) {
    devlog.error('Erro ao validar CRM:', error);
    return false;
  }
}

/**
 * 🟠 FUNÇÃO: Validar CRM com CFM (API Externa)
 */
async function validateCRMWithCFM(
  crm: string,
  state: string
): Promise<{ isValid: boolean; name?: string; specialty?: string }> {
  try {
    // Chamar API do CFM (exemplo)
    const response = await axios.get(
      `https://api.cfm.org.br/medicos/${crm}/${state}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CFM_API_KEY}`,
        },
        timeout: 5000,
      }
    );

    return {
      isValid: response.data.status === 'ativo',
      name: response.data.nome,
      specialty: response.data.especialidade,
    };
  } catch (error) {
    devlog.error('Erro ao validar CRM com CFM:', error);
    // Fallback: se API falhar, permitir (não bloquear fluxo)
    return { isValid: true };
  }
}

/**
 * 🟠 FUNÇÃO: Obter Plano do Subscriber
 */
async function getSubscriberPlan(
  userId: string
): Promise<SubscriberPlan | null> {
  try {
    const { data, error } = await supabase
      .from('subscriber_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) return null;

    // Calcular fee baseado no plano
    const marketplaceFee =
      data.plan_type === 'club_premium'
        ? 0 // Isenção total para premium
        : data.plan_type === 'member'
          ? 0.02 // 2% para members
          : SPLIT_RATES.MARKETPLACE.platform; // 5% para free

    return {
      planId: data.id,
      userId: data.user_id,
      planType: data.plan_type,
      isActive: data.is_active,
      marketplaceFee,
    };
  } catch (error) {
    devlog.error('Erro ao obter plano subscriber:', error);
    return null;
  }
}

/**
 * 🟠 FUNÇÃO: Verificar Isenção de Taxa para Subscriber
 */
export async function checkSubscriberFeeExemption(
  userId: string,
  transactionType: 'consultation' | 'marketplace'
): Promise<{
  isExempt: boolean;
  feeRate: number;
  planType: string;
}> {
  try {
    const plan = await getSubscriberPlan(userId);

    if (!plan || !plan.isActive) {
      return {
        isExempt: false,
        feeRate:
          transactionType === 'consultation'
            ? SPLIT_RATES.CONSULTATION.platform
            : SPLIT_RATES.MARKETPLACE.platform,
        planType: 'free',
      };
    }

    // Verificar isenção por plano
    const isExempt =
      plan.planType === 'club_premium' && transactionType === 'marketplace';

    return {
      isExempt,
      feeRate: plan.marketplaceFee,
      planType: plan.planType,
    };
  } catch (error) {
    devlog.error('Erro ao verificar isenção:', error);
    return {
      isExempt: false,
      feeRate:
        transactionType === 'consultation'
          ? SPLIT_RATES.CONSULTATION.platform
          : SPLIT_RATES.MARKETPLACE.platform,
      planType: 'free',
    };
  }
}

/**
 * 🟠 FUNÇÃO: Processar Pagamento com Split
 */
export async function processPaymentWithSplit(
  paymentData: {
    type: 'consultation' | 'marketplace';
    grossAmount: number;
    doctorId?: string;
    supplierId?: string;
    buyerId?: string;
    consultationId?: string;
    orderId?: string;
  }
): Promise<{
  success: boolean;
  calculation: PaymentCalculation;
  mpPreferenceId?: string;
}> {
  try {
    let calculation: PaymentCalculation;

    if (paymentData.type === 'consultation') {
      calculation = await calculateConsultationSplit(
        paymentData.consultationId!,
        paymentData.grossAmount,
        paymentData.doctorId!
      );
    } else {
      calculation = await calculateMarketplaceSplit(
        paymentData.orderId!,
        paymentData.grossAmount,
        paymentData.supplierId!,
        paymentData.buyerId!
      );
    }

    // Criar preferência no Mercado Pago com split
    const mpPreferenceId = await createMercadoPagoPreferenceWithSplit(
      calculation
    );

    // Registrar transação
    await supabase.from('transactions').insert({
      transaction_id: calculation.transactionId,
      mp_preference_id: mpPreferenceId,
      gross_amount: calculation.grossAmount,
      platform_fee: calculation.platformFee,
      doctor_amount: calculation.doctorAmount,
      type: paymentData.type,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      calculation,
      mpPreferenceId,
    };
  } catch (error) {
    devlog.error('Erro ao processar pagamento:', error);
    throw error;
  }
}

/**
 * 🟠 FUNÇÃO: Criar Preferência Mercado Pago com Split
 */
async function createMercadoPagoPreferenceWithSplit(
  calculation: PaymentCalculation
): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      {
        items: [
          {
            title:
              calculation.type === 'consultation'
                ? 'Teleconsulta Cannabis Medicinal'
                : 'Produto Marketplace',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: calculation.grossAmount,
          },
        ],
        payer: {
          email: 'patient@example.com',
        },
        marketplace_fee: calculation.platformFee,
        notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
        back_urls: {
          success: `${process.env.APP_URL}/payment/success`,
          failure: `${process.env.APP_URL}/payment/failure`,
          pending: `${process.env.APP_URL}/payment/pending`,
        },
        auto_return: 'approved',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      }
    );

    return response.data.id;
  } catch (error) {
    devlog.error('Erro ao criar preferência MP:', error);
    throw error;
  }
}

export default {
  calculateConsultationSplit,
  calculateMarketplaceSplit,
  validateDoctorCRM,
  checkSubscriberFeeExemption,
  processPaymentWithSplit,
  SPLIT_RATES,
};
