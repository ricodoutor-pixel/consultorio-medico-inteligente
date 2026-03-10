import { sqliteTable, text, integer, real, boolean, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ============= USERS & AUTHENTICATION =============

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  birthDate: integer('birth_date'), // Unix timestamp
  cpf: text('cpf').unique(),
  role: text('role', { enum: ['patient', 'professional', 'vendor', 'admin'] }).default('patient'),
  avatar: text('avatar'),
  bio: text('bio'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').$defaultFn(() => Date.now()),
});

export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country').default('BR'),
  medicalHistory: text('medical_history'), // JSON
  allergies: text('allergies'), // JSON array
  currentMedications: text('current_medications'), // JSON array
  preferredLanguages: text('preferred_languages').default('["Português"]'), // JSON array
  newsletter: boolean('newsletter').default(true),
});

// ============= PROFESSIONALS =============

export const professionals = sqliteTable('professionals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  crm: text('crm').unique().notNull(), // Conselho Regional de Medicina
  specialty: text('specialty').notNull(),
  subspecialties: text('subspecialties').default('[]'), // JSON array
  yearsOfExperience: integer('years_of_experience').notNull(),
  consultationFee: real('consultation_fee').notNull(),
  responseTimeMinutes: integer('response_time_minutes').default(15),
  languages: text('languages').default('["Português"]'), // JSON array
  treatmentAreas: text('treatment_areas').default('[]'), // JSON array
  credentials: text('credentials').default('[]'), // JSON array
  verified: boolean('verified').default(false),
  verificationDate: integer('verification_date'),
  rating: real('rating').default(0),
  reviewCount: integer('review_count').default(0),
  successRate: real('success_rate').default(0),
  onlineStatus: text('online_status', { enum: ['online', 'offline', 'busy'] }).default('offline'),
  lastActiveAt: integer('last_active_at'),
  availabilityHours: text('availability_hours').default('[]'), // JSON array
  consultationTypes: text('consultation_types').default('["video","phone","chat"]'), // JSON array
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const professionalReviews = sqliteTable('professional_reviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  professionalId: text('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

// ============= CONSULTATIONS =============

export const consultations = sqliteTable('consultations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  patientId: text('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  professionalId: text('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'] }).default('scheduled'),
  consultationType: text('consultation_type', { enum: ['video', 'phone', 'chat'] }).notNull(),
  scheduledAt: integer('scheduled_at').notNull(),
  startedAt: integer('started_at'),
  endedAt: integer('ended_at'),
  cost: real('cost').notNull(),
  paymentStatus: text('payment_status', { enum: ['pending', 'paid', 'refunded'] }).default('pending'),
  paymentMethod: text('payment_method', { enum: ['pix', 'credit_card', 'insurance'] }),
  transactionId: text('transaction_id'),
  notes: text('notes'),
  prescription: text('prescription'), // JSON
  recordingUrl: text('recording_url'),
  joinUrl: text('join_url'),
  confirmationCode: text('confirmation_code').unique(),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const preInterviews = sqliteTable('pre_interviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  consultationId: text('consultation_id').notNull().unique().references(() => consultations.id, { onDelete: 'cascade' }),
  symptoms: text('symptoms').notNull(), // JSON array
  urgency: text('urgency', { enum: ['routine', 'urgent', 'emergency'] }).notNull(),
  medicalHistory: text('medical_history'),
  currentMedications: text('current_medications'), // JSON array
  allergies: text('allergies'), // JSON array
  aiAnalysis: text('ai_analysis'), // JSON
  completedAt: integer('completed_at'),
});

// ============= PRESCRIPTIONS =============

export const prescriptions = sqliteTable('prescriptions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  consultationId: text('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  professionalId: text('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  strainRecommendations: text('strain_recommendations'), // JSON array with 3 strains
  dosageInstructions: text('dosage_instructions'),
  administrationMethod: text('administration_method'), // oil, capsule, tincture, etc
  titrationPlan: text('titration_plan'), // JSON - 8 week plan
  treatmentDuration: integer('treatment_duration'), // days
  followUpDate: integer('follow_up_date'),
  contraindications: text('contraindications'), // JSON array
  drugInteractions: text('drug_interactions'), // JSON array
  status: text('status', { enum: ['active', 'completed', 'cancelled'] }).default('active'),
  issuedAt: integer('issued_at').$defaultFn(() => Date.now()),
  expiresAt: integer('expires_at'),
});

