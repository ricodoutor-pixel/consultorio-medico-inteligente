import { describe, it, expect, beforeAll } from "vitest";
import { ReputationService, ReviewService, VendorReputationService } from "./services/reputationService";
import { AnalyticsService, RealtimeDashboardService, ABTestingService } from "./services/analyticsService";

describe("Reputation System", () => {
  describe("ReputationService", () => {
    it("should verify professional credentials", async () => {
      const result = await ReputationService.verifyProfessionalCredentials("CRM123456", "Ansiedade");
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.specialty).toBe("Ansiedade");
      expect(result.verificationDate).toBeInstanceOf(Date);
    });

    it("should calculate trust score correctly", () => {
      const reputation = {
        crmVerified: true,
        rating: 4.8,
        responseTime: 15,
        consultationCount: 250,
        badges: [
          { id: "verified", name: "Verified", description: "Test", icon: "✓", earnedAt: new Date() },
          { id: "responsive", name: "Responsive", description: "Test", icon: "⚡", earnedAt: new Date() }
        ]
      };

      const score = ReputationService.calculateTrustScore(reputation);
      
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should award badges to professionals", async () => {
      const badge = await ReputationService.awardBadge(1, "top-rated");
      
      expect(badge.id).toBe("top-rated");
      expect(badge.name).toBe("Top Rated");
      expect(badge.earnedAt).toBeInstanceOf(Date);
    });

    it("should generate professional profile with reputation", async () => {
      const profile = await ReputationService.generateProfessionalProfile(1);
      
      expect(profile.professionalId).toBe(1);
      expect(profile.crmVerified).toBe(true);
      expect(profile.specializations).toContain("Ansiedade");
      expect(profile.rating).toBeGreaterThan(4);
      expect(profile.trustScore).toBeGreaterThan(80);
      expect(profile.badges.length).toBeGreaterThan(0);
    });

    it("should update professional rating", async () => {
      const newRating = await ReputationService.updateRating(1, 4.9, "Excellent service");
      
      expect(newRating).toBeLessThanOrEqual(5);
      expect(newRating).toBeGreaterThan(0);
    });

    it("should get professional ranking", async () => {
      const ranking = await ReputationService.getProfessionalRanking(5);
      
      expect(ranking).toHaveLength(5);
      expect(ranking[0].trustScore).toBeGreaterThanOrEqual(ranking[1].trustScore);
    });
  });

  describe("ReviewService", () => {
    it("should add review for professional", async () => {
      const result = await ReviewService.addReview(1, 1, 1, 5, "Great doctor!");
      
      expect(result.success).toBe(true);
      expect(result.message).toBe("Review added successfully");
      expect(result.newAverageRating).toBe(5);
    });

    it("should reject invalid ratings", async () => {
      const result = await ReviewService.addReview(1, 1, 1, 6, "Invalid rating");
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("between 1 and 5");
    });

    it("should get reviews for professional", async () => {
      const reviews = await ReviewService.getReviews(1, 10);
      
      expect(Array.isArray(reviews)).toBe(true);
      if (reviews.length > 0) {
        expect(reviews[0]).toHaveProperty("rating");
        expect(reviews[0]).toHaveProperty("comment");
        expect(reviews[0]).toHaveProperty("date");
      }
    });

    it("should detect fake reviews", async () => {
      const reviews = [
        { comment: "Great service", rating: 5 },
        { comment: "Amazing experience", rating: 5 }
      ];
      
      const result = await ReviewService.detectFakeReviews(reviews);
      
      expect(result).toHaveProperty("fakeReviewCount");
      expect(result).toHaveProperty("suspiciousReviews");
      expect(Array.isArray(result.suspiciousReviews)).toBe(true);
    });
  });

  describe("VendorReputationService", () => {
    it("should verify vendor credentials", async () => {
      const result = await VendorReputationService.verifyVendorCredentials("12345678901234");
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.verificationDate).toBeInstanceOf(Date);
    });

    it("should calculate vendor trust score", () => {
      const score = VendorReputationService.calculateVendorTrustScore(95, 4.8, 4.7, 15);
      
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should get vendor ranking", async () => {
      const ranking = await VendorReputationService.getVendorRanking(5);
      
      expect(Array.isArray(ranking)).toBe(true);
    });
  });
});

