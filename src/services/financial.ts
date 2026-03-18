/**
 * SISTEMA DE GESTÃO FINANCEIRA - PLANTA & RAIZ
 * 
 * Cálculo automático de:
 * - Comissões (3 níveis: 50%, 5%, 2%)
 * - Taxa de administração (5%)
 * - Taxa de saque (5%, com isenção para Clínica Família)
 * - Divisão de lucros
 */

// ============================================
// TIPOS E INTERFACES
// ============================================

export enum PlanType {
  USER = 'user',
  STORE_PRO = 'store_pro',
  DOCTOR_VIP = 'doctor_vip',
  ENTERPRISE = 'enterprise',
  CLINIC_FAMILY = 'clinic_family',
}

export interface SaaSPlan {
  id: string;
  name: string;
  type: PlanType;
  monthlyPrice: number;
  benefits: string[];
  commissionRate: number;
  adminFeeExempt: boolean;
  withdrawalFeeExempt: boolean;
}

export interface Commission {
  affiliateId: string;
  level: 1 | 2 | 3;
  transactionAmount: number;
  commissionAmount: number;
  percentage: number;
  status: 'pending' | 'approved' | 'paid';
}

export interface FinancialTransaction {
  transactionId: string;
  userId: string;
  type: 'subscription' | 'commission' | 'withdrawal' | 'refund';
  amount: number;
  adminFee: number;
  netAmount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

export interface WithdrawalRequest {
  withdrawalId: string;
  userId: string;
  amount: number;
  planType: PlanType;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
}

// ============================================
// PLANOS SAAS
// ============================================

export const SAAS_PLANS: Record<PlanType, SaaSPlan> = {
  [PlanType.USER]: {
    id: '1',
    name: 'Usuário',
    type: PlanType.USER,
    monthlyPrice: 29,
    benefits: [
      'Isenção de taxa no shopping',
      'Prioridade de triagem',
    ],
    commissionRate: 0,
    adminFeeExempt: true,
    withdrawalFeeExempt: false,
  },
  [PlanType.STORE_PRO]: {
    id: '2',
    name: 'Lojista Pro',
    type: PlanType.STORE_PRO,
    monthlyPrice: 49,
    benefits: [
      'Taxa de venda 0%',
      'Destaque nas recomendações',
      'Relatórios de vendas',
    ],
    commissionRate: 0,
    adminFeeExempt: true,
    withdrawalFeeExempt: false,
  },
  [PlanType.DOCTOR_VIP]: {
    id: '3',
    name: 'Médico VIP',
    type: PlanType.DOCTOR_VIP,
    monthlyPrice: 99,
    benefits: [
      '100% do valor da consulta',
      'Selo de verificação',
      'Acesso a pacientes prioritários',
      'Suporte dedicado',
    ],
    commissionRate: 0,
    adminFeeExempt: true,
    withdrawalFeeExempt: false,
  },
  [PlanType.ENTERPRISE]: {
    id: '4',
    name: 'Empresa/Parceiros',
    type: PlanType.ENTERPRISE,
    monthlyPrice: 149,
    benefits: [
      'Banners publicitários',
      'Relatórios de mercado',
      'API access',
      'Suporte prioritário',
    ],
    commissionRate: 0,
    adminFeeExempt: true,
    withdrawalFeeExempt: false,
  },
  [PlanType.CLINIC_FAMILY]: {
    id: '5',
    name: 'Clínica Família',
    type: PlanType.CLINIC_FAMILY,
    monthlyPrice: 195,
    benefits: [
      'Todos os benefícios',
      '5 perfis de usuário',
      'Isenção de taxa de saque',
      'Relatórios avançados',
      'Suporte 24/7',
    ],
    commissionRate: 0,
    adminFeeExempt: true,
    withdrawalFeeExempt: true,
  },
};

// ============================================
// CÁLCULO DE COMISSÕES (3 NÍVEIS)
// ============================================

const COMMISSION_RATES = {
  LEVEL_1: 0.50, // 50%
  LEVEL_2: 0.05, // 5%
  LEVEL_3: 0.02, // 2%
};

export function calculateCommissions(
  transactionAmount: number,
  affiliateLevel1Id: string,
  affiliateLevel2Id?: string,
  affiliateLevel3Id?: string
): Commission[] {
  const commissions: Commission[] = [];

  // Nível 1: 50%
  commissions.push({
    affiliateId: affiliateLevel1Id,
    level: 1,
    transactionAmount,
    commissionAmount: transactionAmount * COMMISSION_RATES.LEVEL_1,
    percentage: COMMISSION_RATES.LEVEL_1 * 100,
    status: 'pending',
  });

  // Nível 2: 5%
  if (affiliateLevel2Id) {
    commissions.push({
      affiliateId: affiliateLevel2Id,
      level: 2,
      transactionAmount,
      commissionAmount: transactionAmount * COMMISSION_RATES.LEVEL_2,
      percentage: COMMISSION_RATES.LEVEL_2 * 100,
      status: 'pending',
    });
  }

  // Nível 3: 2%
  if (affiliateLevel3Id) {
    commissions.push({
      affiliateId: affiliateLevel3Id,
      level: 3,
      transactionAmount,
      commissionAmount: transactionAmount * COMMISSION_RATES.LEVEL_3,
      percentage: COMMISSION_RATES.LEVEL_3 * 100,
      status: 'pending',
    });
  }

  return commissions;
}

// ============================================
// CÁLCULO DE TAXAS
// ============================================

const ADMIN_FEE_RATE = 0.05; // 5%
const WITHDRAWAL_FEE_RATE = 0.05; // 5%

export function calculateAdminFee(
  amount: number,
  planType: PlanType
): number {
  const plan = SAAS_PLANS[planType];
  if (plan.adminFeeExempt) {
    return 0;
  }
  return amount * ADMIN_FEE_RATE;
}

export function calculateWithdrawalFee(
  amount: number,
  planType: PlanType
): number {
  const plan = SAAS_PLANS[planType];
  if (plan.withdrawalFeeExempt) {
    return 0;
  }
  return amount * WITHDRAWAL_FEE_RATE;
}

export function calculateNetAmount(
  grossAmount: number,
  adminFee: number
): number {
  return grossAmount - adminFee;
}

// ============================================
// PROCESSAMENTO DE TRANSAÇÕES
// ============================================

export function createTransaction(
  userId: string,
  type: 'subscription' | 'commission' | 'withdrawal' | 'refund',
  amount: number,
  planType: PlanType
): FinancialTransaction {
  const adminFee = calculateAdminFee(amount, planType);
  const netAmount = calculateNetAmount(amount, adminFee);

  return {
    transactionId: `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    amount,
    adminFee,
    netAmount,
    status: 'pending',
    timestamp: new Date(),
  };
}

// ============================================
// PROCESSAMENTO DE SAQUES
// ============================================

export function createWithdrawalRequest(
  userId: string,
  amount: number,
  planType: PlanType
): WithdrawalRequest {
  const withdrawalFee = calculateWithdrawalFee(amount, planType);
  const netAmount = amount - withdrawalFee;

  return {
    withdrawalId: `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    amount: netAmount, // Valor líquido após taxa
    planType,
    status: 'pending',
    requestDate: new Date(),
  };
}

// ============================================
// RELATÓRIOS FINANCEIROS
// ============================================

export interface FinancialReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  totalCommissions: number;
  totalAdminFees: number;
  totalWithdrawalFees: number;
  netProfit: number;
  transactionCount: number;
  affiliateStats: {
    totalAffiliates: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
  };
  topAffiliates: Array<{
    affiliateId: string;
    totalEarned: number;
    level: number;
  }>;
}

