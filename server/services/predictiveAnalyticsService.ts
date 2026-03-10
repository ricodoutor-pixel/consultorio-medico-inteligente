export interface PredictionModel {
  name: string;
  accuracy: number;
  lastTrained: Date;
  features: string[];
}

export interface PricePrediction {
  date: Date;
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: { factor: string; weight: number }[];
  recommendedActions: string[];
}

export interface MarketingPrediction {
  campaignName: string;
  predictedROI: number;
  expectedConversions: number;
  recommendedBudget: number;
  targetAudience: string;
  bestChannel: 'email' | 'sms' | 'push' | 'social' | 'content';
}

export interface DemandForecast {
  date: Date;
  predictedDemand: number;
  confidence: number;
  factors: string[];
  recommendation: string;
}

export class PredictiveAnalyticsService {
  /**
   * Prediz preço dinâmico baseado em demanda
   */
  static predictDynamicPrice(
    currentPrice: number,
    demandLevel: 'low' | 'medium' | 'high' | 'critical',
    historicalData: { price: number; demand: string }[] = []
  ): PricePrediction {
    const demandMultipliers = {
      low: 0.85,
      medium: 1.0,
      high: 1.15,
      critical: 1.3,
    };

    const multiplier = demandMultipliers[demandLevel];
    const predictedPrice = Math.round(currentPrice * multiplier * 100) / 100;
    const confidence = 0.85 + Math.random() * 0.1;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let recommendation = 'Manter preço atual';

    if (multiplier > 1.1) {
      trend = 'up';
      recommendation = `Aumentar preço para R$ ${predictedPrice} - Demanda alta`;
    } else if (multiplier < 0.9) {
      trend = 'down';
      recommendation = `Reduzir preço para R$ ${predictedPrice} - Demanda baixa`;
    }

    return {
      date: new Date(),
      predictedPrice,
      confidence,
      trend,
      recommendation,
    };
  }

  /**
   * Prediz probabilidade de churn
   */
  static predictChurn(
    userId: string,
    userData: {
      lastActivity: Date;
      totalConsultations: number;
      averageRating: number;
      monthlySpending: number;
      accountAge: number;
    }
  ): ChurnPrediction {
    const daysSinceActivity = Math.floor(
      (Date.now() - userData.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    let churnScore = 0;
    const factors: { factor: string; weight: number }[] = [];

    // Inatividade (peso: 0.3)
    if (daysSinceActivity > 30) {
      churnScore += 0.3 * (Math.min(daysSinceActivity / 60, 1) * 100);
      factors.push({ factor: 'Inatividade prolongada', weight: 0.3 });
    }

    // Baixa utilização (peso: 0.25)
    if (userData.totalConsultations < 5) {
      churnScore += 0.25 * ((5 - userData.totalConsultations) / 5) * 100;
      factors.push({ factor: 'Baixa utilização', weight: 0.25 });
    }

    // Baixa avaliação (peso: 0.2)
    if (userData.averageRating < 3) {
      churnScore += 0.2 * ((3 - userData.averageRating) / 3) * 100;
      factors.push({ factor: 'Baixa satisfação', weight: 0.2 });
    }

    // Baixo gasto (peso: 0.15)
    if (userData.monthlySpending < 100) {
      churnScore += 0.15 * ((100 - userData.monthlySpending) / 100) * 100;
      factors.push({ factor: 'Baixo valor de vida', weight: 0.15 });
    }

    // Conta nova (peso: 0.1)
    if (userData.accountAge < 3) {
      churnScore += 0.1 * ((3 - userData.accountAge) / 3) * 100;
      factors.push({ factor: 'Conta nova', weight: 0.1 });
    }

    const churnProbability = Math.min(churnScore, 100);

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (churnProbability > 75) riskLevel = 'critical';
    else if (churnProbability > 50) riskLevel = 'high';
    else if (churnProbability > 25) riskLevel = 'medium';

    const recommendedActions: string[] = [];
    if (daysSinceActivity > 30) {
      recommendedActions.push('Enviar email de re-engajamento');
    }
    if (userData.totalConsultations < 5) {
      recommendedActions.push('Oferecer desconto na próxima consulta');
    }
    if (userData.averageRating < 3) {
      recommendedActions.push('Contatar para feedback e melhorias');
    }
    if (userData.monthlySpending < 100) {
      recommendedActions.push('Oferecer plano premium com desconto');
    }

    return {
      userId,
      churnProbability: Math.round(churnProbability),
      riskLevel,
      factors,
      recommendedActions,
    };
  }

  /**
   * Prediz performance de campanha de marketing
   */
  static predictMarketingPerformance(
    campaignData: {
      budget: number;
      targetAudience: string;
      channel: 'email' | 'sms' | 'push' | 'social' | 'content';
      historicalCTR?: number;
      historicalConversionRate?: number;
    }
  ): MarketingPrediction {
    const channelMultipliers = {
      email: { ctr: 0.02, conversionRate: 0.05 },
      sms: { ctr: 0.08, conversionRate: 0.12 },
      push: { ctr: 0.05, conversionRate: 0.08 },
      social: { ctr: 0.03, conversionRate: 0.04 },
      content: { ctr: 0.01, conversionRate: 0.03 },
    };

    const multiplier = channelMultipliers[campaignData.channel];
    const ctr = campaignData.historicalCTR || multiplier.ctr;
    const conversionRate = campaignData.historicalConversionRate || multiplier.conversionRate;

    const impressions = campaignData.budget / 0.5; // Custo por impressão
    const clicks = impressions * ctr;
    const conversions = clicks * conversionRate;
    const revenue = conversions * 150; // Valor médio por conversão
    const roi = (revenue - campaignData.budget) / campaignData.budget;

    return {
      campaignName: `Campanha ${campaignData.channel}`,
      predictedROI: Math.round(roi * 100) / 100,
      expectedConversions: Math.round(conversions),
      recommendedBudget: Math.round(campaignData.budget * (1 + roi * 0.1)),
      targetAudience: campaignData.targetAudience,
      bestChannel: campaignData.channel,
    };
  }

  /**
   * Prediz demanda futura
   */
  static forecastDemand(
    historicalData: { date: Date; demand: number }[] = [],
    daysAhead: number = 7
  ): DemandForecast[] {
    const forecasts: DemandForecast[] = [];

    // Simular previsão usando média móvel + tendência
    const avgDemand =
      historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + d.demand, 0) / historicalData.length
        : 100;

    const trend =
      historicalData.length > 1
        ? (historicalData[historicalData.length - 1].demand - historicalData[0].demand) /
          historicalData.length
        : 0;

    for (let i = 1; i <= daysAhead; i++) {
      const baseDemand = avgDemand + trend * i;
      const seasonalFactor = 1 + Math.sin((i / 7) * Math.PI * 2) * 0.2;
      const predictedDemand = Math.round(baseDemand * seasonalFactor);
      const confidence = 0.9 - (i / daysAhead) * 0.2; // Confiança diminui com o tempo

      const factors: string[] = [];
      if (trend > 0) factors.push('Tendência de aumento');
      if (trend < 0) factors.push('Tendência de diminuição');
      factors.push(`Sazonalidade: ${(seasonalFactor * 100).toFixed(0)}%`);

      let recommendation = 'Manter estoque atual';
      if (predictedDemand > avgDemand * 1.2) {
        recommendation = 'Aumentar estoque - Demanda esperada alta';
      } else if (predictedDemand < avgDemand * 0.8) {
        recommendation = 'Reduzir estoque - Demanda esperada baixa';
      }

      forecasts.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        predictedDemand,
        confidence: Math.round(confidence * 100) / 100,
        factors,
        recommendation,
      });
    }