describe("Analytics Service", () => {
  describe("AnalyticsService", () => {
    it("should get dashboard metrics", async () => {
      const metrics = await AnalyticsService.getDashboardMetrics();
      
      expect(metrics.totalUsers).toBeGreaterThan(0);
      expect(metrics.activeUsers).toBeGreaterThan(0);
      expect(metrics.totalRevenue).toBeGreaterThan(0);
      expect(metrics.churnRate).toBeGreaterThan(0);
      expect(metrics.churnRate).toBeLessThan(1);
      expect(metrics.nps).toBeGreaterThanOrEqual(0);
      expect(metrics.nps).toBeLessThanOrEqual(100);
    });

      it("should predict churn", async () => {
      const prediction = await AnalyticsService.predictChurn(1, {
        lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        consultationCount: 5,
        totalSpent: 500,
        daysInactive: 30
      });
      
      expect(prediction.churnRisk).toBeGreaterThanOrEqual(0);
      expect(prediction.churnRisk).toBeLessThanOrEqual(100);
      expect(Array.isArray(prediction.reasons)).toBe(true);
      expect(Array.isArray(prediction.recommendations)).toBe(true);
    }, 10000);

    it("should calculate LTV correctly", () => {
      const ltv = AnalyticsService.calculateLTV(150, 4, 12);
      
      expect(ltv).toBe(150 * 4 * 12);
      expect(ltv).toBeGreaterThan(0);
    });

    it("should calculate CAC correctly", () => {
      const cac = AnalyticsService.calculateCAC(50000, 1000);
      
      expect(cac).toBe(50);
    });

    it("should get user analytics", async () => {
      const analytics = await AnalyticsService.getUserAnalytics(1);
      
      expect(analytics.userId).toBe(1);
      expect(analytics.totalSpent).toBeGreaterThanOrEqual(0);
      expect(analytics.consultationCount).toBeGreaterThanOrEqual(0);
      expect(analytics.churnRisk).toBeGreaterThanOrEqual(0);
      expect(analytics.churnRisk).toBeLessThanOrEqual(100);
      expect(analytics.ltv).toBeGreaterThan(0);
    });

    it("should get professional analytics", async () => {
      const analytics = await AnalyticsService.getProfessionalAnalytics(1);
      
      expect(analytics.professionalId).toBe(1);
      expect(analytics.totalEarnings).toBeGreaterThanOrEqual(0);
      expect(analytics.consultationCount).toBeGreaterThanOrEqual(0);
      expect(analytics.averageRating).toBeGreaterThan(0);
      expect(analytics.averageRating).toBeLessThanOrEqual(5);
      expect(analytics.conversionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.conversionRate).toBeLessThanOrEqual(1);
    });

    it("should generate insights", async () => {
      const metrics = await AnalyticsService.getDashboardMetrics();
      const insights = await AnalyticsService.generateInsights(metrics);
      
      expect(Array.isArray(insights)).toBe(true);
    }, 10000);

    it("should predict revenue", async () => {
      const prediction = await AnalyticsService.predictRevenue(
        [1000000, 1200000, 1300000],
        0.1
      );
      
      expect(prediction.predictedRevenue).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(prediction.factors)).toBe(true);
    }, 10000);

    it("should get cohort analysis", async () => {
      const cohorts = await AnalyticsService.getCohortAnalysis();
      
      expect(Array.isArray(cohorts)).toBe(true);
      if (cohorts.length > 0) {
        expect(cohorts[0]).toHaveProperty("cohort");
        expect(cohorts[0]).toHaveProperty("size");
        expect(cohorts[0]).toHaveProperty("retention");
        expect(cohorts[0]).toHaveProperty("ltv");
      }
    });

    it("should get funnel analysis", async () => {
      const funnel = await AnalyticsService.getFunnelAnalysis();
      
      expect(Array.isArray(funnel)).toBe(true);
      expect(funnel.length).toBeGreaterThan(0);
      expect(funnel[0]).toHaveProperty("stage");
      expect(funnel[0]).toHaveProperty("users");
      expect(funnel[0]).toHaveProperty("conversionRate");
    });
  });

  describe("RealtimeDashboardService", () => {
    let service: RealtimeDashboardService;

    beforeAll(() => {
      service = new RealtimeDashboardService();
    });

    it("should start and stop real-time updates", () => {
      service.startUpdates(1000);
      expect(service.getMetrics()).toBeNull(); // No update yet
      service.stopUpdates();
    });

    it("should get metrics with predictions", async () => {
      const metrics = await service.getMetricsWithPredictions();
      
      expect(metrics).toHaveProperty("totalUsers");
      expect(metrics).toHaveProperty("predictedNextMonthRevenue");
      expect(metrics).toHaveProperty("insights");
      expect(Array.isArray(metrics.insights)).toBe(true);
    }, 15000);
  });

  describe("ABTestingService", () => {
    it("should create A/B test", async () => {
      const test = await ABTestingService.createTest(
        "Test CTA Button",
        "Buy Now",
        "Start Investing",
        1000
      );
      
      expect(test.testId).toBeDefined();
      expect(test.status).toBe("running");
      expect(test.createdAt).toBeInstanceOf(Date);
    });

    it("should get test results", async () => {
      const results = await ABTestingService.getTestResults("test_123");
      
      expect(results.testId).toBe("test_123");
      expect(results).toHaveProperty("variantA");
      expect(results).toHaveProperty("variantB");
      expect(results).toHaveProperty("winner");
      expect(results).toHaveProperty("confidence");
      expect(["A", "B", "tie"]).toContain(results.winner);
      expect(results.confidence).toBeGreaterThanOrEqual(0);
      expect(results.confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe("Integration Tests", () => {
  it("should calculate complete reputation score for professional", async () => {
    const profile = await ReputationService.generateProfessionalProfile(1);
    const score = ReputationService.calculateTrustScore(profile);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should correlate professional reputation with analytics", async () => {
    const profile = await ReputationService.generateProfessionalProfile(1);
    const analytics = await AnalyticsService.getProfessionalAnalytics(1);
    
    // Higher reputation should correlate with better analytics
    if (profile.trustScore > 80) {
      expect(analytics.conversionRate).toBeGreaterThan(0.5);
    }
  });

  it("should predict churn based on user engagement", async () => {
    const analytics = await AnalyticsService.getUserAnalytics(1);
    const prediction = await AnalyticsService.predictChurn(1, {
      lastActive: analytics.lastActive,
      consultationCount: analytics.consultationCount,
      totalSpent: analytics.totalSpent,
      daysInactive: Math.floor((Date.now() - analytics.lastActive.getTime()) / (24 * 60 * 60 * 1000))
    });
    
    expect(prediction.churnRisk).toBeGreaterThanOrEqual(0);
    expect(prediction.churnRisk).toBeLessThanOrEqual(100);
  });
});
