/**
 * Client-side domination services (mirror of server logic for UI consumption)
 */

// ===== Digital Franchise =====
export interface CommissionTier {
  level: number;
  name: string;
  minOrientação Técnications: number;
  maxOrientação Técnications: number;
  doctorShare: number;
  platformShare: number;
  bonus: string;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { level: 1, name: 'Iniciante', minOrientação Técnications: 0, maxOrientação Técnications: 50, doctorShare: 0.80, platformShare: 0.20, bonus: '' },
  { level: 2, name: 'Ativo', minOrientação Técnications: 51, maxOrientação Técnications: 200, doctorShare: 0.85, platformShare: 0.15, bonus: 'Badge Ativo' },
  { level: 3, name: 'Destaque', minOrientação Técnications: 201, maxOrientação Técnications: 500, doctorShare: 0.90, platformShare: 0.10, bonus: 'Destaque na busca' },
  { level: 4, name: 'Elite', minOrientação Técnications: 501, maxOrientação Técnications: Infinity, doctorShare: 0.92, platformShare: 0.08, bonus: 'Bônus 5% extra' },
];

export function getDoctorTier(monthlyOrientação Técnications: number): CommissionTier {
  return COMMISSION_TIERS.find(
    t => monthlyOrientação Técnications >= t.minOrientação Técnications && monthlyOrientação Técnications <= t.maxOrientação Técnications
  ) || COMMISSION_TIERS[0];
}

export function calculateFranchiseRevenue(amount: number, monthlyOrientação Técnications: number) {
  const tier = getDoctorTier(monthlyOrientação Técnications);
  return {
    tier,
    doctorEarnings: Math.round(amount * tier.doctorShare * 100) / 100,
    platformFee: Math.round(amount * tier.platformShare * 100) / 100,
    totalAmount: amount,
  };
}

// ===== Planta-Coin =====
export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  costCoins: number;
  type: string;
  cashValue?: number;
  icon: string;
}

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: 'course-advanced', name: 'Curso Cannabis Avançado', description: 'Certificação + 10% aumento de tarifa', costCoins: 500, type: 'course', icon: '📚' },
  { id: 'anvisa-renewal', name: 'Pagamento Anvisa', description: 'Renovação de licença', costCoins: 1000, type: 'anvisa_fee', icon: '📋' },
  { id: 'marketing-boost', name: 'Marketing Boost', description: '1000 leads qualificados', costCoins: 300, type: 'marketing_boost', icon: '📣' },
  { id: 'cash-100', name: 'Cash Out (100)', description: 'R$ 80 em dinheiro', costCoins: 100, type: 'cash_out', cashValue: 80, icon: '💰' },
  { id: 'cash-500', name: 'Cash Out (500)', description: 'R$ 425 em dinheiro', costCoins: 500, type: 'cash_out', cashValue: 425, icon: '💰' },
  { id: 'premium-badge', name: 'Premium Badge', description: 'Badge "Elite" por 30 dias', costCoins: 200, type: 'premium_badge', icon: '🏆' },
];

export function calculateNPSBonusCoins(npsScore: number): number {
  if (npsScore >= 95) return 100;
  if (npsScore >= 90) return 75;
  if (npsScore >= 85) return 50;
  if (npsScore >= 80) return 25;
  return 0;
}

// ===== Quality Seal =====
export interface QualityCriteria {
  npsAverage: number;
  responseRate: number;
  avgResponseTimeMinutes: number;
  certificationsValid: boolean;
  complaintsCount: number;
  totalOrientação Técnications: number;
  memberSinceMonths: number;
}

export const SEAL_THRESHOLDS = { platinum: 9.5, gold: 8.5, silver: 7.5, bronze: 6.5 };

export type SealTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export function calculateQualityScore(criteria: QualityCriteria): number {
  const npsWeight = (criteria.npsAverage / 10) * 0.30;
  const responseRateWeight = criteria.responseRate * 0.20;
  const responseTimeWeight = (1 - Math.min(criteria.avgResponseTimeMinutes / 30, 1)) * 0.20;
  const certWeight = (criteria.certificationsValid ? 1 : 0) * 0.15;
  const complaintsWeight = (1 - Math.min(criteria.complaintsCount / 5, 1)) * 0.10;
  const experienceWeight = Math.min(criteria.totalOrientação Técnications / 200, 1) * 0.05;
  return Math.round((npsWeight + responseRateWeight + responseTimeWeight + certWeight + complaintsWeight + experienceWeight) * 100) / 10;
}

export function determineSealTier(score: number): SealTier {
  if (score >= SEAL_THRESHOLDS.platinum) return 'platinum';
  if (score >= SEAL_THRESHOLDS.gold) return 'gold';
  if (score >= SEAL_THRESHOLDS.silver) return 'silver';
  if (score >= SEAL_THRESHOLDS.bronze) return 'bronze';
  return 'none';
}

// ===== Doctor BI =====
export interface Opportunity {
  icon: string;
  title: string;
  description: string;
  potentialRevenue?: number;
  action: string;
}

