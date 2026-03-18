import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, saasPlans, subscriptions, affiliates, commissions, transactions } from "../drizzle/schema";
import { ENV } from './_core/env';

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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserVerification(userId: number, emailVerified: boolean, whatsappVerified: boolean) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(users)
      .set({ emailVerified, whatsappVerified, profileComplete: emailVerified && whatsappVerified })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update user verification:", error);
    return false;
  }
}

// Planos SaaS
export async function getSaasPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(saasPlans).orderBy(saasPlans.monthlyPrice);
}

export async function getSaasPlanBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(saasPlans).where(eq(saasPlans.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Assinaturas
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Afiliados
export async function getAffiliateByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(affiliates)
    .where(eq(affiliates.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAffiliateByReferralCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(affiliates)
    .where(eq(affiliates.referralCode, code))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Transações
export async function getUserTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(transactions.createdAt)
    .limit(limit);
}

// Comissões
export async function getAffiliateCommissions(affiliateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions)
    .where(eq(commissions.affiliateId, affiliateId))
    .orderBy(commissions.transactionDate);
}


// Calculo de comissoes
export function calculateCommission(amount: number, level: number): number {
  const rates: Record<number, number> = {
    1: 0.50,  // 50%
    2: 0.05,  // 5%
    3: 0.02,  // 2%
  };
  
  const rate = rates[level] || 0;
  return amount * rate;
}

// Calculo de taxa de administracao
export function calculateAdminFee(amount: number, isSubscriber: boolean): number {
  if (isSubscriber) return 0; // Sem taxa para assinantes
  return amount * 0.05; // 5% para nao-assinantes
}

// Calculo de taxa de saque
export function calculateWithdrawalFee(amount: number, hasWithdrawalExemption: boolean): number {
  if (hasWithdrawalExemption) return 0; // Sem taxa para Clinica Familia
  return amount * 0.05; // 5% para outros
}