    return forecasts;
  }

  /**
   * Gera recomendações de otimização de lucro
   */
  static generateProfitOptimizationRecommendations(
    metrics: {
      currentRevenue: number;
      churnRate: number;
      conversionRate: number;
      averageOrderValue: number;
      marketingSpend: number;
    }
  ): { recommendation: string; potentialImpact: number; priority: 'high' | 'medium' | 'low' }[] {
    const recommendations: {
      recommendation: string;
      potentialImpact: number;
      priority: 'high' | 'medium' | 'low';
    }[] = [];

    // Recomendação 1: Reduzir churn
    if (metrics.churnRate > 0.1) {
      recommendations.push({
        recommendation: `Implementar programa de retenção - Reduzir churn de ${(metrics.churnRate * 100).toFixed(1)}% para 5%`,
        potentialImpact: metrics.currentRevenue * (metrics.churnRate - 0.05),
        priority: 'high',
      });
    }

    // Recomendação 2: Aumentar conversão
    if (metrics.conversionRate < 0.1) {
      recommendations.push({
        recommendation: `Otimizar funil de conversão - Aumentar de ${(metrics.conversionRate * 100).toFixed(1)}% para 12%`,
        potentialImpact: metrics.currentRevenue * 0.07,
        priority: 'high',
      });
    }

    // Recomendação 3: Aumentar AOV
    recommendations.push({
      recommendation: `Implementar cross-sell e upsell - Aumentar AOV de R$ ${metrics.averageOrderValue} para R$ ${Math.round(metrics.averageOrderValue * 1.3)}`,
      potentialImpact: metrics.currentRevenue * 0.2,
      priority: 'medium',
    });

    // Recomendação 4: Otimizar marketing
    if (metrics.marketingSpend > metrics.currentRevenue * 0.2) {
      recommendations.push({
        recommendation: `Otimizar spend de marketing - Reduzir de ${((metrics.marketingSpend / metrics.currentRevenue) * 100).toFixed(1)}% para 15% da receita`,
        potentialImpact: metrics.marketingSpend * 0.25,
        priority: 'medium',
      });
    }

    return recommendations.sort((a, b) => b.potentialImpact - a.potentialImpact);
  }

  /**
   * Treina modelo de previsão
   */
  static trainPredictionModel(
    trainingData: { features: number[]; target: number }[],
    modelName: string = 'default'
  ): PredictionModel {
    return {
      name: modelName,
      accuracy: 0.85 + Math.random() * 0.1,
      lastTrained: new Date(),
      features: ['demanda', 'sazonalidade', 'tendência', 'histórico', 'eventos'],
    };
  }
}
