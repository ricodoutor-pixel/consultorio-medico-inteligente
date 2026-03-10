// ============================================================================
// ADVANCED MONITORING SERVICE — Monitoramento Avançado com Alertas
// Planta & Raiz 3.0 — Real-time Anomaly Detection
// ============================================================================

import { notifyOwner } from '../_core/notification';

interface MetricThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

interface Alert {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  resolved: boolean;
}

interface SystemMetrics {
  uptime: number;
  errorRate: number;
  responseTimeP95: number;
  responseTimeP99: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseConnections: number;
  cacheHitRate: number;
  paymentSuccessRate: number;
}

class AdvancedMonitoringService {
  private alerts: Map<string, Alert> = new Map();
  private metrics: SystemMetrics = {
    uptime: 99.8,
    errorRate: 0.2,
    responseTimeP95: 245,
    responseTimeP99: 412,
    activeUsers: 1245,
    memoryUsage: 45,
    cpuUsage: 32,
    databaseConnections: 25,
    cacheHitRate: 87,
    paymentSuccessRate: 99.8,
  };

  private thresholds: MetricThreshold[] = [
    { metric: 'uptime', warning: 99.5, critical: 99, unit: '%' },
    { metric: 'errorRate', warning: 1, critical: 5, unit: '%' },
    { metric: 'responseTimeP95', warning: 1000, critical: 2000, unit: 'ms' },
    { metric: 'responseTimeP99', warning: 2000, critical: 5000, unit: 'ms' },
    { metric: 'memoryUsage', warning: 80, critical: 95, unit: '%' },
    { metric: 'cpuUsage', warning: 80, critical: 95, unit: '%' },
    { metric: 'databaseConnections', warning: 80, critical: 95, unit: '%' },
    { metric: 'cacheHitRate', warning: 70, critical: 50, unit: '%' },
    { metric: 'paymentSuccessRate', warning: 99, critical: 95, unit: '%' },
  ];

  /**
   * Inicializar monitoramento
   */
  public async initialize(): Promise<void> {
    console.log('[AdvancedMonitoring] Initializing...');

    // Monitorar a cada 60 segundos
    setInterval(() => this.checkMetrics(), 60000);

    // Monitorar pagamentos a cada 30 segundos
    setInterval(() => this.monitorPayments(), 30000);

    // Monitorar segurança a cada 5 minutos
    setInterval(() => this.monitorSecurity(), 300000);

    // Limpar alertas resolvidos a cada 24 horas
    setInterval(() => this.cleanupResolvedAlerts(), 86400000);

    console.log('[AdvancedMonitoring] Initialized');
  }

  /**
   * Verificar métricas do sistema
   */
  private async checkMetrics(): Promise<void> {
    try {
      // Atualizar métricas (simulado)
      this.metrics = {
        uptime: 99.8 + (Math.random() - 0.5) * 0.5,
        errorRate: 0.2 + (Math.random() - 0.5) * 0.3,
        responseTimeP95: 245 + (Math.random() - 0.5) * 100,
        responseTimeP99: 412 + (Math.random() - 0.5) * 200,
        activeUsers: Math.floor(1245 + (Math.random() - 0.5) * 500),
        memoryUsage: 45 + (Math.random() - 0.5) * 20,
        cpuUsage: 32 + (Math.random() - 0.5) * 30,
        databaseConnections: 25 + (Math.random() - 0.5) * 10,
        cacheHitRate: 87 + (Math.random() - 0.5) * 10,
        paymentSuccessRate: 99.8 + (Math.random() - 0.5) * 0.5,
      };

      // Verificar limites
      this.validateMetrics();
    } catch (error) {
      console.error('[AdvancedMonitoring] Metric check failed:', error);
    }
  }

  /**
   * Validar métricas contra limites
   */
  private validateMetrics(): void {
    for (const threshold of this.thresholds) {
      const value = this.metrics[threshold.metric as keyof SystemMetrics];

      if (value === undefined) continue;

      const alertId = `${threshold.metric}-${Date.now()}`;

      // Verificar crítico
      if (
        (threshold.metric === 'cacheHitRate' || threshold.metric === 'paymentSuccessRate')
          ? value < threshold.critical
          : value > threshold.critical
      ) {
        this.createAlert(alertId, 'critical', threshold.metric, value, threshold.critical);
      }
      // Verificar aviso
      else if (
        (threshold.metric === 'cacheHitRate' || threshold.metric === 'paymentSuccessRate')
          ? value < threshold.warning
          : value > threshold.warning
      ) {
        this.createAlert(alertId, 'warning', threshold.metric, value, threshold.warning);
      }
    }
  }

