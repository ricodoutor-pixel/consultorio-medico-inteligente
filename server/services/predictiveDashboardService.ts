/**
 * Serviço de Dashboard de Análise Preditiva
 * Fornece gráficos, previsões e insights baseados em dados históricos
 */

export interface PredictiveMetrics {
  timestamp: Date;
  predictedPrice: number;
  predictedDemand: 'low' | 'medium' | 'high' | 'critical';
  predictedChurn: number; // 0-100%
  predictedROI: number; // percentual
  confidence: number; // 0-100%
}

export interface DashboardData {
  period: '24h' | '7d' | '30d';
  metrics: PredictiveMetrics[];
  summary: {
    avgPrice: number;
    avgDemand: string;
    avgChurn: number;
    avgROI: number;
  };
  trends: {
    priceDirection: 'up' | 'down' | 'stable';
    demandDirection: 'up' | 'down' | 'stable';
    churnDirection: 'up' | 'down' | 'stable';
    roiDirection: 'up' | 'down' | 'stable';
  };
}

export class PredictiveDashboardService {
  /**
   * Gerar dados de análise preditiva para período específico
   */
  static generatePredictiveData(period: '24h' | '7d' | '30d'): DashboardData {
    const now = new Date();
    const metrics: PredictiveMetrics[] = [];
    
    let dataPoints = 24; // 24h
    if (period === '7d') dataPoints = 7;
    if (period === '30d') dataPoints = 30;

    // Simular dados históricos com tendências
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(now.getTime() - (dataPoints - i) * (period === '24h' ? 3600000 : period === '7d' ? 86400000 : 86400000));
      
      // Preço com tendência de alta (simulado)
      const basePrice = 75 + Math.sin(i / dataPoints * Math.PI) * 20 + Math.random() * 10;
      
      // Demanda com padrão semanal
      const demandValue = 0.5 + Math.sin(i / dataPoints * Math.PI * 2) * 0.3 + Math.random() * 0.2;
      const demandMap = {
        0: 'low' as const,
        1: 'medium' as const,
        2: 'high' as const,
        3: 'critical' as const,
      };
      const demandLevel = Math.floor(demandValue * 4);
      
      // Churn com redução ao longo do tempo (programa de fidelização funcionando)
      const churnValue = 12 - (i / dataPoints) * 4 + Math.random() * 3;
      
      // ROI com melhoria
      const roiValue = 2.5 + (i / dataPoints) * 1.2 + Math.random() * 0.5;

      metrics.push({
        timestamp,
        predictedPrice: Math.round(basePrice * 100) / 100,
        predictedDemand: demandMap[Math.min(demandLevel, 3)],
        predictedChurn: Math.max(5, Math.round(churnValue * 100) / 100),
        predictedROI: Math.round(roiValue * 100) / 100,
        confidence: 75 + Math.random() * 20,
      });
    }

    // Calcular resumo
    const avgPrice = metrics.reduce((sum, m) => sum + m.predictedPrice, 0) / metrics.length;
    const avgChurn = metrics.reduce((sum, m) => sum + m.predictedChurn, 0) / metrics.length;
    const avgROI = metrics.reduce((sum, m) => sum + m.predictedROI, 0) / metrics.length;
    
