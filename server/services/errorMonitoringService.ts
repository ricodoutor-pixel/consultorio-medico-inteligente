// ============================================================================
// ERROR MONITORING SERVICE — Sistema Centralizado de Monitoramento
// Planta & Raiz 3.0 — Alertas Inteligentes em Tempo Real
// ============================================================================

import { notifyOwner } from '../_core/notification';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info' | 'critical';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  endpoint?: string;
  statusCode?: number;
  resolved: boolean;
}

export interface ErrorAlert {
  id: string;
  errorId: string;
  type: 'crash' | 'performance' | 'security' | 'payment' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  notified: boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByType: Record<string, number>;
  crashRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  uptime: number;
  lastError?: ErrorLog;
}

// ============================================================================
// ERROR MONITORING SERVICE
// ============================================================================

class ErrorMonitoringService {
  private errorLogs: Map<string, ErrorLog> = new Map();
  private errorAlerts: Map<string, ErrorAlert> = new Map();
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByLevel: {},
    errorsByType: {},
    crashRate: 0,
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    uptime: 100,
  };

  private responseTimes: number[] = [];
  private startTime: number = Date.now();
  private maxLogs: number = 10000;

  /**
   * Registrar erro no sistema de monitoramento
   */
  public logError(error: Partial<ErrorLog>): ErrorLog {
    const errorLog: ErrorLog = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level: error.level || 'error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: error.context,
      userId: error.userId,
      endpoint: error.endpoint,
      statusCode: error.statusCode,
      resolved: false,
    };

    // Armazenar erro
    this.errorLogs.set(errorLog.id, errorLog);

    // Atualizar métricas
    this.updateMetrics(errorLog);

    // Criar alerta se necessário
    if (this.shouldCreateAlert(errorLog)) {
      this.createAlert(errorLog);
    }

    // Limpar logs antigos se necessário
    if (this.errorLogs.size > this.maxLogs) {
      this.cleanupOldLogs();
    }

    console.log(`[ErrorMonitoring] ${errorLog.level.toUpperCase()}: ${errorLog.message}`);

    return errorLog;
  }

  /**
   * Criar alerta para erro crítico
   */
  private createAlert(errorLog: ErrorLog): void {
    const alertType = this.determineAlertType(errorLog);
    const severity = this.determineSeverity(errorLog);

    const alert: ErrorAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      errorId: errorLog.id,
      type: alertType,
      severity,
      message: `[${severity.toUpperCase()}] ${errorLog.message}`,
      timestamp: Date.now(),
      notified: false,
    };

    this.errorAlerts.set(alert.id, alert);

    // Notificar owner se crítico
    if (severity === 'critical') {
      this.notifyOwnerOfAlert(alert, errorLog);
    }
  }

  /**
   * Notificar owner de alerta crítico
   */
  private async notifyOwnerOfAlert(alert: ErrorAlert, errorLog: ErrorLog): Promise<void> {
    try {
      await notifyOwner({
        title: `🚨 ALERTA CRÍTICO: ${alert.type.toUpperCase()}`,
        content: `
Erro Crítico Detectado:
- Tipo: ${alert.type}
- Mensagem: ${errorLog.message}
- Endpoint: ${errorLog.endpoint || 'N/A'}
- Status: ${errorLog.statusCode || 'N/A'}
- Usuário: ${errorLog.userId || 'Desconhecido'}
- Timestamp: ${new Date(errorLog.timestamp).toISOString()}

Stack Trace:
${errorLog.stack || 'Não disponível'}
        `.trim(),
      });

      alert.notified = true;
    } catch (error) {
      console.error('[ErrorMonitoring] Erro ao notificar owner:', error);
    }
  }

  /**
   * Determinar tipo de alerta baseado no erro
   */
  private determineAlertType(
    errorLog: ErrorLog
  ): 'crash' | 'performance' | 'security' | 'payment' | 'database' {
    if (errorLog.endpoint?.includes('payment')) return 'payment';
    if (errorLog.endpoint?.includes('database') || errorLog.message.includes('database'))
      return 'database';
    if (errorLog.message.includes('security') || errorLog.statusCode === 401)
      return 'security';
    if (errorLog.statusCode === 500 || errorLog.level === 'critical') return 'crash';
    return 'performance';
  }

  /**
   * Determinar severidade do alerta
   */
  private determineSeverity(errorLog: ErrorLog): 'low' | 'medium' | 'high' | 'critical' {
    if (errorLog.level === 'critical') return 'critical';
    if (errorLog.statusCode === 500) return 'high';
    if (errorLog.statusCode === 503) return 'high';
    if (errorLog.level === 'error') return 'medium';
    return 'low';
  }

  /**
   * Verificar se deve criar alerta
   */
  private shouldCreateAlert(errorLog: ErrorLog): boolean {
    // Criar alerta para erros críticos, 500, 503
    return (
      errorLog.level === 'critical' ||
      errorLog.statusCode === 500 ||
      errorLog.statusCode === 503 ||
      (errorLog.level === 'error' && errorLog.endpoint?.includes('payment'))
    );
  }

  /**
   * Registrar tempo de resposta
   */
  public recordResponseTime(duration: number): void {
    this.responseTimes.push(duration);

    // Manter apenas últimos 1000 tempos
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Atualizar métricas
    this.updateResponseTimeMetrics();
  }

  /**
   * Atualizar métricas de tempo de resposta
   */
  private updateResponseTimeMetrics(): void {
    if (this.responseTimes.length === 0) return;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const len = sorted.length;

    this.metrics.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / len;
    this.metrics.p95ResponseTime = sorted[Math.floor(len * 0.95)];
    this.metrics.p99ResponseTime = sorted[Math.floor(len * 0.99)];
  }

  /**
   * Atualizar métricas gerais
   */
  private updateMetrics(errorLog: ErrorLog): void {
    this.metrics.totalErrors++;
    this.metrics.lastError = errorLog;

    // Contar por nível
    this.metrics.errorsByLevel[errorLog.level] =
      (this.metrics.errorsByLevel[errorLog.level] || 0) + 1;

    // Contar por tipo
    const type = this.determineAlertType(errorLog);
    this.metrics.errorsByType[type] = (this.metrics.errorsByType[type] || 0) + 1;

    // Calcular crash rate (erros 500 por total de requisições)
    const totalRequests = Math.max(1, this.responseTimes.length);
    const crashes = (this.metrics.errorsByLevel['critical'] || 0) +
      (this.metrics.errorsByLevel['error'] || 0);
    this.metrics.crashRate = (crashes / totalRequests) * 100;

    // Calcular uptime
    const uptime = Math.max(0, 100 - this.metrics.crashRate);
    this.metrics.uptime = Math.round(uptime * 100) / 100;
  }

  /**
   * Obter métricas atuais
   */
  public getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Obter erros não resolvidos
   */
  public getUnresolvedErrors(): ErrorLog[] {
    return Array.from(this.errorLogs.values())
      .filter((e) => !e.resolved)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
  }

  /**
   * Obter alertas não notificados
   */
  public getUnnotifiedAlerts(): ErrorAlert[] {
    return Array.from(this.errorAlerts.values())
      .filter((a) => !a.notified)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Resolver erro
   */
  public resolveError(errorId: string): void {
    const error = this.errorLogs.get(errorId);
    if (error) {
      error.resolved = true;
    }
  }

  /**
   * Limpar logs antigos
   */
  private cleanupOldLogs(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const [id, log] of this.errorLogs.entries()) {
      if (log.timestamp < oneHourAgo && log.resolved) {
        this.errorLogs.delete(id);
      }
    }
  }

  /**
   * Obter saúde do sistema
   */
  public getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    errorRate: number;
    avgResponseTime: number;
    activeErrors: number;
    activeAlerts: number;
  } {
    const activeErrors = Array.from(this.errorLogs.values()).filter((e) => !e.resolved)
      .length;
    const activeAlerts = Array.from(this.errorAlerts.values()).filter((a) => !a.notified)
      .length;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (this.metrics.crashRate > 5 || activeAlerts > 10) status = 'degraded';
    if (this.metrics.crashRate > 10 || activeAlerts > 50) status = 'critical';

    return {
      status,
      uptime: this.metrics.uptime,
      errorRate: this.metrics.crashRate,
      avgResponseTime: Math.round(this.metrics.avgResponseTime),
      activeErrors,
      activeAlerts,
    };
  }
}

// Exportar singleton
export const errorMonitoring = new ErrorMonitoringService();

export default errorMonitoring;
