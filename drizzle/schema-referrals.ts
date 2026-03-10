/**
 * Planta & Raiz - Referral System Schema
 * Handles referrals, commissions, and specialist availability status
 */

import { sqliteTable, text, integer, real, boolean, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ===== REFERRAL SYSTEM =====

/**
 * Referral Codes - Unique codes for each user to share
 */
export const referralCodes = sqliteTable("referral_codes", {
  id: integer("id").primaryKey(),
  userId: text("user_id").notNull(),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["patient", "specialist", "pharmacy"] }).notNull(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at"),
  isActive: boolean("is_active").default(true),
  totalUses: integer("total_uses").default(0),
  totalEarnings: real("total_earnings").default(0),
});

/**
 * Referrals - Track each referral event
 */
export const referrals = sqliteTable("referrals", {
  id: integer("id").primaryKey(),
  referrerId: text("referrer_id").notNull(), // Who referred
  referredId: text("referred_id").notNull(), // Who was referred
  referralType: text("referral_type", { enum: ["patient", "specialist", "pharmacy"] }).notNull(),
  referralCode: text("referral_code").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "completed"] }).default("pending"),
  commissionAmount: real("commission_amount").default(0),
  commissionPercentage: real("commission_percentage").default(10), // 10% default
  transactionId: text("transaction_id"), // PIX transaction ID
  createdAt: integer("created_at").notNull(),
  confirmedAt: integer("confirmed_at"),
  completedAt: integer("completed_at"),
});

/**
 * Commissions - Track all commission payments
 */
export const commissions = sqliteTable("commissions", {
  id: integer("id").primaryKey(),
  userId: text("user_id").notNull(),
  referralId: integer("referral_id").notNull(),
  amount: real("amount").notNull(),
  percentage: real("percentage").notNull(),
  status: text("status", { enum: ["pending", "paid", "failed"] }).default("pending"),
  pixKey: text("pix_key"), // User's PIX key for payment
  paymentMethod: text("payment_method", { enum: ["pix", "bank_transfer"] }).default("pix"),
  transactionId: text("transaction_id"),
  createdAt: integer("created_at").notNull(),
  paidAt: integer("paid_at"),
  failureReason: text("failure_reason"),
});

/**
 * Referral Stats - Cached stats for leaderboard
 */
export const referralStats = sqliteTable("referral_stats", {
  userId: text("user_id").primaryKey(),
  totalReferrals: integer("total_referrals").default(0),
  confirmedReferrals: integer("confirmed_referrals").default(0),
  totalEarnings: real("total_earnings").default(0),
  pendingEarnings: real("pending_earnings").default(0),
  paidEarnings: real("paid_earnings").default(0),
  rank: integer("rank"),
  updatedAt: integer("updated_at").notNull(),
});

// ===== SPECIALIST AVAILABILITY =====

/**
 * Specialist Availability - Track online/offline status
 */
