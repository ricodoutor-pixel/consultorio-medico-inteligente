/**
 * Estratégia 6: Assinatura de Bem-Estar
 * Planos recorrentes para pacientes (R$99 - R$199/mês)
 */

export interface WellnessPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  maxConsultations: number;
  productDiscount: number;
  priority: boolean;
}

export const WELLNESS_PLANS: WellnessPlan[] = [
  {
    id: 'basic',
    name: 'Bem-Estar Básico',
    price: 99,
    period: 'monthly',
    features: [
      'Suporte 24h com IA Brisa',
      'Renovação automática de receitas',
      '10% desconto em produtos',
      'Acesso à biblioteca científica',
    ],
    maxConsultations: 0,
    productDiscount: 0.10,
    priority: false,
  },
  {
    id: 'pro',
    name: 'Bem-Estar Pro',
    price: 149,
    period: 'monthly',
    features: [
      'Tudo do Básico',
      '1 consulta com médico/mês',
      '15% desconto em produtos',
      'Acesso a cursos gratuitos',
      'Smart-Refill automático',
    ],
    maxConsultations: 1,
    productDiscount: 0.15,
    priority: false,
  },
  {
    id: 'premium',
    name: 'Bem-Estar Premium',
    price: 199,
    period: 'monthly',
    features: [
      'Tudo do Pro',
      '2 consultas com médico/mês',
      '20% desconto em produtos',
      'Prioridade no atendimento',
      'Consultoria nutricional',
      'Rastreamento Anvisa automático',
    ],
    maxConsultations: 2,
    productDiscount: 0.20,
    priority: true,
  },
];

export function getPlan(planId: string): WellnessPlan | undefined {
  return WELLNESS_PLANS.find(p => p.id === planId);
}

export function calculateYearlyDiscount(plan: WellnessPlan): { yearlyPrice: number; savings: number } {
  const yearlyPrice = Math.round(plan.price * 10); // 2 months free
  const savings = plan.price * 12 - yearlyPrice;
  return { yearlyPrice, savings };
}

export function canAccessConsultation(
  planId: string,
  consultationsUsedThisMonth: number
): { allowed: boolean; remaining: number } {
  const plan = getPlan(planId);
  if (!plan) return { allowed: false, remaining: 0 };
  const remaining = plan.maxConsultations - consultationsUsedThisMonth;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export function applyProductDiscount(price: number, planId: string): { originalPrice: number; discountedPrice: number; discount: number } {
  const plan = getPlan(planId);
  if (!plan) return { originalPrice: price, discountedPrice: price, discount: 0 };
  const discount = Math.round(price * plan.productDiscount * 100) / 100;
  return {
    originalPrice: price,
    discountedPrice: Math.round((price - discount) * 100) / 100,
    discount,
  };
}

export function isSubscriptionDue(nextBillingDate: Date): boolean {
  return new Date() >= nextBillingDate;
}

export function getNextBillingDate(currentDate: Date, period: 'monthly' | 'yearly'): Date {
  const next = new Date(currentDate);
  if (period === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}
