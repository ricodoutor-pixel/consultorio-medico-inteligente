import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionPlan: mysqlEnum("subscription_plan", ["free", "usuario", "lojista_pro", "medico_vip", "empresa_parceiros", "clinica_familia"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Investment plans configuration
 */
export const investmentPlans = mysqlTable("investment_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // Bronze, Prata, Ouro, Diamante
  minAmount: int("min_amount").notNull(),
  maxAmount: int("max_amount").notNull(),
  dailyReturnPercentage: int("daily_return_percentage").notNull(), // 1-3 (stored as integer, divide by 100)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type InsertInvestmentPlan = typeof investmentPlans.$inferInsert;

/**
 * User investments/positions
 */
export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  planId: int("plan_id").notNull().references(() => investmentPlans.id),
  amount: int("amount").notNull(), // in cents
  accumulatedReturns: int("accumulated_returns").default(0).notNull(), // in cents
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;

/**
 * Financial transactions (deposits, withdrawals, earnings)
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  type: mysqlEnum("type", ["deposit", "withdrawal", "earnings", "commission"]).notNull(),
  amount: int("amount").notNull(), // in cents
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  mercadoPagoId: varchar("mercado_pago_id", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Affiliate system - referral codes and tracking
 */
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique().references(() => users.id),
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  totalReferrals: int("total_referrals").default(0).notNull(),
  totalCommissions: int("total_commissions").default(0).notNull(), // in cents
  commissionRate: int("commission_rate").default(10).notNull(), // percentage (10 = 10%)
  uplineId: int("upline_id").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

/**
 * Referral tracking - who referred whom
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrer_id").notNull().references(() => users.id),
  referredId: int("referred_id").notNull().references(() => users.id),
  depositAmount: int("deposit_amount").notNull(), // in cents
  commissionEarned: int("commission_earned").notNull(), // in cents
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * User balance tracking
 */
export const userBalances = mysqlTable("user_balances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique().references(() => users.id),
  availableBalance: int("available_balance").default(0).notNull(), // in cents
  investedAmount: int("invested_amount").default(0).notNull(), // in cents
  totalEarnings: int("total_earnings").default(0).notNull(), // in cents
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserBalance = typeof userBalances.$inferSelect;
export type InsertUserBalance = typeof userBalances.$inferInsert;

/**
 * Withdrawal requests
 */
export const withdrawalRequests = mysqlTable("withdrawal_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "processed", "failed"]).default("pending").notNull(),
  bankData: text("bank_data"), // JSON with bank account details
  requestedAmount: int("requested_amount").notNull(), // in cents (requested amount)
  netAmount: int("net_amount").notNull(), // in cents (after fee)
  fee: int("fee").default(0).notNull(), // in cents
  mercadoPagoId: varchar("mercado_pago_id", { length: 255 }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

/**
 * Platform notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  type: mysqlEnum("type", ["deposit", "withdrawal", "earnings", "commission", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: int("read").default(0).notNull(), // 0 = unread, 1 = read
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Platform settings
 */
export const platformSettings = mysqlTable("platform_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

/**
 * Conversation history for Verdinho AI chat
 */
export const conversationHistory = mysqlTable("conversation_history", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ConversationHistory = typeof conversationHistory.$inferSelect;
export type InsertConversationHistory = typeof conversationHistory.$inferInsert;


/**
 * User sentiment analysis for Verdinho AI
 * Tracks emotional state and sentiment of user messages
 */
export const userSentiments = mysqlTable("user_sentiments", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  messageId: varchar("message_id", { length: 100 }).notNull(),
  sentiment: mysqlEnum("sentiment", [
    "very_positive",
    "positive",
    "neutral",
    "negative",
    "very_negative"
  ]).notNull(),
  emotion: mysqlEnum("emotion", [
    "happy",
    "satisfied",
    "neutral",
    "confused",
    "frustrated",
    "angry",
    "sad"
  ]).notNull(),
  score: int("score").notNull(), // -100 to 100
  keywords: text("keywords"), // JSON array of detected keywords
  messageContent: text("message_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserSentiment = typeof userSentiments.$inferSelect;
export type InsertUserSentiment = typeof userSentiments.$inferInsert;

/**
 * Sentiment statistics per user
 * Aggregated data for dashboard and personalization
 */
export const sentimentStats = mysqlTable("sentiment_stats", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull().unique(),
  totalMessages: int("total_messages").default(0).notNull(),
  avgSentimentScore: int("avg_sentiment_score").default(0).notNull(), // -100 to 100
  positiveCount: int("positive_count").default(0).notNull(),
  negativeCount: int("negative_count").default(0).notNull(),
  neutralCount: int("neutral_count").default(0).notNull(),
  mostFrequentEmotion: varchar("most_frequent_emotion", { length: 50 }),
  lastAnalyzedAt: timestamp("last_analyzed_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SentimentStats = typeof sentimentStats.$inferSelect;
export type InsertSentimentStats = typeof sentimentStats.$inferInsert;


/**
 * Complementary Health Services Marketplace
 * Nutritionists, Physiotherapists, Psychologists, etc.
 */
export const complementaryServices = mysqlTable("complementary_services", {
  id: varchar("id", { length: 100 }).primaryKey(),
  professionId: varchar("profession_id", { length: 64 }).notNull().references(() => users.openId),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Nutrição Personalizada"
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "nutrition",
    "physiotherapy",
    "psychology",
    "fitness",
    "wellness",
    "mental_health",
    "other"
  ]).notNull(),
  price: int("price").notNull(), // in cents (e.g., 15000 = R$ 150.00)
  duration: int("duration").notNull(), // in minutes
  rating: int("rating").default(0), // 0-5 (stored as 0-500 for 0.0-5.0)
  reviewCount: int("review_count").default(0).notNull(),
  isActive: int("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ComplementaryService = typeof complementaryServices.$inferSelect;
export type InsertComplementaryService = typeof complementaryServices.$inferInsert;

/**
 * Service Bookings
 * Track all bookings for complementary services
 */
export const serviceBookings = mysqlTable("service_bookings", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull().references(() => users.openId),
  serviceId: varchar("service_id", { length: 100 }).notNull().references(() => complementaryServices.id),
  professionId: varchar("profession_id", { length: 64 }).notNull().references(() => users.openId),
  bookingDate: timestamp("booking_date").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show"
  ]).default("pending").notNull(),
  totalPrice: int("total_price").notNull(), // in cents
  platformFee: int("platform_fee").notNull(), // 15% of total
  professionFee: int("profession_fee").notNull(), // 85% of total
  paymentStatus: mysqlEnum("payment_status", [
    "pending",
    "processing",
    "completed",
    "failed",
    "refunded"
  ]).default("pending").notNull(),
  mercadoPagoId: varchar("mercado_pago_id", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ServiceBooking = typeof serviceBookings.$inferSelect;
export type InsertServiceBooking = typeof serviceBookings.$inferInsert;

/**
 * Service Reviews and Ratings
 */
export const serviceReviews = mysqlTable("service_reviews", {
  id: varchar("id", { length: 100 }).primaryKey(),
  bookingId: varchar("booking_id", { length: 100 }).notNull().references(() => serviceBookings.id),
  userId: varchar("user_id", { length: 64 }).notNull().references(() => users.openId),
  serviceId: varchar("service_id", { length: 100 }).notNull().references(() => complementaryServices.id),
  rating: int("rating").notNull(), // 1-5
  title: varchar("title", { length: 255 }),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ServiceReview = typeof serviceReviews.$inferSelect;
export type InsertServiceReview = typeof serviceReviews.$inferInsert;

/**
 * Commission Ledger
 * Track all commissions for services
 */
export const commissionLedger = mysqlTable("commission_ledger", {
  id: varchar("id", { length: 100 }).primaryKey(),
  bookingId: varchar("booking_id", { length: 100 }).notNull().references(() => serviceBookings.id),
  serviceId: varchar("service_id", { length: 100 }).notNull().references(() => complementaryServices.id),
  professionId: varchar("profession_id", { length: 64 }).notNull().references(() => users.openId),
  totalAmount: int("total_amount").notNull(), // in cents
  platformFee: int("platform_fee").notNull(), // 15%
  professionFee: int("profession_fee").notNull(), // 85%
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "completed",
    "failed"
  ]).default("pending").notNull(),
  withdrawalId: varchar("withdrawal_id", { length: 255 }),
  withdrawalDate: timestamp("withdrawal_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CommissionLedger = typeof commissionLedger.$inferSelect;
export type InsertCommissionLedger = typeof commissionLedger.$inferInsert;

/**
 * Professional Commission Summary
 * Aggregated commission data per professional
 */
export const professionCommissionSummary = mysqlTable("profession_commission_summary", {
  id: varchar("id", { length: 100 }).primaryKey(),
  professionId: varchar("profession_id", { length: 64 }).notNull().unique().references(() => users.openId),
  totalEarnings: int("total_earnings").default(0).notNull(), // in cents
  totalBookings: int("total_bookings").default(0).notNull(),
  totalCompleted: int("total_completed").default(0).notNull(),
  totalCancelled: int("total_cancelled").default(0).notNull(),
  pendingWithdrawal: int("pending_withdrawal").default(0).notNull(),
  lastWithdrawalDate: timestamp("last_withdrawal_date"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProfessionCommissionSummary = typeof professionCommissionSummary.$inferSelect;
export type InsertProfessionCommissionSummary = typeof professionCommissionSummary.$inferInsert;