export interface DoctorBIMetrics {
  monthlyRevenue: number;
  revenueGrowth: number;
  avgOrientação TécnicationValue: number;
  orientação técnicationsThisMonth: number;
  bonusAccumulated: number;
  plantaCoinBalance: number;
  newPatients: number;
  retentionRate: number;
  totalPatients: number;
  npsScore: number;
  responseRate: number;
  avgResponseTime: number;
  rank: number;
  totalDoctors: number;
  percentile: number;
  opportunities: Opportunity[];
  revenueHistory: { month: string; value: number }[];
  orientação técnicationHistory: { month: string; count: number }[];
}

export function generateOpportunities(metrics: Partial<DoctorBIMetrics>): Opportunity[] {
  const opportunities: Opportunity[] = [];
  if ((metrics.retentionRate ?? 100) < 85) {
    opportunities.push({
      icon: '⚠️', title: 'Pacientes em risco',
      description: `${Math.round((100 - (metrics.retentionRate ?? 100)) / 100 * (metrics.totalPatients ?? 0))} pacientes podem abandonar`,
      potentialRevenue: Math.round((100 - (metrics.retentionRate ?? 100)) / 100 * (metrics.totalPatients ?? 0) * 150),
      action: 'Ativar retenção',
    });
  }
  if ((metrics.orientação técnicationsThisMonth ?? 0) < 50) {
    opportunities.push({
      icon: '📈', title: 'Aumente suas orientação técnicas',
      description: 'Compartilhe sua página personalizada',
      potentialRevenue: (50 - (metrics.orientação técnicationsThisMonth ?? 0)) * (metrics.avgOrientação TécnicationValue ?? 150),
      action: 'Compartilhar',
    });
  }
  if ((metrics.npsScore ?? 0) >= 8.5 && (metrics.orientação técnicationsThisMonth ?? 0) >= 100) {
    opportunities.push({ icon: '🏆', title: 'Elegível para Selo de Qualidade', description: 'Você atende os critérios', action: 'Solicitar selo' });
  }
  if ((metrics.plantaCoinBalance ?? 0) >= 500) {
    opportunities.push({ icon: '🪙', title: 'Planta-Coins disponíveis', description: `${metrics.plantaCoinBalance} coins. Troque por cursos!`, action: 'Ver marketplace' });
  }
  return opportunities;
}

export function calculatePercentile(rank: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((total - rank) / total) * 100);
}

export function getRevenueProjection(currentRevenue: number, growthRate: number, months: number): number[] {
  const projections: number[] = [];
  let revenue = currentRevenue;
  for (let i = 0; i < months; i++) {
    revenue *= (1 + growthRate / 100);
    projections.push(Math.round(revenue));
  }
  return projections;
}

// ===== Wellness Subscription =====
export interface WellnessPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  maxOrientação Técnications: number;
  productDiscount: number;
  priority: boolean;
}

export const WELLNESS_PLANS: WellnessPlan[] = [
  {
    id: 'basic', name: 'Bem-Estar Básico', price: 99, period: 'monthly',
    features: ['Suporte 24h com IA Brisa', 'Renovação automática de receitas', '10% desconto em produtos', 'Acesso à biblioteca científica'],
    maxOrientação Técnications: 0, productDiscount: 0.10, priority: false,
  },
  {
    id: 'pro', name: 'Bem-Estar Pro', price: 149, period: 'monthly',
    features: ['Tudo do Básico', '1 orientação técnica com médico/mês', '15% desconto em produtos', 'Acesso a cursos gratuitos', 'Smart-Refill automático'],
    maxOrientação Técnications: 1, productDiscount: 0.15, priority: false,
  },
  {
    id: 'premium', name: 'Bem-Estar Premium', price: 199, period: 'monthly',
    features: ['Tudo do Pro', '2 orientação técnicas com médico/mês', '20% desconto em produtos', 'Prioridade no atendimento', 'Consultoria nutricional', 'Rastreamento Anvisa automático'],
    maxOrientação Técnications: 2, productDiscount: 0.20, priority: true,
  },
];

// ===== Retention AI =====
export function calculateAbandonmentRisk(params: {
  daysSinceLastPurchase: number;
  daysSinceLastOrientação Técnication: number;
  npsScore: number;
  subscriptionAgeMonths: number;
  totalOrientação Técnications: number;
}): number {
  const { daysSinceLastPurchase, npsScore, subscriptionAgeMonths, totalOrientação Técnications } = params;
  const inactivityScore = Math.min(daysSinceLastPurchase / 60, 1) * 0.4;
  const npsRisk = ((10 - (npsScore || 5)) / 10) * 0.3;
  const avgConsultPerMonth = totalOrientação Técnications / Math.max(subscriptionAgeMonths, 1);
  const frequencyRisk = Math.max(0, (1 - Math.min(avgConsultPerMonth / 2, 1))) * 0.2;
  const newSubRisk = (1 - Math.min(subscriptionAgeMonths / 6, 1)) * 0.1;
  return Math.min(inactivityScore + npsRisk + frequencyRisk + newSubRisk, 1);
}

export function calculateCashOutValue(coins: number): number {
  const feeRate = coins >= 500 ? 0.15 : 0.20;
  return Math.round(coins * (1 - feeRate) * 100) / 100;
}

export function classifyRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}
