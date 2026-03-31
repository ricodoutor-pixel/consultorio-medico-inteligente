/**
 * Affiliate Service
 * Handles referral codes, tracking, and commission calculations
 */

import {
  getOrCreateAffiliate,
  getAffiliateByReferralCode,
  getReferralsForUser,
  createReferral,
  createTransaction,
  createNotification,
  updateUserBalance,
  getUserBalance,
} from '../db';
import type { Referral } from '../../drizzle/schema';

/**
 * Get or create affiliate record for user
 */
export async function getAffiliateInfo(userId: number) {
  return await getOrCreateAffiliate(userId);
}

/**
 * Get referral code for user
 */
export async function getUserReferralCode(userId: number): Promise<string | undefined> {
  const affiliate = await getOrCreateAffiliate(userId);
  return affiliate?.referralCode;
}

/**
 * Track a new referral
 */
export async function trackNewReferral(
  referrerId: number,
  referredUserId: number,
  depositAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get referrer's affiliate info
    const referrerAffiliate = await getOrCreateAffiliate(referrerId);
    if (!referrerAffiliate) {
      return { success: false, error: 'Afiliado não encontrado' };
    }

    // ========================================================================
    // LÓGICA DE COMISSÕES MULTINÍVEL (DOSSIÊ 2026-2030)
    // Nível 1: 50% | Nível 2: 5% | Nível 3: 2%
    // Taxa de Administração: 5% (Retido sobre vendas de não-assinantes)
    // ========================================================================

    const ADMIN_FEE_RATE = 0.05;
    const adminFee = Math.floor(depositAmount * ADMIN_FEE_RATE);
    const netAmount = depositAmount - adminFee;

    const COMMISSION_RATES = [0.50, 0.05, 0.02]; // Nível 1, 2, 3
    let currentReferrerId: number | null = referrerId;
    let level = 0;

    while (currentReferrerId && level < COMMISSION_RATES.length) {
      const rate = COMMISSION_RATES[level];
      const commissionEarned = Math.floor(netAmount * rate);

      // Create referral record for this level
      const referral: Referral = {
        id: 0,
        referrerId: currentReferrerId,
        referredId: referredUserId,
        depositAmount,
        commissionEarned,
        status: 'completed',
        createdAt: new Date(),
      };
      await createReferral(referral);

      // Credit commission
      const balance = await getUserBalance(currentReferrerId);
      if (balance) {
        await updateUserBalance(currentReferrerId, {
          availableBalance: balance.availableBalance + commissionEarned,
          totalEarnings: balance.totalEarnings + commissionEarned,
        });
      }

      // Create transaction
      await createTransaction({
        userId: currentReferrerId,
        type: 'commission',
        amount: commissionEarned,
        status: 'completed',
        description: `Comissão Nível ${level + 1} por indicação`,
      });

      // Notify
      await createNotification({
        userId: currentReferrerId,
        type: 'commission',
        title: `Comissão Nível ${level + 1} Recebida`,
        message: `Você recebeu R$ ${(commissionEarned / 100).toFixed(2)} de comissão (Nível ${level + 1})`,
        read: 0,
      });

      // Move to next level referrer (upline)
      const currentAffiliate = await getOrCreateAffiliate(currentReferrerId);
      currentReferrerId = currentAffiliate?.uplineId || null;
      level++;
    }



    return { success: true };
  } catch (error) {
    console.error('[AffiliateService] Error tracking referral:', error);
    return { success: false, error: 'Erro ao registrar indicação' };
  }
}

/**
 * Get referrals for a user
 */
export async function getUserReferrals(userId: number): Promise<Referral[]> {
  return await getReferralsForUser(userId);
}

/**
 * Get affiliate statistics
 */
export async function getAffiliateStats(userId: number) {
  try {
    const affiliate = await getOrCreateAffiliate(userId);
    if (!affiliate) {
      return null;
    }

    const referrals = await getUserReferrals(userId);
    const totalCommissions = referrals.reduce((sum, ref) => sum + ref.commissionEarned, 0);

    return {
      referralCode: affiliate.referralCode,
      totalReferrals: referrals.length,
      totalCommissions,
      commissionRate: affiliate.commissionRate,
      referrals: referrals.map((ref) => ({
        id: ref.id,
        referredId: ref.referredId,
        depositAmount: ref.depositAmount,
        commissionEarned: ref.commissionEarned,
        status: ref.status,
        createdAt: ref.createdAt,
      })),
    };
  } catch (error) {
    console.error('[AffiliateService] Error getting affiliate stats:', error);
    return null;
  }
}

/**
 * Validate and get referrer from referral code
 */
export async function validateReferralCode(referralCode: string): Promise<number | null> {
  try {
    const affiliate = await getAffiliateByReferralCode(referralCode);
    if (!affiliate) {
      return null;
    }
    return affiliate.userId;
  } catch (error) {
    console.error('[AffiliateService] Error validating referral code:', error);
    return null;
  }
}

/**
 * Generate referral link
 */
export function generateReferralLink(referralCode: string, baseUrl: string = 'https://plantaeraiz.com'): string {
  return `${baseUrl}?ref=${referralCode}`;
}
