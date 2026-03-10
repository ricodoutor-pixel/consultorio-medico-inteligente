/**
 * Planta & Raiz - Referral System Router
 * Handles referral codes, tracking, commissions, and specialist availability
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";

export const referralsRouter = router({
  // ===== REFERRAL CODE MANAGEMENT =====

  /**
   * Generate a unique referral code for the current user
   */
  generateReferralCode: protectedProcedure
    .input(
      z.object({
        type: z.enum(["patient", "specialist", "pharmacy"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const code = `${input.type.toUpperCase()}-${userId.substring(0, 8)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // In production, save to database
      // await db.insert(referralCodes).values({
      //   userId: ctx.user.id,
      //   code,
      //   type: input.type,
      //   createdAt: Date.now(),
      // });

      return {
        code,
        shareUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/join?ref=${code}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${process.env.VITE_APP_URL || "http://localhost:3000"}/join?ref=${code}`)}`,
      };
    }),

  /**
   * Get user's referral code
   */
  getReferralCode: protectedProcedure.query(async ({ ctx }) => {
    // In production, fetch from database
    const userId = String(ctx.user.id);
    const code = `${userId.substring(0, 8)}-REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      code,
      shareUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/join?ref=${code}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${process.env.VITE_APP_URL || "http://localhost:3000"}/join?ref=${code}`)}`,
      createdAt: new Date(),
    };
  }),

  // ===== REFERRAL TRACKING =====

  /**
   * Get referral statistics for leaderboard
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      // Mock data - in production, fetch from database
      const leaderboardData = [
        {
          rank: 1,
          userId: "user-001",
          name: "Dr. João Silva",
          avatar: "👨‍⚕️",
          type: "specialist",
          totalReferrals: 87,
          confirmedReferrals: 82,
          totalEarnings: 8200,
          pendingEarnings: 500,
          badge: "🏆 Top Referrer",
        },
        {
          rank: 2,
          userId: "user-002",
          name: "Farmácia Bem-Estar",
          avatar: "💚",
          type: "pharmacy",
          totalReferrals: 65,
          confirmedReferrals: 61,
          totalEarnings: 6100,
          pendingEarnings: 300,
          badge: "⭐ Excellent",
        },
        {
          rank: 3,
          userId: "user-003",
          name: "Dra. Maria Santos",
          avatar: "👩‍⚕️",
          type: "specialist",
          totalReferrals: 54,
          confirmedReferrals: 51,
          totalEarnings: 5100,
          pendingEarnings: 200,
          badge: "🌟 Rising Star",
        },
        {
          rank: 4,
          userId: "user-004",
          name: "Produtor Premium RJ",
          avatar: "🌿",
          type: "pharmacy",
          totalReferrals: 43,
          confirmedReferrals: 40,
          totalEarnings: 4000,
          pendingEarnings: 150,
          badge: "",
        },
        {
          rank: 5,
          userId: "user-005",
          name: "Dr. Carlos Mendes",
          avatar: "👨‍⚕️",
          type: "specialist",
          totalReferrals: 38,
          confirmedReferrals: 36,
          totalEarnings: 3600,
          pendingEarnings: 100,
          badge: "",
        },
      ];

      return {
        leaderboard: leaderboardData.slice(input.offset, input.offset + input.limit),
        total: leaderboardData.length,
      };
    }),

  /**
   * Get user's referral statistics
   */
  getMyReferralStats: protectedProcedure.query(async ({ ctx }) => {
    // Mock data - in production, fetch from database
    return {
      userId: ctx.user.id,
      totalReferrals: 12,
      confirmedReferrals: 10,
      totalEarnings: 1000,
      pendingEarnings: 200,
      paidEarnings: 800,
      rank: 45,
      referrals: [
        {
          id: 1,
          referredName: "João Silva",
          referredType: "patient",
          status: "completed",
          commissionAmount: 100,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          referredName: "Farmácia Vida Verde",
          referredType: "pharmacy",
          status: "completed",
          commissionAmount: 150,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: 3,
          referredName: "Dr. Pedro Costa",
          referredType: "specialist",
          status: "pending",
          commissionAmount: 50,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
    };
  }),

  /**
   * Get referral history with pagination
   */
  getReferralHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        status: z.enum(["all", "pending", "completed"]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      // Mock data - in production, fetch from database
      const history = [
        {
          id: 1,
          referredName: "João Silva",
          referredType: "patient",
          referredEmail: "joao@example.com",
          status: "completed",
          commissionAmount: 100,
          commissionPercentage: 10,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          referredName: "Farmácia Vida Verde",
          referredType: "pharmacy",
          referredEmail: "contato@vidaverde.com.br",
          status: "completed",
          commissionAmount: 150,
          commissionPercentage: 10,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: 3,
          referredName: "Dr. Pedro Costa",
          referredType: "specialist",
          referredEmail: "pedro@example.com",
          status: "pending",
          commissionAmount: 50,
          commissionPercentage: 10,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedAt: null,
          paidAt: null,
        },
      ];

      const filtered =
        input.status === "all"
          ? history
          : history.filter((h) => h.status === input.status);

      return {
        history: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  // ===== SPECIALIST AVAILABILITY =====

  /**
   * Get specialist availability status
   */
  getSpecialistAvailability: publicProcedure
    .input(z.object({ specialistId: z.number() }))
    .query(async ({ input }) => {
      // Mock data - in production, fetch from database
      const isOnline = Math.random() > 0.5; // Random for demo

      return {
        specialistId: input.specialistId,
        isOnline,
        status: isOnline ? "online" : "offline",
        currentConsultations: isOnline ? Math.floor(Math.random() * 5) : 0,
        maxConcurrentConsultations: 5,
        nextAvailableAt: isOnline ? null : new Date(Date.now() + 30 * 60 * 1000),
        lastStatusChange: new Date(),
      };
    }),

  /**
   * Get all specialists with availability status
   */
  getSpecialistsWithAvailability: publicProcedure.query(async () => {
    // Mock data - in production, fetch from database with availability joined
    const specialists = [
      {
        id: 1,
        name: "Dr. João Silva",
        specialty: "Neurologia",
        avatar: "👨‍⚕️",
        isOnline: true,
        status: "online",
        currentConsultations: 2,
        maxConcurrentConsultations: 5,
        rating: 4.9,
        consultationPrice: 120,
      },
      {
        id: 2,
        name: "Dra. Maria Santos",
        specialty: "Oncologia",
        avatar: "👩‍⚕️",
        isOnline: false,
        status: "offline",
        currentConsultations: 0,
        maxConcurrentConsultations: 5,
        rating: 4.8,
        consultationPrice: 150,
      },
      {
        id: 3,
        name: "Dr. Carlos Mendes",
        specialty: "Reumatologia",
        avatar: "👨‍⚕️",
        isOnline: true,
        status: "online",
        currentConsultations: 1,
        maxConcurrentConsultations: 5,
        rating: 4.7,
        consultationPrice: 100,
      },
    ];

    return specialists;
  }),

  /**
   * Update specialist online status (specialist only)
   */
  updateAvailabilityStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["online", "offline", "busy", "away"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In production, update database
      // await db.update(specialistAvailability)
      //   .set({
      //     status: input.status,
      //     isOnline: input.status === "online",
      //     lastStatusChange: Date.now(),
      //     updatedAt: Date.now(),
      //   })
      //   .where(eq(specialistAvailability.specialistId, ctx.user.id));

      return {
        success: true,
        status: input.status,
        isOnline: input.status === "online",
        updatedAt: new Date(),
      };
    }),

  /**
   * Get specialist's current sessions
   */
  getMyActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    // Mock data
    return {
      activeSessions: [
        {
          id: 1,
          patientName: "João Silva",
          patientId: "patient-001",
          sessionType: "chat",
          startedAt: new Date(Date.now() - 15 * 60 * 1000),
          duration: 15,
          consultationId: 101,
        },
        {
          id: 2,
          patientName: "Maria Santos",
          patientId: "patient-002",
          sessionType: "video",
          startedAt: new Date(Date.now() - 5 * 60 * 1000),
          duration: 5,
          consultationId: 102,
        },
      ],
      totalActive: 2,
      maxConcurrent: 5,
      canAcceptMore: true,
    };
  }),

  // Note: Real-time availability updates will be handled via WebSocket
  // See websocket-handlers for subscription implementation
});

export default referralsRouter;
