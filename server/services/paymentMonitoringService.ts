// ============================================================================
// PAYMENT MONITORING SERVICE — ALERTAS INTELIGENTES
// Planta & Raiz 3.0 — Detecção de Anomalias em Tempo Real
// ============================================================================

import { db } from '../db';
import { notifyOwner } from '../_core/notification';
import { invokeLLM } from '../_core/llm';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface PaymentAnomaly {
  id: string;
  type: 'fraud' | 'unusual_amount' | 'failed_retry' | 'high_decline_rate' | 'velocity_check' | 'geographic_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  paymentId: string;
  doctorId: string;
  patientId: string;
  amount: number;
  description: string;
  detectedAt: Date;
  resolved: boolean;
  action?: string;
}

export interface PaymentMetrics {
  totalPayments: number;
  successRate: number;
  averageAmount: number;
  medianAmount: number;
  standardDeviation: number;
  declineRate: number;
  retryRate: number;
  fraudRate: number;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: PaymentMetrics, payment: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: (anomaly: PaymentAnomaly) => Promise<void>;
  enabled: boolean;
}

// ============================================================================
// PAYMENT MONITORING SERVICE
// ============================================================================

export class PaymentMonitoringService {
  private anomalies: Map<string, PaymentAnomaly> = new Map();
  private metrics: PaymentMetrics | null = null;
  private alertRules: AlertRule[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAlertRules();
  }