// ============= HEALTH RECORDS =============

export const healthRecords = sqliteTable('health_records', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  patientId: text('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recordType: text('record_type', { enum: ['consultation', 'lab', 'imaging', 'procedure', 'medication'] }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  attachments: text('attachments').default('[]'), // JSON array of URLs
  vitals: text('vitals'), // JSON - blood pressure, heart rate, etc
  labResults: text('lab_results'), // JSON
  medications: text('medications'), // JSON array
  notes: text('notes'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
  createdBy: text('created_by').references(() => professionals.id),
});

export const medicationReminders = sqliteTable('medication_reminders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  patientId: text('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  prescriptionId: text('prescription_id').references(() => prescriptions.id, { onDelete: 'cascade' }),
  medicationName: text('medication_name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency', { enum: ['1x', '2x', '3x', '4x'] }).notNull(),
  times: text('times'), // JSON array - ["08:00", "20:00"]
  startDate: integer('start_date'),
  endDate: integer('end_date'),
  adherenceRate: real('adherence_rate').default(0),
  lastReminderSent: integer('last_reminder_sent'),
  enabled: boolean('enabled').default(true),
});

// ============= CANNABIS STRAINS =============

export const strains = sqliteTable('strains', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').unique().notNull(),
  type: text('type', { enum: ['Indica', 'Sativa', 'Híbrida'] }).notNull(),
  thcPercentage: text('thc_percentage'), // "17-24%"
  cbdPercentage: text('cbd_percentage'), // "2%"
  effects: text('effects').default('[]'), // JSON array
  benefits: text('benefits').default('[]'), // JSON array
  flavors: text('flavors').default('[]'), // JSON array
  growTime: text('grow_time'), // "8-9 weeks"
  yield: text('yield'), // "300-400g/m²"
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }),
  rating: real('rating').default(0),
  reviewCount: integer('review_count').default(0),
  description: text('description'),
  image: text('image'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const strainRecommendations = sqliteTable('strain_recommendations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  strainId: text('strain_id').notNull().references(() => strains.id, { onDelete: 'cascade' }),
  symptom: text('symptom').notNull(),
  condition: text('condition'),
  effectiveness: real('effectiveness'), // 0-100
  sideEffects: text('side_effects').default('[]'), // JSON array
});

// ============= SHOPPING & PRODUCTS =============

