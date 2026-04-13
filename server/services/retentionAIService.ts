/**
 * Estratégia 7: IA de Retenção
 * Detecção de risco de abandono e resgate automático
 */

export interface PatientRiskProfile {
  patientId: string;
  name: string;
  daysSinceLastPurchase: number;
  daysSinceLastConsultation: number;
  npsScore: number;
  subscriptionAge: number; // months
  totalConsultations: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: RetentionAction;
}

export type RetentionAction =
  | 'none'
  | 'email_reminder'
  | 'discount_coupon_10'
  | 'discount_coupon_20'
  | 'doctor_outreach'
  | 'vip_upgrade_offer'
  | 'phone_call';

export interface RetentionCoupon {
  code: string;
  discountPercent: number;
  expiresAt: Date;
  patientId: string;
  maxUses: number;
}

export function calculateAbandonmentRisk(params: {
  daysSinceLastPurchase: number;
  daysSinceLastConsultation: number;
  npsScore: number;
  subscriptionAgeMonths: number;
  totalConsultations: number;
}): number {
  const {
    daysSinceLastPurchase,
    daysSinceLastConsultation,
    npsScore,
    subscriptionAgeMonths,
    totalConsultations,
  } = params;

  // Inactivity factor (40%)
  const inactivityScore = Math.min(daysSinceLastPurchase / 60, 1) * 0.4;

  // NPS factor (30%) - low NPS = high risk
  const npsRisk = ((10 - (npsScore || 5)) / 10) * 0.3;

  // Consultation frequency (20%)
  const avgConsultPerMonth = totalConsultations / Math.max(subscriptionAgeMonths, 1);
  const frequencyRisk = Math.max(0, (1 - Math.min(avgConsultPerMonth / 2, 1))) * 0.2;

  // New subscriber risk (10%)
  const newSubRisk = (1 - Math.min(subscriptionAgeMonths / 6, 1)) * 0.1;

  return Math.min(inactivityScore + npsRisk + frequencyRisk + newSubRisk, 1);
}

export function classifyRisk(score: number): PatientRiskProfile['riskLevel'] {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

export function suggestRetentionAction(riskLevel: PatientRiskProfile['riskLevel'], npsScore: number): RetentionAction {
  switch (riskLevel) {
    case 'critical':
      return npsScore < 5 ? 'phone_call' : 'discount_coupon_20';
    case 'high':
      return 'discount_coupon_20';
    case 'medium':
      return npsScore >= 8 ? 'email_reminder' : 'discount_coupon_10';
    case 'low':
      return 'none';
  }
}

export function generateCouponCode(patientId: string): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VOLTA-${random}`;
}

export function buildRetentionCoupon(
  patientId: string,
  discountPercent: number,
  daysValid = 7
): RetentionCoupon {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);
  return {
    code: generateCouponCode(patientId),
    discountPercent,
    expiresAt,
    patientId,
    maxUses: 1,
  };
}

export function buildRetentionMessagePrompt(patient: { name: string; condition?: string; daysSinceLastPurchase: number; npsScore: number }): string {
  return `Gere uma mensagem empática e curta (máximo 160 caracteres) para resgatar o paciente ${patient.name} que não compra medicamento há ${patient.daysSinceLastPurchase} dias. Condição: ${patient.condition || 'não especificada'}. NPS: ${patient.npsScore}. Inclua CTA claro.`;
}
