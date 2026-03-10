import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  complementaryServices,
  serviceBookings,
  serviceReviews,
  commissionLedger,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

const PLATFORM_COMMISSION_PERCENTAGE = 0.15; // 15%
const PROFESSION_COMMISSION_PERCENTAGE = 0.85; // 85%

export const marketplaceRouter = router({
  /**
   * List all active complementary services
   */
  listServices: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(complementaryServices).where(eq(complementaryServices.isActive, 1));

      if (input.category) {
        query = query.where(eq(complementaryServices.category, input.category as any));
      }

      const services = await query.limit(input.limit).offset(input.offset);
      return services;
    }),

  /**
   * Get service details
   */
  getService: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const service = await db
        .select()
        .from(complementaryServices)
        .where(eq(complementaryServices.id, input.id))
        .limit(1);

      return service[0] || null;
    }),

  /**
   * Create a new complementary service (profession only)
   */
  createService: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string().min(10),
        category: z.enum(["nutrition", "physiotherapy", "psychology", "fitness", "wellness"]),
        price: z.number().min(100),
        duration: z.number().min(15),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const serviceId = `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(complementaryServices).values({
        id: serviceId,
        professionId: ctx.user.openId,
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        duration: input.duration,
        rating: 0,
        reviewCount: 0,
        isActive: 1,
        createdAt: new Date(),
      });

      return { id: serviceId, ...input };
    }),

  /**
   * Book a complementary service
   */
  bookService: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        scheduledDate: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(serviceBookings).values({
        id: bookingId,
        serviceId: input.serviceId,
        patientId: ctx.user.openId,
        scheduledDate: input.scheduledDate,
        status: "pending",
        notes: input.notes || null,
        createdAt: new Date(),
      });

      return { id: bookingId, ...input };
    }),

  /**
   * Get professional's service bookings
   */
  getProfessionalBookings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const bookings = await db
      .select()
      .from(serviceBookings)
      .innerJoin(complementaryServices, eq(serviceBookings.serviceId, complementaryServices.id))
      .where(eq(complementaryServices.professionId, ctx.user.openId));

    return bookings;
  }),

  /**
   * Get commission summary for professional
   */
  getCommissionSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalEarned: 0, totalCommissions: 0, pendingPayment: 0 };

    const commissions = await db
      .select()
      .from(commissionLedger)
      .where(eq(commissionLedger.professionId, ctx.user.openId));

    const totalEarned = commissions.reduce((sum, c) => sum + (c.professionShare || 0), 0);
    const totalCommissions = commissions.reduce((sum, c) => sum + (c.platformShare || 0), 0);

    return {
      totalEarned,
      totalCommissions,
      pendingPayment: totalEarned,
    };
  }),
});