  /**
   * Inicializar regras de alerta
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_amount_alert',
        name: 'Alerta de Valor Alto',
        condition: (metrics, payment) => payment.amount > metrics.averageAmount + 3 * metrics.standardDeviation,
        severity: 'high',
        action: this.handleHighAmountAlert.bind(this),
        enabled: true,
      },
      {
        id: 'unusual_pattern_alert',
        name: 'Alerta de Padrão Inusitado',
        condition: (metrics, payment) => {
          const zScore = (payment.amount - metrics.averageAmount) / metrics.standardDeviation;
          return Math.abs(zScore) > 2.5;
        },
        severity: 'medium',
        action: this.handleUnusualPatternAlert.bind(this),
        enabled: true,
      },
      {
        id: 'high_decline_rate_alert',
        name: 'Alerta de Taxa Alta de Recusas',
        condition: (metrics) => metrics.declineRate > 0.15,
        severity: 'high',
        action: this.handleHighDeclineRateAlert.bind(this),
        enabled: true,
      },
      {
        id: 'fraud_detection_alert',
        name: 'Alerta de Possível Fraude',
        condition: (metrics) => metrics.fraudRate > 0.05,
        severity: 'critical',
        action: this.handleFraudDetectionAlert.bind(this),
        enabled: true,
      },
      {
        id: 'velocity_check_alert',
        name: 'Alerta de Velocidade Anormal',
        condition: (metrics, payment) => payment.velocityScore > 0.8,
        severity: 'high',
        action: this.handleVelocityCheckAlert.bind(this),
        enabled: true,
      },
    ];
  }

  /**
   * Iniciar monitoramento contínuo
   */
  public startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, intervalMs);

    console.log(`[PaymentMonitoring] Monitoramento iniciado (intervalo: ${intervalMs}ms)`);
  }

  /**
   * Parar monitoramento
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[PaymentMonitoring] Monitoramento parado');
    }
  }

  /**
   * Executar ciclo de monitoramento
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // 1. Calcular métricas
      this.metrics = await this.calculateMetrics();

      // 2. Buscar pagamentos recentes
      const recentPayments = await this.getRecentPayments(5); // Últimos 5 minutos

      // 3. Verificar cada pagamento contra regras
      for (const payment of recentPayments) {
        await this.checkPaymentAgainstRules(payment);
      }

      // 4. Verificar anomalias resolvidas
      await this.checkResolvedAnomalies();

      // 5. Gerar relatório de saúde
      await this.generateHealthReport();
    } catch (error) {
      console.error('[PaymentMonitoring] Erro no ciclo de monitoramento:', error);
    }
  }

  /**
   * Calcular métricas de pagamento
   */
  private async calculateMetrics(): Promise<PaymentMetrics> {
    try {
      // Buscar últimos 100 pagamentos
      const payments = await this.getLastPayments(100);

      if (payments.length === 0) {
        return {
          totalPayments: 0,
          successRate: 0,
          averageAmount: 0,
          medianAmount: 0,
          standardDeviation: 0,
          declineRate: 0,
          retryRate: 0,
          fraudRate: 0,
        };
      }

      const amounts = payments.map((p) => p.amount);
      const successCount = payments.filter((p) => p.status === 'approved').length;
      const declineCount = payments.filter((p) => p.status === 'declined').length;
      const retryCount = payments.filter((p) => p.retryCount > 0).length;
      const fraudCount = payments.filter((p) => p.fraudDetected).length;

      // Calcular estatísticas
      const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const median = this.calculateMedian(amounts);
      const stdDev = this.calculateStandardDeviation(amounts, average);

      return {
        totalPayments: payments.length,
        successRate: successCount / payments.length,
        averageAmount: average,
        medianAmount: median,
        standardDeviation: stdDev,
        declineRate: declineCount / payments.length,
        retryRate: retryCount / payments.length,
        fraudRate: fraudCount / payments.length,
      };
    } catch (error) {
      console.error('[PaymentMonitoring] Erro ao calcular métricas:', error);
      return {
        totalPayments: 0,
        successRate: 0,
        averageAmount: 0,
        medianAmount: 0,
        standardDeviation: 0,
        declineRate: 0,
        retryRate: 0,
        fraudRate: 0,
      };
    }
  }

  /**
   * Verificar pagamento contra regras de alerta
   */
  private async checkPaymentAgainstRules(payment: any): Promise<void> {
    if (!this.metrics) return;

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(this.metrics, payment)) {
          const anomaly: PaymentAnomaly = {
            id: `ANOM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.getAnomalyType(rule.name),
            severity: rule.severity,
            paymentId: payment.id,
            doctorId: payment.doctorId,
            patientId: payment.patientId,
            amount: payment.amount,
            description: `Regra disparada: ${rule.name}`,
            detectedAt: new Date(),
            resolved: false,
          };

          // Adicionar à lista de anomalias
          this.anomalies.set(anomaly.id, anomaly);

          // Executar ação
          await rule.action(anomaly);

          // Registrar em banco de dados
          await this.recordAnomaly(anomaly);
        }
      } catch (error) {
        console.error(`[PaymentMonitoring] Erro ao verificar regra ${rule.name}:`, error);
      }
    }
  }

  /**
   * Obter tipo de anomalia
   */
  private getAnomalyType(ruleName: string): PaymentAnomaly['type'] {
    if (ruleName.includes('Valor Alto')) return 'unusual_amount';
    if (ruleName.includes('Padrão')) return 'unusual_amount';
    if (ruleName.includes('Recusas')) return 'high_decline_rate';
    if (ruleName.includes('Fraude')) return 'fraud';
    if (ruleName.includes('Velocidade')) return 'velocity_check';
    return 'unusual_amount';
  }

  /**
   * Manipular alerta de valor alto
   */
  private async handleHighAmountAlert(anomaly: PaymentAnomaly): Promise<void> {
    console.warn(`[Alert] Valor alto detectado: R$ ${anomaly.amount}`);

    await notifyOwner({
      title: '⚠️ Alerta de Valor Alto',
      content: `Pagamento de R$ ${anomaly.amount} detectado. Médico: ${anomaly.doctorId}. Valor acima de 3σ da média.`,
    });
  }

  /**
   * Manipular alerta de padrão inusitado
   */
  private async handleUnusualPatternAlert(anomaly: PaymentAnomaly): Promise<void> {
    console.warn(`[Alert] Padrão inusitado detectado: R$ ${anomaly.amount}`);

    await notifyOwner({
      title: '⚠️ Alerta de Padrão Inusitado',
      content: `Pagamento com padrão inusitado: R$ ${anomaly.amount}. Médico: ${anomaly.doctorId}.`,
    });
  }

  /**
   * Manipular alerta de taxa alta de recusas
   */
  private async handleHighDeclineRateAlert(anomaly: PaymentAnomaly): Promise<void> {
    console.error(`[Alert] Taxa alta de recusas detectada`);

    await notifyOwner({
      title: '🚨 Alerta Crítico: Taxa Alta de Recusas',
      content: `Taxa de recusas acima de 15%. Investigação imediata recomendada.`,
    });
  }

  /**
   * Manipular alerta de fraude
   */
  private async handleFraudDetectionAlert(anomaly: PaymentAnomaly): Promise<void> {
    console.error(`[Alert] Possível fraude detectada: ${anomaly.paymentId}`);

    await notifyOwner({
      title: '🚨 ALERTA CRÍTICO: Possível Fraude',
      content: `Possível fraude detectada no pagamento ${anomaly.paymentId}. Ação imediata recomendada.`,
    });

    // Bloquear pagamento
    anomaly.action = 'BLOCKED';
  }

  /**
   * Manipular alerta de velocidade anormal
   */
  private async handleVelocityCheckAlert(anomaly: PaymentAnomaly): Promise<void> {
    console.warn(`[Alert] Velocidade anormal detectada: ${anomaly.paymentId}`);

    await notifyOwner({
      title: '⚠️ Alerta de Velocidade Anormal',
      content: `Múltiplos pagamentos em curto período. Pagamento: ${anomaly.paymentId}.`,
    });
  }

  /**
   * Verificar anomalias resolvidas
   */
  private async checkResolvedAnomalies(): Promise<void> {
    for (const [id, anomaly] of this.anomalies) {
      if (anomaly.resolved) continue;

      // Verificar se a anomalia foi resolvida (ex: pagamento bem-sucedido após retry)
      const payment = await this.getPayment(anomaly.paymentId);

      if (payment && payment.status === 'approved') {
        anomaly.resolved = true;
        console.log(`[PaymentMonitoring] Anomalia resolvida: ${id}`);
      }
    }
  }

  /**
   * Gerar relatório de saúde
   */
  private async generateHealthReport(): Promise<void> {
    if (!this.metrics) return;

    const unresolvedAnomalies = Array.from(this.anomalies.values()).filter((a) => !a.resolved);

    if (unresolvedAnomalies.length > 0) {
      const criticalCount = unresolvedAnomalies.filter((a) => a.severity === 'critical').length;

      if (criticalCount > 0) {
        console.error(`[Health] ${criticalCount} anomalias críticas não resolvidas`);

        await notifyOwner({
          title: '🚨 Relatório de Saúde do Sistema',
          content: `${criticalCount} anomalias críticas detectadas. Taxa de sucesso: ${(this.metrics.successRate * 100).toFixed(2)}%. Taxa de recusas: ${(this.metrics.declineRate * 100).toFixed(2)}%.`,
        });
      }
    }
  }

  /**
   * Registrar anomalia no banco de dados
   */
  private async recordAnomaly(anomaly: PaymentAnomaly): Promise<void> {
    try {
      // Implementar gravação em banco de dados
      console.log(`[PaymentMonitoring] Anomalia registrada: ${anomaly.id}`);
    } catch (error) {
      console.error('[PaymentMonitoring] Erro ao registrar anomalia:', error);
    }
  }

  /**
   * Obter pagamentos recentes
   */
  private async getRecentPayments(minutes: number): Promise<any[]> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);
      // Implementar busca em banco de dados
      return [];
    } catch (error) {
      console.error('[PaymentMonitoring] Erro ao obter pagamentos recentes:', error);
      return [];
    }
  }

  /**
   * Obter últimos N pagamentos
   */
  private async getLastPayments(count: number): Promise<any[]> {
    try {
      // Implementar busca em banco de dados
      return [];
    } catch (error) {
      console.error('[PaymentMonitoring] Erro ao obter últimos pagamentos:', error);
      return [];
    }
  }

  /**
   * Obter pagamento específico
   */
  private async getPayment(paymentId: string): Promise<any | null> {
    try {
      // Implementar busca em banco de dados
      return null;
    } catch (error) {
      console.error('[PaymentMonitoring] Erro ao obter pagamento:', error);
      return null;
    }
  }

  /**
   * Calcular mediana
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calcular desvio padrão
   */
  private calculateStandardDeviation(values: number[], average: number): number {
    const squareDiffs = values.map((value) => Math.pow(value - average, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Obter anomalias não resolvidas
   */
  public getUnresolvedAnomalies(): PaymentAnomaly[] {
    return Array.from(this.anomalies.values()).filter((a) => !a.resolved);
  }

  /**
   * Obter métricas atuais
   */
  public getCurrentMetrics(): PaymentMetrics | null {
    return this.metrics;
  }

  /**
   * Obter relatório de anomalias
   */
  public getAnomalyReport(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    unresolved: number;
  } {
    const allAnomalies = Array.from(this.anomalies.values());
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const anomaly of allAnomalies) {
      byType[anomaly.type] = (byType[anomaly.type] || 0) + 1;
      bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
    }

    return {
      total: allAnomalies.length,
      byType,
      bySeverity,
      unresolved: allAnomalies.filter((a) => !a.resolved).length,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const paymentMonitoringService = new PaymentMonitoringService();