export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  storeName: text('store_name').notNull(),
  description: text('description'),
  logo: text('logo'),
  banner: text('banner'),
  verified: boolean('verified').default(false),
  rating: real('rating').default(0),
  reviewCount: integer('review_count').default(0),
  totalSales: integer('total_sales').default(0),
  responseTime: integer('response_time'), // hours
  shippingCost: real('shipping_cost'),
  freeShippingThreshold: real('free_shipping_threshold'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  vendorId: text('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category', { enum: ['oil', 'capsule', 'tincture', 'edible', 'topical', 'supplement', 'other'] }).notNull(),
  price: real('price').notNull(),
  discountPrice: real('discount_price'),
  stock: integer('stock').notNull(),
  images: text('images').default('[]'), // JSON array
  coa: text('coa'), // Certificate of Analysis URL
  thcContent: text('thc_content'),
  cbdContent: text('cbd_content'),
  ingredients: text('ingredients').default('[]'), // JSON array
  rating: real('rating').default(0),
  reviewCount: integer('review_count').default(0),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const productReviews = sqliteTable('product_reviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] }).default('pending'),
  totalAmount: real('total_amount').notNull(),
  shippingCost: real('shipping_cost').notNull(),
  discountAmount: real('discount_amount').default(0),
  paymentStatus: text('payment_status', { enum: ['pending', 'paid', 'failed'] }).default('pending'),
  paymentMethod: text('payment_method', { enum: ['pix', 'credit_card'] }),
  transactionId: text('transaction_id'),
  shippingAddress: text('shipping_address').notNull(), // JSON
  trackingNumber: text('tracking_number'),
  estimatedDelivery: integer('estimated_delivery'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').$defaultFn(() => Date.now()),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  subtotal: real('subtotal').notNull(),
});

// ============= PLANS & SUBSCRIPTIONS =============

export const plans = sqliteTable('plans', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  billingCycle: text('billing_cycle', { enum: ['monthly', 'quarterly', 'annual'] }).notNull(),
  consultationsIncluded: integer('consultations_included'),
  discountPercentage: real('discount_percentage').default(0),
  features: text('features').default('[]'), // JSON array
  active: boolean('active').default(true),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull().references(() => plans.id),
  status: text('status', { enum: ['active', 'cancelled', 'expired'] }).default('active'),
  startDate: integer('start_date').$defaultFn(() => Date.now()),
  endDate: integer('end_date'),
  autoRenew: boolean('auto_renew').default(true),
  consultationsUsed: integer('consultations_used').default(0),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

// ============= REFERRALS & AFFILIATES =============

export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  referrerId: text('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referralCode: text('referral_code').unique().notNull(),
  referredUserId: text('referred_user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['pending', 'completed', 'expired'] }).default('pending'),
  commissionPercentage: real('commission_percentage').default(10),
  commissionAmount: real('commission_amount').default(0),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
  completedAt: integer('completed_at'),
});

export const affiliateStats = sqliteTable('affiliate_stats', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  totalReferrals: integer('total_referrals').default(0),
  successfulReferrals: integer('successful_referrals').default(0),
  totalCommissions: real('total_commissions').default(0),
  pendingCommissions: real('pending_commissions').default(0),
  withdrawnCommissions: real('withdrawn_commissions').default(0),
  lastWithdrawalDate: integer('last_withdrawal_date'),
});

// ============= NOTIFICATIONS & MESSAGES =============

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['consultation', 'message', 'reminder', 'promotion', 'system'] }).notNull(),
  title: text('title').notNull(),
  content: text('content'),
  read: boolean('read').default(false),
  actionUrl: text('action_url'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  consultationId: text('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id),
  recipientId: text('recipient_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  attachments: text('attachments').default('[]'), // JSON array
  read: boolean('read').default(false),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

// ============= ADMIN & COMPLIANCE =============

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource'),
  resourceId: text('resource_id'),
  changes: text('changes'), // JSON
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

export const compliance = sqliteTable('compliance', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  lgpdConsent: boolean('lgpd_consent').default(false),
  termsAccepted: boolean('terms_accepted').default(false),
  privacyAccepted: boolean('privacy_accepted').default(false),
  consentDate: integer('consent_date'),
  lastUpdated: integer('last_updated'),
});

// ============= ANALYTICS =============

export const analytics = sqliteTable('analytics', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  eventType: text('event_type').notNull(),
  userId: text('user_id').references(() => users.id),
  metadata: text('metadata'), // JSON
  createdAt: integer('created_at').$defaultFn(() => Date.now()),
});

// ============= RELATIONS =============

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  professional: one(professionals),
  vendor: one(vendors),
  consultations: many(consultations),
  healthRecords: many(healthRecords),
  orders: many(orders),
  subscriptions: many(subscriptions),
  referrals: many(referrals),
  affiliateStats: one(affiliateStats),
}));

export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  user: one(users, { fields: [professionals.userId], references: [users.id] }),
  consultations: many(consultations),
  prescriptions: many(prescriptions),
  reviews: many(professionalReviews),
}));

export const consultationsRelations = relations(consultations, ({ one, many }) => ({
  patient: one(users, { fields: [consultations.patientId], references: [users.id] }),
  professional: one(professionals, { fields: [consultations.professionalId], references: [professionals.id] }),
  preInterview: one(preInterviews),
  prescription: one(prescriptions),
  messages: many(messages),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, { fields: [products.vendorId], references: [vendors.id] }),
  reviews: many(productReviews),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));
