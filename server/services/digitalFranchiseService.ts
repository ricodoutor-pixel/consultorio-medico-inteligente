/**
 * Estratégia 2: Franquia Digital de Médicos
 * Comissão escalonada baseada em volume de consultas
 */

export interface CommissionTier {
  level: number;
  name: string;
  minConsultations: number;
  maxConsultations: number;
  doctorShare: number;
  platformShare: number;
  bonus: string;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { level: 1, name: 'Iniciante', minConsultations: 0, maxConsultations: 50, doctorShare: 0.80, platformShare: 0.20, bonus: '' },
  { level: 2, name: 'Ativo', minConsultations: 51, maxConsultations: 200, doctorShare: 0.85, platformShare: 0.15, bonus: 'Badge Ativo' },
  { level: 3, name: 'Destaque', minConsultations: 201, maxConsultations: 500, doctorShare: 0.90, platformShare: 0.10, bonus: 'Destaque na busca' },
  { level: 4, name: 'Elite', minConsultations: 501, maxConsultations: Infinity, doctorShare: 0.92, platformShare: 0.08, bonus: 'Bônus 5% extra' },
];

export function getDoctorTier(monthlyConsultations: number): CommissionTier {
  return COMMISSION_TIERS.find(
    t => monthlyConsultations >= t.minConsultations && monthlyConsultations <= t.maxConsultations
  ) || COMMISSION_TIERS[0];
}

export function calculateFranchiseRevenue(amount: number, monthlyConsultations: number) {
  const tier = getDoctorTier(monthlyConsultations);
  const doctorEarnings = amount * tier.doctorShare;
  const platformFee = amount * tier.platformShare;
  return {
    tier,
    doctorEarnings: Math.round(doctorEarnings * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    totalAmount: amount,
  };
}

export function generateDoctorLandingSlug(doctorName: string, crm: string): string {
  const slug = doctorName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `dr-${slug}-${crm.toLowerCase()}`;
}

export interface DoctorLandingData {
  slug: string;
  doctorName: string;
  specialty: string;
  crm: string;
  bio: string;
  rating: number;
  totalConsultations: number;
  npsScore: number;
  tier: CommissionTier;
  referralCode: string;
}

export function buildDoctorLandingData(doctor: {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  bio: string;
  rating: number;
  totalConsultations: number;
  npsScore: number;
}): DoctorLandingData {
  const tier = getDoctorTier(doctor.totalConsultations);
  return {
    slug: generateDoctorLandingSlug(doctor.name, doctor.crm),
    doctorName: doctor.name,
    specialty: doctor.specialty,
    crm: doctor.crm,
    bio: doctor.bio,
    rating: doctor.rating,
    totalConsultations: doctor.totalConsultations,
    npsScore: doctor.npsScore,
    tier,
    referralCode: `REF-${doctor.id.substring(0, 8).toUpperCase()}`,
  };
}
