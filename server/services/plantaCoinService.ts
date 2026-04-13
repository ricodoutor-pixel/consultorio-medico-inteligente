/**
 * Estratégia 4: Tokenização de Bônus (Planta-Coin)
 * Sistema de recompensas para lock-in de médicos
 */

export interface PlantaCoinTransaction {
  id: string;
  doctorId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: PlantaCoinReason;
  balanceBefore: number;
  balanceAfter: number;
  itemId?: string;
  createdAt: Date;
}

export type PlantaCoinReason =
  | 'nps_bonus'
  | 'referral'
  | 'achievement'
  | 'streak'
  | 'purchase_course'
  | 'purchase_anvisa'
  | 'purchase_marketing'
  | 'cash_out'
  | 'donation';

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  costCoins: number;
  type: 'course' | 'anvisa_fee' | 'marketing_boost' | 'cash_out' | 'premium_badge';
  cashValue?: number;
  icon: string;
}

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: 'course-advanced', name: 'Curso Cannabis Avançado', description: 'Certificação + 10% aumento de tarifa', costCoins: 500, type: 'course', icon: '📚' },
  { id: 'anvisa-renewal', name: 'Pagamento Anvisa', description: 'Renovação de licença', costCoins: 1000, type: 'anvisa_fee', icon: '📋' },
  { id: 'marketing-boost', name: 'Marketing Boost', description: '1000 leads qualificados', costCoins: 300, type: 'marketing_boost', icon: '📣' },
  { id: 'cash-100', name: 'Cash Out (100 coins)', description: 'R$ 80 em dinheiro (taxa 20%)', costCoins: 100, type: 'cash_out', cashValue: 80, icon: '💰' },
  { id: 'cash-500', name: 'Cash Out (500 coins)', description: 'R$ 425 em dinheiro (taxa 15%)', costCoins: 500, type: 'cash_out', cashValue: 425, icon: '💰' },
  { id: 'premium-badge', name: 'Premium Badge', description: 'Badge "Elite" no perfil por 30 dias', costCoins: 200, type: 'premium_badge', icon: '🏆' },
];

export function calculateNPSBonusCoins(npsScore: number): number {
  if (npsScore >= 95) return 100;
  if (npsScore >= 90) return 75;
  if (npsScore >= 85) return 50;
  if (npsScore >= 80) return 25;
  return 0;
}

export function calculateReferralCoins(referralCount: number): number {
  return referralCount * 50;
}

export function canPurchase(balance: number, itemId: string): { canBuy: boolean; item?: MarketplaceItem; deficit?: number } {
  const item = MARKETPLACE_ITEMS.find(i => i.id === itemId);
  if (!item) return { canBuy: false };
  if (balance >= item.costCoins) return { canBuy: true, item };
  return { canBuy: false, item, deficit: item.costCoins - balance };
}

export function calculateCashOutValue(coins: number): number {
  // 20% fee for < 500, 15% for >= 500
  const feeRate = coins >= 500 ? 0.15 : 0.20;
  return Math.round(coins * (1 - feeRate) * 100) / 100;
}

export function buildCoinTransaction(
  doctorId: string,
  amount: number,
  reason: PlantaCoinReason,
  currentBalance: number,
  itemId?: string
): Omit<PlantaCoinTransaction, 'id'> {
  const isDebit = ['purchase_course', 'purchase_anvisa', 'purchase_marketing', 'cash_out', 'donation'].includes(reason);
  return {
    doctorId,
    amount: isDebit ? -Math.abs(amount) : Math.abs(amount),
    type: isDebit ? 'debit' : 'credit',
    reason,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance + (isDebit ? -Math.abs(amount) : Math.abs(amount)),
    itemId,
    createdAt: new Date(),
  };
}
