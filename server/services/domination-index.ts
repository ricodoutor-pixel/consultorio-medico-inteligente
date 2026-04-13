// Barrel export for all domination strategy services
export { findBestDoctorMatch, findTopMatches, scoreDoctorMatch } from './instantMatchService';
export { calculateFranchiseRevenue, getDoctorTier, buildDoctorLandingData, generateDoctorLandingSlug, COMMISSION_TIERS } from './digitalFranchiseService';
export { generatePharmacyCheckout, findBestPharmacy, PHARMACY_PARTNERS } from './pharmacyIntegrationService';
export { MARKETPLACE_ITEMS, canPurchase, calculateNPSBonusCoins, calculateCashOutValue, buildCoinTransaction } from './plantaCoinService';
export { CANNABIS_SEO_KEYWORDS, getKeywordsByPriority, getKeywordsByIntent, generateSlug, buildArticlePrompt, buildSchemaOrgArticle } from './seoContentService';
export { WELLNESS_PLANS, getPlan, canAccessConsultation, applyProductDiscount, calculateYearlyDiscount } from './wellnessSubscriptionService';
export { calculateAbandonmentRisk, classifyRisk, suggestRetentionAction, buildRetentionCoupon, buildRetentionMessagePrompt } from './retentionAIService';
export { calculateQualityScore, determineSealTier, meetsMinimumRequirements, buildQualitySeal, SEAL_BENEFITS } from './qualitySealService';
export { generateOpportunities, calculatePercentile, getRevenueProjection } from './doctorBIService';
export { validateAnvisaForm, estimateApprovalDays, generateAnvisaProtocol, buildSubmission, getStatusLabel } from './anvisaAutomationService';

// Types
export type { PatientRiskProfile, RetentionAction, RetentionCoupon } from './retentionAIService';
export type { QualitySeal, QualityCriteria } from './qualitySealService';
export type { DoctorBIMetrics, Opportunity } from './doctorBIService';
export type { WellnessPlan } from './wellnessSubscriptionService';
export type { PlantaCoinTransaction, MarketplaceItem } from './plantaCoinService';
export type { SEOKeyword, SEOArticle } from './seoContentService';
export type { AnvisaFormData, AnvisaSubmission } from './anvisaAutomationService';
export type { PharmacyPartner, PharmacyCheckout } from './pharmacyIntegrationService';
export type { CommissionTier, DoctorLandingData } from './digitalFranchiseService';
