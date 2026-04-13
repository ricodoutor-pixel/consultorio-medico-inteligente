/**
 * Router: Domination Strategies (10 estratégias do Plano de 90 Dias)
 * Integra todos os services de estratégia via tRPC
 */
import { protectedProcedure, router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { findBestDoctorMatch, findTopMatches } from '../services/instantMatchService';
import { calculateFranchiseRevenue, getDoctorTier, buildDoctorLandingData } from '../services/digitalFranchiseService';
import { WELLNESS_PLANS, getPlan, canAccessConsultation, applyProductDiscount } from '../services/wellnessSubscriptionService';
import { calculateAbandonmentRisk, classifyRisk, suggestRetentionAction, buildRetentionCoupon } from '../services/retentionAIService';
import { calculateQualityScore, determineSealTier, meetsMinimumRequirements, buildQualitySeal } from '../services/qualitySealService';
import { generateOpportunities, calculatePercentile, getRevenueProjection } from '../services/doctorBIService';
import { MARKETPLACE_ITEMS, canPurchase, calculateNPSBonusCoins, calculateCashOutValue } from '../services/plantaCoinService';
import { getKeywordsByPriority, CANNABIS_SEO_KEYWORDS } from '../services/seoContentService';
import { validateAnvisaForm, estimateApprovalDays, generateAnvisaProtocol, getStatusLabel } from '../services/anvisaAutomationService';

export const dominationRouter = router({
  // ─── Estratégia 1: Uber da Receita ───
  instantMatch: protectedProcedure
    .input(z.object({
      specialty: z.string().optional(),
      urgency: z.enum(['low', 'medium', 'high']).default('medium'),
    }))
    .query(async ({ input, ctx }) => {
      // In production, fetch real doctors from DB
      return { 
        success: true, 
        message: 'Matching engine ready',
        patientId: ctx.user?.id,
        specialty: input.specialty,
        urgency: input.urgency,
      };
    }),

  // ─── Estratégia 2: Franquia Digital ───
  getDoctorFranchiseInfo: protectedProcedure
    .input(z.object({ monthlyConsultations: z.number() }))
    .query(async ({ input }) => {
      const tier = getDoctorTier(input.monthlyConsultations);
      return { success: true, data: { tier, consultations: input.monthlyConsultations } };
    }),

  calculateFranchiseRevenue: publicProcedure
    .input(z.object({ amount: z.number().positive(), monthlyConsultations: z.number().min(0) }))
    .query(async ({ input }) => {
      const result = calculateFranchiseRevenue(input.amount, input.monthlyConsultations);
      return { success: true, data: result };
    }),

  // ─── Estratégia 4: Planta-Coin ───
  getMarketplaceItems: protectedProcedure
    .query(async () => {
      return { success: true, data: MARKETPLACE_ITEMS };
    }),

  checkPurchase: protectedProcedure
    .input(z.object({ balance: z.number(), itemId: z.string() }))
    .query(async ({ input }) => {
      const result = canPurchase(input.balance, input.itemId);
      return { success: true, data: result };
    }),

  calculateBonusCoins: protectedProcedure
    .input(z.object({ npsScore: z.number().min(0).max(100) }))
    .query(async ({ input }) => {
      const coins = calculateNPSBonusCoins(input.npsScore);
      return { success: true, data: { npsScore: input.npsScore, coinsEarned: coins } };
    }),

  getCashOutValue: protectedProcedure
    .input(z.object({ coins: z.number().positive() }))
    .query(async ({ input }) => {
      const value = calculateCashOutValue(input.coins);
      return { success: true, data: { coins: input.coins, cashValue: value } };
    }),

  // ─── Estratégia 5: SEO ───
  getSEOKeywords: protectedProcedure
    .input(z.object({ priority: z.number().min(1).max(3).default(1) }))
    .query(async ({ input }) => {
      const keywords = getKeywordsByPriority(input.priority);
      return { success: true, data: keywords, total: CANNABIS_SEO_KEYWORDS.length };
    }),

  // ─── Estratégia 6: Assinatura Bem-Estar ───
  getWellnessPlans: publicProcedure
    .query(async () => {
      return { success: true, data: WELLNESS_PLANS };
    }),

  checkConsultationAccess: protectedProcedure
    .input(z.object({ planId: z.string(), consultationsUsed: z.number() }))
    .query(async ({ input }) => {
      const result = canAccessConsultation(input.planId, input.consultationsUsed);
      return { success: true, data: result };
    }),

  applyDiscount: protectedProcedure
    .input(z.object({ price: z.number().positive(), planId: z.string() }))
    .query(async ({ input }) => {
      const result = applyProductDiscount(input.price, input.planId);
      return { success: true, data: result };
    }),

  // ─── Estratégia 7: IA de Retenção ───
  calculatePatientRisk: protectedProcedure
    .input(z.object({
      daysSinceLastPurchase: z.number(),
      daysSinceLastConsultation: z.number(),
      npsScore: z.number(),
      subscriptionAgeMonths: z.number(),
      totalConsultations: z.number(),
    }))
    .query(async ({ input }) => {
      const riskScore = calculateAbandonmentRisk(input);
      const riskLevel = classifyRisk(riskScore);
      const action = suggestRetentionAction(riskLevel, input.npsScore);
      return { success: true, data: { riskScore: Math.round(riskScore * 100) / 100, riskLevel, suggestedAction: action } };
    }),

  generateRetentionCoupon: protectedProcedure
    .input(z.object({ patientId: z.string(), discountPercent: z.number().min(5).max(50) }))
    .mutation(async ({ input }) => {
      const coupon = buildRetentionCoupon(input.patientId, input.discountPercent);
      return { success: true, data: coupon };
    }),

  // ─── Estratégia 8: Selo de Qualidade ───
  evaluateQuality: protectedProcedure
    .input(z.object({
      npsAverage: z.number(),
      responseRate: z.number(),
      avgResponseTimeMinutes: z.number(),
      certificationsValid: z.boolean(),
      complaintsCount: z.number(),
      totalConsultations: z.number(),
      memberSinceMonths: z.number(),
    }))
    .query(async ({ input }) => {
      const eligible = meetsMinimumRequirements(input);
      const score = calculateQualityScore(input);
      const tier = determineSealTier(score);
      return { success: true, data: { eligible, score, tier } };
    }),

  // ─── Estratégia 9: BI para Médicos ───
  getDoctorOpportunities: protectedProcedure
    .input(z.object({
      retentionRate: z.number().optional(),
      totalPatients: z.number().optional(),
      consultationsThisMonth: z.number().optional(),
      avgConsultationValue: z.number().optional(),
      npsScore: z.number().optional(),
      plantaCoinBalance: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const opportunities = generateOpportunities(input);
      return { success: true, data: opportunities };
    }),

  getRevenueProjection: protectedProcedure
    .input(z.object({ currentRevenue: z.number(), growthRate: z.number(), months: z.number().min(1).max(24) }))
    .query(async ({ input }) => {
      const projections = getRevenueProjection(input.currentRevenue, input.growthRate, input.months);
      return { success: true, data: projections };
    }),

  // ─── Estratégia 10: Automação Anvisa ───
  validateAnvisaForm: protectedProcedure
    .input(z.object({
      patientName: z.string(),
      patientCPF: z.string(),
      patientEmail: z.string().email(),
      patientPhone: z.string(),
      doctorName: z.string(),
      doctorCRM: z.string(),
      doctorCRMState: z.string(),
      doctorSpecialty: z.string(),
      medicalJustification: z.string(),
      treatmentDuration: z.string(),
      diagnosisCID: z.string().optional(),
      medicines: z.array(z.object({
        name: z.string(),
        activePrinciple: z.string(),
        concentration: z.string(),
        dosage: z.string(),
        quantity: z.number(),
        indication: z.string(),
        supplier: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const validation = validateAnvisaForm(input);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
      const protocol = generateAnvisaProtocol();
      const estimatedDays = estimateApprovalDays(input.medicines);
      return { success: true, data: { protocol, estimatedDays, status: 'preparing', statusLabel: getStatusLabel('preparing') } };
    }),

  getAnvisaStatusLabel: publicProcedure
    .input(z.object({ status: z.enum(['preparing', 'submitted', 'under_review', 'approved', 'rejected', 'expired']) }))
    .query(async ({ input }) => {
      return { success: true, data: { status: input.status, label: getStatusLabel(input.status) } };
    }),
});
