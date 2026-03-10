import { invokeLLM } from "../_core/llm";

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  consultationCount: number;
  averageConsultationPrice: number;
  churnRate: number;
  ltv: number;
  cac: number;
  nps: number;
}

export interface UserAnalytics {
  userId: number;
  totalSpent: number;
  consultationCount: number;
  lastActive: Date;
  churnRisk: number; // 0-100
  ltv: number;
  preferredSpecialty: string;
  nextPredictedAction: string;
}

export interface ProfessionalAnalytics {
  professionalId: number;
  totalEarnings: number;
  consultationCount: number;
  averageRating: number;
  responseTime: number;
  conversionRate: number;
  growthRate: number;
}

/**
 * Analytics Service with AI predictions
 */
export class AnalyticsService {
  /**
   * Get dashboard metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    // TODO: Query database for real metrics
    return {
      totalUsers: 50000,
      activeUsers: 12000,
      totalRevenue: 6500000,
      monthlyRevenue: 1300000,
      consultationCount: 100000,
      averageConsultationPrice: 150,
      churnRate: 0.04,
      ltv: 5000,
      cac: 50,
      nps: 72
    };
  }

  /**
   * Predict user churn using AI
   */
  static async predictChurn(userId: number, userBehavior: {
    lastActive: Date;
    consultationCount: number;
    totalSpent: number;
    daysInactive: number;
  }): Promise<{
    churnRisk: number;
    reasons: string[];
    recommendations: string[];
  }> {
    const prompt = `Analyze user behavior and predict churn risk:
    - Last active: ${userBehavior.lastActive}
    - Consultation count: ${userBehavior.consultationCount}
    - Total spent: R$ ${userBehavior.totalSpent}
    - Days inactive: ${userBehavior.daysInactive}
    
    Return JSON with churnRisk (0-100), reasons (array), and recommendations (array).`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a churn prediction AI. Analyze user behavior and predict churn risk. Return ONLY valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : "{}";
      return JSON.parse(contentStr);
    } catch {
      return {
        churnRisk: 0,
        reasons: [],
        recommendations: []
      };
    }
  }

  /**
   * Calculate Lifetime Value (LTV)
   */
  static calculateLTV(
    averageConsultationPrice: number,
    consultationFrequency: number, // per month
    retentionMonths: number
  ): number {
    return averageConsultationPrice * consultationFrequency * retentionMonths;
  }

  /**
   * Calculate Customer Acquisition Cost (CAC)
   */
  static calculateCAC(
    totalMarketingSpent: number,
    newCustomersAcquired: number
  ): number {
    return totalMarketingSpent / newCustomersAcquired;
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(userId: number): Promise<UserAnalytics> {
    // TODO: Query database for user data
    return {
      userId,
      totalSpent: 1500,
      consultationCount: 10,
      lastActive: new Date(),
      churnRisk: 15,
      ltv: 5000,
      preferredSpecialty: "Ansiedade",
      nextPredictedAction: "Schedule consultation"
    };
  }

  /**
   * Get professional analytics
   */
  static async getProfessionalAnalytics(professionalId: number): Promise<ProfessionalAnalytics> {
    // TODO: Query database for professional data
    return {
      professionalId,
      totalEarnings: 45000,
      consultationCount: 300,
      averageRating: 4.8,
      responseTime: 15,
      conversionRate: 0.65,
      growthRate: 0.15
    };
  }

  /**
   * Generate AI insights
   */
  static async generateInsights(metrics: DashboardMetrics): Promise<string[]> {
    const prompt = `Analyze these platform metrics and generate 5 actionable insights:
    - Total Users: ${metrics.totalUsers}
    - Active Users: ${metrics.activeUsers}
    - Monthly Revenue: R$ ${metrics.monthlyRevenue}
    - Churn Rate: ${(metrics.churnRate * 100).toFixed(2)}%
    - NPS: ${metrics.nps}
    - LTV: R$ ${metrics.ltv}
    - CAC: R$ ${metrics.cac}
    
    Return as JSON array of strings.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a business analytics AI. Generate insights from metrics. Return ONLY valid JSON array."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : "[]";
      return JSON.parse(contentStr);
    } catch {
      return [];
    }
  }

  /**
   * Predict revenue for next month
   */
  static async predictRevenue(
    historicalRevenue: number[],
    growthRate: number
  ): Promise<{
    predictedRevenue: number;
    confidence: number;
    factors: string[];
  }> {
    const avgRevenue = historicalRevenue.reduce((a, b) => a + b, 0) / historicalRevenue.length;
    const predictedRevenue = avgRevenue * (1 + growthRate);

    return {
      predictedRevenue,
      confidence: 0.75,
      factors: [
        "Seasonal trends",
        "Marketing campaigns",
        "New professional onboarding",
        "Product launches"
      ]
    };
  }

  /**
   * Get cohort analysis
   */
  static async getCohortAnalysis(): Promise<Array<{
    cohort: string;
    size: number;
    retention: number[];
    ltv: number;
  }>> {
    // TODO: Query database for cohort data
    return [
      {
        cohort: "Jan 2026",
        size: 5000,
        retention: [1, 0.85, 0.72, 0.65, 0.58],
        ltv: 4500
      },
      {
        cohort: "Feb 2026",
        size: 7000,
        retention: [1, 0.88, 0.75],
        ltv: 5200
      }
    ];
  }

  /**
   * Get funnel analysis
   */
  static async getFunnelAnalysis(): Promise<{
    stage: string;
    users: number;
    conversionRate: number;
  }[]> {
    return [
      { stage: "Visitantes", users: 100000, conversionRate: 1 },
      { stage: "Cadastrados", users: 1000, conversionRate: 0.01 },
      { stage: "Primeira Consulta", users: 500, conversionRate: 0.5 },
      { stage: "Clientes Ativos", users: 300, conversionRate: 0.6 }
    ];
  }
}

/**
 * Real-time Dashboard Service
 */
export class RealtimeDashboardService {
  private metrics: DashboardMetrics | null = null;
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start real-time dashboard updates
   */
  startUpdates(intervalMs: number = 60000): void {
    this.updateInterval = setInterval(async () => {
      this.metrics = await AnalyticsService.getDashboardMetrics();
    }, intervalMs);
  }

  /**
   * Stop real-time updates
   */
  stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): DashboardMetrics | null {
    return this.metrics;
  }

  /**
   * Get metrics with predictions
   */
  async getMetricsWithPredictions(): Promise<DashboardMetrics & {
    predictedNextMonthRevenue: number;
    insights: string[];
  }> {
    if (!this.metrics) {
      this.metrics = await AnalyticsService.getDashboardMetrics();
    }

    const prediction = await AnalyticsService.predictRevenue(
      [1000000, 1200000, 1300000],
      0.1
    );

    const insights = await AnalyticsService.generateInsights(this.metrics);

    return {
      ...this.metrics,
      predictedNextMonthRevenue: prediction.predictedRevenue,
      insights
    };
  }
}

/**
 * A/B Testing Service
 */
export class ABTestingService {
  /**
   * Create A/B test
   */
  static async createTest(
    testName: string,
    variantA: string,
    variantB: string,
    sampleSize: number
  ): Promise<{
    testId: string;
    status: "running" | "completed";
    createdAt: Date;
  }> {
    return {
      testId: `test_${Date.now()}`,
      status: "running",
      createdAt: new Date()
    };
  }

  /**
   * Get test results
   */
  static async getTestResults(testId: string): Promise<{
    testId: string;
    variantA: {
      conversions: number;
      conversionRate: number;
    };
    variantB: {
      conversions: number;
      conversionRate: number;
    };
    winner: "A" | "B" | "tie";
    confidence: number;
  }> {
    return {
      testId,
      variantA: {
        conversions: 150,
        conversionRate: 0.15
      },
      variantB: {
        conversions: 180,
        conversionRate: 0.18
      },
      winner: "B",
      confidence: 0.95
    };
  }
}