export function generateFinancialReport(
  transactions: FinancialTransaction[],
  commissions: Commission[],
  withdrawals: WithdrawalRequest[]
): FinancialReport {
  const totalRevenue = transactions
    .filter(t => t.type === 'subscription')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCommissions = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const totalAdminFees = transactions
    .reduce((sum, t) => sum + t.adminFee, 0);

  const totalWithdrawalFees = withdrawals
    .filter(w => w.status === 'paid')
    .reduce((sum, w) => sum + (w.amount * WITHDRAWAL_FEE_RATE), 0);

  const netProfit = totalRevenue - totalCommissions - totalAdminFees - totalWithdrawalFees;

  return {
    period: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    totalRevenue,
    totalCommissions,
    totalAdminFees,
    totalWithdrawalFees,
    netProfit,
    transactionCount: transactions.length,
    affiliateStats: {
      totalAffiliates: new Set(commissions.map(c => c.affiliateId)).size,
      level1Count: commissions.filter(c => c.level === 1).length,
      level2Count: commissions.filter(c => c.level === 2).length,
      level3Count: commissions.filter(c => c.level === 3).length,
    },
    topAffiliates: [],
  };
}

// ============================================
// VALIDAÇÕES
// ============================================

export function validateWithdrawalAmount(
  amount: number,
  availableBalance: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Valor deve ser maior que zero' };
  }

  if (amount > availableBalance) {
    return { valid: false, error: 'Saldo insuficiente' };
  }

  if (amount < 10) {
    return { valid: false, error: 'Valor mínimo é R$ 10' };
  }

  return { valid: true };
}

export function validateCommissionData(
  transactionAmount: number,
  affiliateLevel1Id: string
): { valid: boolean; error?: string } {
  if (!transactionAmount || transactionAmount <= 0) {
    return { valid: false, error: 'Valor de transação inválido' };
  }

  if (!affiliateLevel1Id) {
    return { valid: false, error: 'Afiliado de nível 1 é obrigatório' };
  }

  return { valid: true };
}
