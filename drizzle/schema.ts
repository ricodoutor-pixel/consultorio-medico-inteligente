import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "doctor", "store", "affiliate", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["individual", "clinic", "pharmacy", "partner"]).default("individual"),
  emailVerified: boolean("emailVerified").default(false),
  whatsappVerified: boolean("whatsappVerified").default(false),
  verificationCode: varchar("verificationCode", { length: 6 }),
  verificationCodeExpiry: timestamp("verificationCodeExpiry"),
  profileComplete: boolean("profileComplete").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Planos SaaS
export const saasPlans = mysqlTable("saas_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  benefits: json("benefits").$type<string[]>().notNull(),
  taxFreeCheckout: boolean("taxFreeCheckout").default(false),
  withdrawalTaxExemption: boolean("withdrawalTaxExemption").default(false),
  maxProfiles: int("maxProfiles").default(1),
  verificationBadge: boolean("verificationBadge").default(false),
  recommendationHighlight: boolean("recommendationHighlight").default(false),
  consultationRevenueSplit: decimal("consultationRevenueSplit", { precision: 5, scale: 2 }).default("0"),
  bannerAdvertising: boolean("bannerAdvertising").default(false),
  marketReports: boolean("marketReports").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SaasPlan = typeof saasPlans.$inferSelect;
export type InsertSaasPlan = typeof saasPlans.$inferInsert;

// Assinaturas de usuários
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "paused", "cancelled", "expired"]).default("active"),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  renewalDate: timestamp("renewalDate"),
  paymentMethodId: varchar("paymentMethodId", { length: 100 }),
  autoRenew: boolean("autoRenew").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Afiliados
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  referralCode: varchar("referralCode", { length: 50 }).notNull().unique(),
  referralLink: varchar("referralLink", { length: 255 }).notNull(),
  parentAffiliateId: int("parentAffiliateId"),
  level: int("level").default(1),
  totalReferrals: int("totalReferrals").default(0),
  totalCommissions: decimal("totalCommissions", { precision: 12, scale: 2 }).default("0"),
  withdrawnAmount: decimal("withdrawnAmount", { precision: 12, scale: 2 }).default("0"),
  pendingAmount: decimal("pendingAmount", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

// Comissões
export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  level: int("level").notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  transactionAmount: decimal("transactionAmount", { precision: 12, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "cancelled"]).default("pending"),
  transactionDate: timestamp("transactionDate").defaultNow().notNull(),
  paidDate: timestamp("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

// Transações Financeiras
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["subscription", "commission", "withdrawal", "refund", "admin_fee"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 12, scale: 2 }).default("0"),
  netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending"),
  description: text("description"),
  paymentMethodId: varchar("paymentMethodId", { length: 100 }),
  externalTransactionId: varchar("externalTransactionId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Saques
export const withdrawals = mysqlTable("withdrawals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 12, scale: 2 }).default("0"),
  netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(),
  bankAccount: json("bankAccount").$type<{accountNumber: string; bankCode: string; accountType: string}>(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending"),
  requestDate: timestamp("requestDate").defaultNow().notNull(),
  completedDate: timestamp("completedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = typeof withdrawals.$inferInsert;

// Agentes IA - Enfermeira Brisa
export const brisaTriages = mysqlTable("brisa_triages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symptoms: text("symptoms"),
  medicalHistory: text("medicalHistory"),
  location: varchar("location", { length: 255 }),
  matchedDoctors: json("matchedDoctors").$type<Array<{doctorId: number; matchScore: number}>>(),
  recommendedProducts: json("recommendedProducts").$type<Array<{productId: number; reason: string}>>(),
  triageDate: timestamp("triageDate").defaultNow().notNull(),
  followUpDate: timestamp("followUpDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrisaTriage = typeof brisaTriages.$inferSelect;
export type InsertBrisaTriage = typeof brisaTriages.$inferInsert;

// Smart Refill
export const smartRefills = mysqlTable("smart_refills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: varchar("productId", { length: 100 }).notNull(),
  medicationName: varchar("medicationName", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  frequency: varchar("frequency", { length: 100 }),
  lastRefillDate: timestamp("lastRefillDate"),
  nextRefillDate: timestamp("nextRefillDate"),
  autoRefillEnabled: boolean("autoRefillEnabled").default(true),
  refillDaysBeforeExpiry: int("refillDaysBeforeExpiry").default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmartRefill = typeof smartRefills.$inferSelect;
export type InsertSmartRefill = typeof smartRefills.$inferInsert;

// Guardião ANVISA - Validação de Receitas
export const anvisaValidations = mysqlTable("anvisa_validations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  receiptImageUrl: varchar("receiptImageUrl", { length: 255 }),
  ocrText: text("ocrText"),
  doctorName: varchar("doctorName", { length: 255 }),
  doctorCRM: varchar("doctorCRM", { length: 50 }),
  crmValidated: boolean("crmValidated").default(false),
  productCompliance: boolean("productCompliance").default(false),
  validationStatus: mysqlEnum("validationStatus", ["pending", "approved", "rejected", "manual_review"]).default("pending"),
  validationDate: timestamp("validationDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnvisaValidation = typeof anvisaValidations.$inferSelect;
export type InsertAnvisaValidation = typeof anvisaValidations.$inferInsert;

// Verdinho - Suporte Técnico
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["technical", "billing", "account", "product", "logistics", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_user", "resolved", "closed"]).default("open"),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;