/**
 * Estratégia 8: Selo Planta y Raiz de Qualidade
 * Certificação automática de médicos de alta performance
 */

export interface QualityCriteria {
  npsAverage: number;
  responseRate: number;
  avgResponseTimeMinutes: number;
  certificationsValid: boolean;
  complaintsCount: number;
  totalConsultations: number;
  memberSinceMonths: number;
}

export interface QualitySeal {
  doctorId: string;
  score: number;
  tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  awardedAt: Date;
  expiresAt: Date;
  benefits: string[];
  extraCommission: number;
}

export const SEAL_THRESHOLDS = {
  platinum: 9.5,
  gold: 8.5,
  silver: 7.5,
  bronze: 6.5,
};

export const SEAL_BENEFITS: Record<QualitySeal['tier'], string[]> = {
  none: [],
  bronze: ['Badge Bronze no perfil'],
  silver: ['Badge Prata no perfil', 'Destaque na busca'],
  gold: ['Badge Ouro no perfil', 'Destaque na busca', '+2% comissão', 'Suporte prioritário'],
  platinum: ['Badge Platina no perfil', 'Destaque na busca', '+3% comissão', 'Suporte prioritário', 'Convites exclusivos', 'VIP Lounge'],
};

export const SEAL_EXTRA_COMMISSION: Record<QualitySeal['tier'], number> = {
  none: 0,
  bronze: 0,
  silver: 0.01,
  gold: 0.02,
  platinum: 0.03,
};

export const SEAL_MIN_REQUIREMENTS: QualityCriteria = {
  npsAverage: 6.5,
  responseRate: 0.80,
  avgResponseTimeMinutes: 30,
  certificationsValid: true,
  complaintsCount: 3,
  totalConsultations: 50,
  memberSinceMonths: 2,
};

export function calculateQualityScore(criteria: QualityCriteria): number {
  const npsWeight = (criteria.npsAverage / 10) * 0.30;
  const responseRateWeight = criteria.responseRate * 0.20;
  const responseTimeWeight = (1 - Math.min(criteria.avgResponseTimeMinutes / 30, 1)) * 0.20;
  const certWeight = (criteria.certificationsValid ? 1 : 0) * 0.15;
  const complaintsWeight = (1 - Math.min(criteria.complaintsCount / 5, 1)) * 0.10;
  const experienceWeight = Math.min(criteria.totalConsultations / 200, 1) * 0.05;

  return Math.round((npsWeight + responseRateWeight + responseTimeWeight + certWeight + complaintsWeight + experienceWeight) * 100) / 10;
}

export function determineSealTier(score: number): QualitySeal['tier'] {
  if (score >= SEAL_THRESHOLDS.platinum) return 'platinum';
  if (score >= SEAL_THRESHOLDS.gold) return 'gold';
  if (score >= SEAL_THRESHOLDS.silver) return 'silver';
  if (score >= SEAL_THRESHOLDS.bronze) return 'bronze';
  return 'none';
}

export function meetsMinimumRequirements(criteria: QualityCriteria): { eligible: boolean; failedCriteria: string[] } {
  const failed: string[] = [];
  if (criteria.npsAverage < SEAL_MIN_REQUIREMENTS.npsAverage) failed.push('NPS insuficiente');
  if (criteria.responseRate < SEAL_MIN_REQUIREMENTS.responseRate) failed.push('Taxa de resposta baixa');
  if (criteria.avgResponseTimeMinutes > SEAL_MIN_REQUIREMENTS.avgResponseTimeMinutes) failed.push('Tempo de resposta alto');
  if (!criteria.certificationsValid) failed.push('Certificações inválidas');
  if (criteria.complaintsCount > SEAL_MIN_REQUIREMENTS.complaintsCount) failed.push('Muitas reclamações');
  if (criteria.totalConsultations < SEAL_MIN_REQUIREMENTS.totalConsultations) failed.push('Poucas consultas');
  if (criteria.memberSinceMonths < SEAL_MIN_REQUIREMENTS.memberSinceMonths) failed.push('Tempo insuficiente na plataforma');
  return { eligible: failed.length === 0, failedCriteria: failed };
}

export function buildQualitySeal(doctorId: string, criteria: QualityCriteria): QualitySeal {
  const score = calculateQualityScore(criteria);
  const tier = determineSealTier(score);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return {
    doctorId,
    score,
    tier,
    awardedAt: now,
    expiresAt,
    benefits: SEAL_BENEFITS[tier],
    extraCommission: SEAL_EXTRA_COMMISSION[tier],
  };
}