    const demandCounts = {
      low: metrics.filter(m => m.predictedDemand === 'low').length,
      medium: metrics.filter(m => m.predictedDemand === 'medium').length,
      high: metrics.filter(m => m.predictedDemand === 'high').length,
      critical: metrics.filter(m => m.predictedDemand === 'critical').length,
    };
    const avgDemand = Object.entries(demandCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    // Calcular tendências
    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));
    
    const avgPriceFirst = firstHalf.reduce((sum, m) => sum + m.predictedPrice, 0) / firstHalf.length;
    const avgPriceSecond = secondHalf.reduce((sum, m) => sum + m.predictedPrice, 0) / secondHalf.length;
    
    const avgChurnFirst = firstHalf.reduce((sum, m) => sum + m.predictedChurn, 0) / firstHalf.length;
    const avgChurnSecond = secondHalf.reduce((sum, m) => sum + m.predictedChurn, 0) / secondHalf.length;
    
    const avgROIFirst = firstHalf.reduce((sum, m) => sum + m.predictedROI, 0) / firstHalf.length;
    const avgROISecond = secondHalf.reduce((sum, m) => sum + m.predictedROI, 0) / secondHalf.length;

    return {
      period,
      metrics,
      summary: {
        avgPrice: Math.round(avgPrice * 100) / 100,
        avgDemand,
        avgChurn: Math.round(avgChurn * 100) / 100,
        avgROI: Math.round(avgROI * 100) / 100,
      },
      trends: {
        priceDirection: avgPriceSecond > avgPriceFirst ? 'up' : avgPriceSecond < avgPriceFirst ? 'down' : 'stable',
        demandDirection: demandCounts.critical > 0 ? 'up' : 'stable',
        churnDirection: avgChurnSecond > avgChurnFirst ? 'up' : avgChurnSecond < avgChurnFirst ? 'down' : 'stable',
        roiDirection: avgROISecond > avgROIFirst ? 'up' : avgROISecond < avgROIFirst ? 'down' : 'stable',
      },
    };
  }

  /**
   * Exportar dados para CSV
   */
  static exportToCSV(data: DashboardData): string {
    let csv = 'Timestamp,Predicted Price,Predicted Demand,Predicted Churn (%),Predicted ROI,Confidence (%)\n';
    
    data.metrics.forEach(metric => {
      csv += `${metric.timestamp.toISOString()},${metric.predictedPrice},${metric.predictedDemand},${metric.predictedChurn},${metric.predictedROI},${metric.confidence}\n`;
    });

    return csv;
  }

  /**
   * Gerar recomendações baseadas em análise preditiva
   */
  static generateRecommendations(data: DashboardData): string[] {
    const recommendations: string[] = [];

    // Análise de preço
    if (data.trends.priceDirection === 'up') {
      recommendations.push('📈 Preço em alta: Considere aumentar a oferta de consultas');
    } else if (data.trends.priceDirection === 'down') {
      recommendations.push('📉 Preço em queda: Implemente promoções para manter receita');
    }

    // Análise de demanda
    if (data.summary.avgDemand === 'critical') {
      recommendations.push('🔥 Demanda crítica: Aumente equipe de médicos imediatamente');
    } else if (data.summary.avgDemand === 'low') {
      recommendations.push('❄️ Demanda baixa: Aumente investimento em marketing');
    }

    // Análise de churn
    if (data.trends.churnDirection === 'up') {
      recommendations.push('⚠️ Churn aumentando: Ative programa de retenção com incentivos');
    } else if (data.summary.avgChurn < 5) {
      recommendations.push('✅ Churn baixo: Mantenha estratégia atual');
    }

    // Análise de ROI
    if (data.trends.roiDirection === 'up') {
      recommendations.push('💰 ROI melhorando: Escale campanhas de marketing');
    } else if (data.trends.roiDirection === 'down') {
      recommendations.push('💸 ROI diminuindo: Revise custos operacionais');
    }

    return recommendations;
  }

  /**
   * Simular impacto de mudanças
   */
  static simulateScenario(
    currentData: DashboardData,
    scenario: 'aggressive_growth' | 'conservative' | 'balanced'
  ): DashboardData {
    const newMetrics = currentData.metrics.map(metric => ({
      ...metric,
      predictedPrice: scenario === 'aggressive_growth' 
        ? metric.predictedPrice * 1.15
        : scenario === 'conservative'
        ? metric.predictedPrice * 0.95
        : metric.predictedPrice,
      predictedChurn: scenario === 'aggressive_growth'
        ? metric.predictedChurn * 1.1
        : scenario === 'conservative'
        ? metric.predictedChurn * 0.8
        : metric.predictedChurn,
      predictedROI: scenario === 'aggressive_growth'
        ? metric.predictedROI * 1.25
        : scenario === 'conservative'
        ? metric.predictedROI * 0.9
        : metric.predictedROI,
    }));

    return {
      ...currentData,
      metrics: newMetrics,
      summary: {
        avgPrice: newMetrics.reduce((sum, m) => sum + m.predictedPrice, 0) / newMetrics.length,
        avgDemand: currentData.summary.avgDemand,
        avgChurn: newMetrics.reduce((sum, m) => sum + m.predictedChurn, 0) / newMetrics.length,
        avgROI: newMetrics.reduce((sum, m) => sum + m.predictedROI, 0) / newMetrics.length,
      },
    };
  }
}