  /**
   * Monitorar sistema de pagamentos
   */
  private async monitorPayments(): Promise<void> {
    try {
      // Verificar transações falhadas
      const failedTransactions = await this.getFailedTransactions();

      if (failedTransactions > 5) {
        await notifyOwner({
          title: '⚠️ Transações Falhadas Detectadas',
          content: `${failedTransactions} transações falharam nos últimos 30 minutos. Verifique o status do Mercado Pago.`,
        });
      }

      // Verificar padrões anormais
      const anomalies = await this.detectPaymentAnomalies();

      if (anomalies.length > 0) {
        await notifyOwner({
          title: '🔍 Anomalias de Pagamento Detectadas',
          content: `${anomalies.length} anomalias detectadas: ${anomalies.join(', ')}`,
        });
      }
    } catch (error) {
      console.error('[AdvancedMonitoring] Payment monitoring failed:', error);
    }
  }

  /**
   * Monitorar segurança
   */
  private async monitorSecurity(): Promise<void> {
    try {
      // Verificar tentativas de login falhadas
      const failedLogins = await this.getFailedLoginAttempts();

      if (failedLogins > 10) {
        await notifyOwner({
          title: '🔒 Tentativas de Login Suspeitas',
          content: `${failedLogins} tentativas de login falharam. Possível ataque de força bruta.`,
        });
      }

      // Verificar certificado SSL
      const sslStatus = await this.checkSSLCertificate();

      if (sslStatus.expiresIn < 30) {
        await notifyOwner({
          title: '⚠️ Certificado SSL Expirando',
          content: `Certificado SSL expira em ${sslStatus.expiresIn} dias. Renove agora.`,
        });
      }

      // Verificar vulnerabilidades
      const vulnerabilities = await this.scanVulnerabilities();

      if (vulnerabilities.critical > 0) {
        await notifyOwner({
          title: '🚨 Vulnerabilidades Críticas Detectadas',
          content: `${vulnerabilities.critical} vulnerabilidades críticas encontradas. Ação imediata necessária.`,
        });
      }
    } catch (error) {
      console.error('[AdvancedMonitoring] Security monitoring failed:', error);
    }
  }

  /**
   * Criar alerta
   */
  private async createAlert(
    id: string,
    severity: 'info' | 'warning' | 'critical',
    metric: string,
    value: number,
    threshold: number
  ): Promise<void> {
    const alert: Alert = {
      id,
      timestamp: Date.now(),
      severity,
      metric,
      value,
      threshold,
      message: `${metric} is ${value} (threshold: ${threshold})`,
      resolved: false,
    };

    this.alerts.set(id, alert);

    // Notificar se crítico
    if (severity === 'critical') {
      await notifyOwner({
        title: `🚨 Alerta Crítico: ${metric}`,
        content: `${metric} atingiu ${value} (limite: ${threshold})`,
      });
    }

    console.log(`[AdvancedMonitoring] Alert created: ${id}`, alert);
  }

  /**
   * Obter transações falhadas
   */
  private async getFailedTransactions(): Promise<number> {
    // Simulado - em produção, consultar banco de dados
    return Math.floor(Math.random() * 10);
  }

  /**
   * Detectar anomalias de pagamento
   */
  private async detectPaymentAnomalies(): Promise<string[]> {
    const anomalies: string[] = [];

    // Verificar padrões anormais
    if (Math.random() > 0.95) {
      anomalies.push('Valor médio de transação anormalmente alto');
    }

    if (Math.random() > 0.95) {
      anomalies.push('Taxa de rejeição acima do normal');
    }

    if (Math.random() > 0.95) {
      anomalies.push('Padrão de transações suspeito detectado');
    }

    return anomalies;
  }

  /**
   * Obter tentativas de login falhadas
   */
  private async getFailedLoginAttempts(): Promise<number> {
    // Simulado - em produção, consultar banco de dados
    return Math.floor(Math.random() * 20);
  }

  /**
   * Verificar certificado SSL
   */
  private async checkSSLCertificate(): Promise<{ expiresIn: number }> {
    // Simulado - em produção, verificar certificado real
    return {
      expiresIn: Math.floor(Math.random() * 365),
    };
  }

  /**
   * Escanear vulnerabilidades
   */
  private async scanVulnerabilities(): Promise<{
    critical: number;
    high: number;
    medium: number;
  }> {
    // Simulado - em produção, usar Trivy ou similar
    return {
      critical: 0,
      high: 0,
      medium: 0,
    };
  }

  /**
   * Limpar alertas resolvidos
   */
  private cleanupResolvedAlerts(): void {
    const now = Date.now();
    const maxAge = 86400000; // 24 horas

    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && now - alert.timestamp > maxAge) {
        this.alerts.delete(id);
      }
    }

    console.log('[AdvancedMonitoring] Cleanup completed');
  }

  /**
   * Obter alertas ativos
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Obter métricas atuais
   */
  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * Resolver alerta
   */
  public resolveAlert(id: string): void {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.resolved = true;
      console.log(`[AdvancedMonitoring] Alert resolved: ${id}`);
    }
  }
}

// Exportar instância singleton
export const advancedMonitoringService = new AdvancedMonitoringService();
