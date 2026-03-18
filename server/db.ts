import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { InsertUserBalance, InsertInvestment, InsertTransaction, InsertReferral, InsertWithdrawalRequest, InsertNotification } from "../drizzle/schema";
import { userBalances, investments, transactions, affiliates, referrals, withdrawalRequests, notifications, platformSettings, investmentPlans } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Investment Plans
 */
export async function getInvestmentPlans() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(investmentPlans).orderBy(investmentPlans.minAmount);
}

export async function getInvestmentPlanById(planId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(investmentPlans).where(eq(investmentPlans.id, planId)).limit(1);
  return result[0];
}

/**
 * User Balances
 */
export async function getUserBalance(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userBalances).where(eq(userBalances.userId, userId)).limit(1);
  return result[0];
}

export async function createUserBalance(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(userBalances).values({
    userId,
    availableBalance: 0,
    investedAmount: 0,
    totalEarnings: 0,
  });
  return getUserBalance(userId);
}

export async function updateUserBalance(userId: number, updates: Partial<InsertUserBalance>) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(userBalances).set(updates).where(eq(userBalances.userId, userId));
  return getUserBalance(userId);
}

/**
 * Investments
 */
export async function getUserInvestments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(investments).where(eq(investments.userId, userId)).orderBy(investments.createdAt);
}

export async function createInvestment(investment: InsertInvestment) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(investments).values(investment);
  return result;
}

/**
 * Transactions
 */
export async function getUserTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(transactions.createdAt);
}

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(transactions).values(transaction);
  return result;
}

export async function getTransactionByMercadoPagoId(mercadoPagoId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(transactions).where(eq(transactions.mercadoPagoId, mercadoPagoId)).limit(1);
  return result[0];
}

export async function updateTransaction(id: number, updates: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(transactions).set(updates).where(eq(transactions.id, id));
}

/**
 * Affiliates
 */
export async function getOrCreateAffiliate(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  let affiliate = await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1);
  
  if (affiliate.length === 0) {
    const referralCode = generateReferralCode();
    await db.insert(affiliates).values({
      userId,
      referralCode,
      totalReferrals: 0,
      totalCommissions: 0,
      commissionRate: 10,
    });
    affiliate = await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1);
  }
  
  return affiliate[0];
}

export async function getAffiliateByReferralCode(referralCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(affiliates).where(eq(affiliates.referralCode, referralCode)).limit(1);
  return result[0];
}

/**
 * Referrals
 */
export async function createReferral(referral: InsertReferral) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(referrals).values(referral);
}

export async function getReferralsForUser(referrerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(referrals).where(eq(referrals.referrerId, referrerId)).orderBy(referrals.createdAt);
}

/**
 * Withdrawal Requests
 */
export async function createWithdrawalRequest(request: InsertWithdrawalRequest) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(withdrawalRequests).values(request);
}

export async function getUserWithdrawalRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId)).orderBy(withdrawalRequests.createdAt);
}

export async function getPendingWithdrawalRequests() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.status, "pending")).orderBy(withdrawalRequests.createdAt);
}

export async function updateWithdrawalRequest(id: number, updates: Partial<InsertWithdrawalRequest>) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(withdrawalRequests).set(updates).where(eq(withdrawalRequests.id, id));
}

/**
 * Notifications
 */
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(notifications).values(notification);
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt);
}

/**
 * Platform Settings
 */
export async function getPlatformSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
  return result[0]?.value;
}

export async function setPlatformSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(platformSettings).values({ key, value }).onDuplicateKeyUpdate({
    set: { value },
  });
}

/**
 * Helper function to generate referral codes
 */
function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}


