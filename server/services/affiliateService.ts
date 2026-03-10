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

    // Calculate commission (10% default)
    const commissionRate = referrerAffiliate.commissionRate / 100;
    const commissionEarned = Math.floor(depositAmount * commissionRate);

    // Create referral record
    const referral: Referral = {
      id: 0, // Will be auto-generated
      referrerId,
      referredId: referredUserId,
      depositAmount,
      commissionEarned,
      status: 'completed',
      createdAt: new Date(),
    };

    await createReferral(referral);

    // Credit commission to referrer
    const referrerBalance = await getUserBalance(referrerId);
    if (referrerBalance) {
      await updateUserBalance(referrerId, {
        availableBalance: referrerBalance.availableBalance + commissionEarned,
        totalEarnings: referrerBalance.totalEarnings + commissionEarned,
      });
    }

    // Create transaction for commission
    await createTransaction({
      userId: referrerId,
      type: 'commission',
      amount: commissionEarned,
      status: 'completed',
      description: `Comissão por indicação de novo usuário`,
    });

    // Create notification
    await createNotification({
      userId: referrerId,
      type: 'commission',
      title: 'Comissão Recebida',
      message: `Você recebeu R$ ${(commissionEarned / 100).toFixed(2)} de comissão por indicação`,
      read: 0,
    });

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