export const specialistAvailability = sqliteTable("specialist_availability", {
  id: integer("id").primaryKey(),
  specialistId: text("specialist_id").notNull().unique(),
  isOnline: boolean("is_online").default(false),
  status: text("status", { enum: ["online", "offline", "busy", "away"] }).default("offline"),
  currentConsultationCount: integer("current_consultation_count").default(0),
  maxConcurrentConsultations: integer("max_concurrent_consultations").default(5),
  lastStatusChange: integer("last_status_change").notNull(),
  nextAvailableAt: integer("next_available_at"),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * Specialist Schedule - Availability schedule
 */
export const specialistSchedule = sqliteTable("specialist_schedule", {
  id: integer("id").primaryKey(),
  specialistId: text("specialist_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "18:00"
  isAvailable: boolean("is_available").default(true),
  breakStartTime: text("break_start_time"),
  breakEndTime: text("break_end_time"),
});

/**
 * Specialist Sessions - Track active consultation sessions
 */
export const specialistSessions = sqliteTable("specialist_sessions", {
  id: integer("id").primaryKey(),
  specialistId: text("specialist_id").notNull(),
  patientId: text("patient_id").notNull(),
  consultationId: integer("consultation_id").notNull(),
  sessionType: text("session_type", { enum: ["chat", "video"] }).notNull(),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
  duration: integer("duration"), // in seconds
  status: text("status", { enum: ["active", "ended", "cancelled"] }).default("active"),
});

// ===== SPECIALIST PERFORMANCE METRICS =====

/**
 * Specialist Metrics - Performance tracking
 */
export const specialistMetrics = sqliteTable("specialist_metrics", {
  id: integer("id").primaryKey(),
  specialistId: text("specialist_id").notNull().unique(),
  totalConsultations: integer("total_consultations").default(0),
  completedConsultations: integer("completed_consultations").default(0),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  responseTimeSeconds: integer("response_time_seconds").default(0),
  cancellationRate: real("cancellation_rate").default(0),
  totalEarnings: real("total_earnings").default(0),
  monthlyEarnings: real("monthly_earnings").default(0),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * Specialist Reviews - Patient reviews and ratings
 */
export const specialistReviews = sqliteTable("specialist_reviews", {
  id: integer("id").primaryKey(),
  specialistId: text("specialist_id").notNull(),
  patientId: text("patient_id").notNull(),
  consultationId: integer("consultation_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  categories: text("categories"), // JSON: {communication, professionalism, knowledge}
  createdAt: integer("created_at").notNull(),
});

// ===== PHARMACY/PRODUCER METRICS =====

/**
 * Pharmacy Sales - Track sales per product
 */
export const pharmacySales = sqliteTable("pharmacy_sales", {
  id: integer("id").primaryKey(),
  pharmacyId: text("pharmacy_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalAmount: real("total_amount").notNull(),
  commissionAmount: real("commission_amount").notNull(),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).default("pending"),
  orderId: text("order_id").notNull(),
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at"),
});

/**
 * Pharmacy Inventory - Stock management
 */
export const pharmacyInventory = sqliteTable("pharmacy_inventory", {
  id: integer("id").primaryKey(),
  pharmacyId: text("pharmacy_id").notNull(),
  productId: integer("product_id").notNull(),
  currentStock: integer("current_stock").notNull(),
  minimumStock: integer("minimum_stock").default(10),
  maximumStock: integer("maximum_stock").default(100),
  lastRestocked: integer("last_restocked"),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * Pharmacy Metrics - Performance tracking
 */
export const pharmacyMetrics = sqliteTable("pharmacy_metrics", {
  id: integer("id").primaryKey(),
  pharmacyId: text("pharmacy_id").notNull().unique(),
  totalSales: integer("total_sales").default(0),
  totalRevenue: real("total_revenue").default(0),
  monthlyRevenue: real("monthly_revenue").default(0),
  averageOrderValue: real("average_order_value").default(0),
  totalProducts: integer("total_products").default(0),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * Pharmacy Reviews - Customer reviews
 */
export const pharmacyReviews = sqliteTable("pharmacy_reviews", {
  id: integer("id").primaryKey(),
  pharmacyId: text("pharmacy_id").notNull(),
  customerId: text("customer_id").notNull(),
  orderId: text("order_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  categories: text("categories"), // JSON: {quality, shipping, communication}
  createdAt: integer("created_at").notNull(),
});

// ===== RELATIONS =====

export const referralCodesRelations = relations(referralCodes, ({ many }) => ({
  referrals: many(referrals),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referralCode: one(referralCodes, {
    fields: [referrals.referralCode],
    references: [referralCodes.code],
  }),
  commission: one(commissions),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  referral: one(referrals, {
    fields: [commissions.referralId],
    references: [referrals.id],
  }),
}));

export const specialistAvailabilityRelations = relations(specialistAvailability, ({ many }) => ({
  schedule: many(specialistSchedule),
  sessions: many(specialistSessions),
}));

export const specialistScheduleRelations = relations(specialistSchedule, ({ one }) => ({
  availability: one(specialistAvailability, {
    fields: [specialistSchedule.specialistId],
    references: [specialistAvailability.specialistId],
  }),
}));

export const specialistSessionsRelations = relations(specialistSessions, ({ one }) => ({
  availability: one(specialistAvailability, {
    fields: [specialistSessions.specialistId],
    references: [specialistAvailability.specialistId],
  }),
}));

export const pharmacySalesRelations = relations(pharmacySales, ({ one }) => ({
  inventory: one(pharmacyInventory, {
    fields: [pharmacySales.productId],
    references: [pharmacyInventory.productId],
  }),
}));

export const pharmacyInventoryRelations = relations(pharmacyInventory, ({ many }) => ({
  sales: many(pharmacySales),
}));
