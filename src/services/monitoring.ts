/**
 * MONITORAMENTO E LOGGING - PLANTA & RAIZ
 * 
 * Sistema de observabilidade para produção
 * - Logs estruturados
 * - Rastreamento de performance
 * - Alertas automáticos
 * - Auditoria de transações
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  requestId?: string;
  duration?: number; // em ms
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// ============================================
// LOGGER ESTRUTURADO
// ============================================

class Logger {
  private serviceName: string;
  private logs: LogEntry[] = [];
  private maxLogs = 10000; // Manter últimos 10k logs em memória

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    });
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Manter limite de logs em memória
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatLog(entry));
    }
  }

  debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      service: this.serviceName,
      message,
      context,
      requestId,
    });
  }

  info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      service: this.serviceName,
      message,
      context,
      requestId,
    });
  }

  warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.WARN,
      service: this.serviceName,
      message,
      context,
      requestId,
    });
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
    requestId?: string
  ): void {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      service: this.serviceName,
      message,
      context,
      requestId,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  critical(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
    requestId?: string
  ): void {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.CRITICAL,
      service: this.serviceName,
      message,
      context,
      requestId,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });

    // Enviar alerta crítico
    sendAlert({
      severity: 'critical',
      title: message,
      message: error?.message || 'Erro crítico detectado',
    });
  }

  getLogs(
    level?: LogLevel,
    limit: number = 100
  ): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    return filtered.slice(-limit);
  }
}

// ============================================
// RASTREAMENTO DE PERFORMANCE
// ============================================

export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 5000;

  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    tags?: Record<string, string>
  ): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    return filtered.slice(-limit);
  }

  getAverageResponseTime(endpoint: string): number {
    const metrics = this.metrics.filter(
      m => m.name === 'http_request_duration' && m.tags?.endpoint === endpoint
    );

    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  getP95ResponseTime(endpoint: string): number {
    const metrics = this.metrics
      .filter(m => m.name === 'http_request_duration' && m.tags?.endpoint === endpoint)
      .map(m => m.value)
      .sort((a, b) => a - b);

    if (metrics.length === 0) return 0;

    const index = Math.ceil(metrics.length * 0.95) - 1;
    return metrics[index] || 0;
  }
}

// ============================================
// SISTEMA DE ALERTAS
// ============================================

const alerts: Alert[] = [];
const alertCallbacks: Array<(alert: Alert) => void> = [];

export function sendAlert(
  options: Omit<Alert, 'id' | 'timestamp' | 'resolved' | 'resolvedAt'>
): Alert {
  const alert: Alert = {
    id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    resolved: false,
    ...options,
  };

  alerts.push(alert);

  // Executar callbacks de alerta
  alertCallbacks.forEach(callback => callback(alert));

  // Log do alerta
  const logger = new Logger('AlertSystem');
  logger.warn(`Alerta ${options.severity}: ${options.title}`);

  return alert;
}

export function resolveAlert(alertId: string): void {
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.resolved = true;
    alert.resolvedAt = new Date();
  }
}

export function onAlert(callback: (alert: Alert) => void): void {
  alertCallbacks.push(callback);
}

export function getAlerts(resolved?: boolean): Alert[] {
  if (resolved !== undefined) {
    return alerts.filter(a => a.resolved === resolved);
  }
  return alerts;
}

// ============================================
// AUDITORIA DE TRANSAÇÕES
// ============================================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  status: 'success' | 'failure';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const auditLogs: AuditLog[] = [];

export function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  options?: {
    changes?: Record<string, { before: unknown; after: unknown }>;
    status?: 'success' | 'failure';
    ipAddress?: string;
    userAgent?: string;
  }
): AuditLog {
  const auditLog: AuditLog = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    action,
    resource,
    resourceId,
    changes: options?.changes,
    status: options?.status || 'success',
    timestamp: new Date(),
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  };

  auditLogs.push(auditLog);

  // Manter limite
  if (auditLogs.length > 50000) {
    auditLogs.splice(0, auditLogs.length - 50000);
  }

  return auditLog;
}

export function getAuditLogs(
  userId?: string,
  action?: string,
  limit: number = 100
): AuditLog[] {
  let filtered = auditLogs;

  if (userId) {
    filtered = filtered.filter(log => log.userId === userId);
  }

  if (action) {
    filtered = filtered.filter(log => log.action === action);
  }

  return filtered.slice(-limit);
}

// ============================================
// HEALTH CHECK
// ============================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: 'ok' | 'error';
    cache: 'ok' | 'error';
    externalAPIs: 'ok' | 'error';
    diskSpace: 'ok' | 'warning' | 'error';
    memory: 'ok' | 'warning' | 'error';
  };
  uptime: number; // em segundos
  version: string;
}

const startTime = Date.now();

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks = {
    database: 'ok' as const,
    cache: 'ok' as const,
    externalAPIs: 'ok' as const,
    diskSpace: 'ok' as const,
    memory: 'ok' as const,
  };

  // Verificar memória
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  if (memPercent > 90) {
    checks.memory = 'error';
  } else if (memPercent > 75) {
    checks.memory = 'warning';
  }

  // Determinar status geral
  const hasError = Object.values(checks).includes('error');
  const hasWarning = Object.values(checks).includes('warning');

  const status = hasError ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy';

  return {
    status,
    timestamp: new Date(),
    checks,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.APP_VERSION || '1.0.0',
  };
}

// ============================================
// EXPORTAR INSTÂNCIAS
// ============================================

export const logger = new Logger('PlantaRaiz');
export const performanceTracker = new PerformanceTracker();
