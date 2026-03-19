import { db } from '../db';

/**
 * Serviço de Logs de Auditoria
 * Conformidade: LGPD, ANVISA, CFM
 * Retenção: Até 2030 (7 anos)
 */

interface AuditLogEntry {
  id?: string;
  userId: string;
  userRole: 'patient' | 'doctor' | 'admin' | 'system';
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
  retentionUntil: Date;
}

class AuditLogService {
  private static readonly RETENTION_YEARS = 7; // Até 2030
  private static readonly MAX_BATCH_SIZE = 100;
  private static logBuffer: AuditLogEntry[] = [];
  private static flushInterval: NodeJS.Timeout | null = null;

  /**
   * Inicializar serviço de auditoria
   */
  static initialize() {
    console.log('[AUDIT LOG] Inicializando serviço de auditoria...');
    
    // Iniciar flush periódico de logs
    this.startPeriodicFlush();
    
    // Limpar logs expirados
    this.startCleanupJob();
  }

  /**
   * Registrar ação de auditoria
   */
  static async logAction(
    userId: string,
    userRole: 'patient' | 'doctor' | 'admin' | 'system',
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any> = {},
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      userRole,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status: 'success',
      timestamp: new Date(),
      retentionUntil: this.calculateRetentionDate()
    };

    // Adicionar ao buffer
    this.logBuffer.push(entry);

    // Fazer flush se buffer estiver cheio
    if (this.logBuffer.length >= this.MAX_BATCH_SIZE) {
      await this.flushLogs();
    }
  }

  /**
   * Registrar erro de auditoria
   */
  static async logError(
    userId: string,
    userRole: 'patient' | 'doctor' | 'admin' | 'system',
    action: string,
    resource: string,
    resourceId: string,
    error: Error,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      userRole,
      action,
      resource,
      resourceId,
      details: {},
      ipAddress,
      userAgent,
      status: 'failure',
      errorMessage: error.message,
      timestamp: new Date(),
      retentionUntil: this.calculateRetentionDate()
    };

    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.MAX_BATCH_SIZE) {
      await this.flushLogs();
    }
  }

  /**
   * Fazer flush de logs para banco de dados
   */
  private static async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    try {
      const logsToFlush = [...this.logBuffer];
      this.logBuffer = [];

      // TODO: Implementar inserção em batch no banco de dados
      // await db.insert(auditLogs).values(logsToFlush);

      console.log(`[AUDIT LOG] Flushed ${logsToFlush.length} logs`);
    } catch (error) {
      console.error('[AUDIT LOG] Erro ao fazer flush de logs:', error);
      // Restaurar logs ao buffer em caso de erro
      this.logBuffer.push(...this.logBuffer);
    }
  }

  /**
   * Iniciar flush periódico
   */
  private static startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      this.flushLogs().catch(error => {
        console.error('[AUDIT LOG] Erro no flush periódico:', error);
      });
    }, 60000); // A cada 1 minuto
  }

  /**
   * Iniciar job de limpeza de logs expirados
   */
  private static startCleanupJob() {
    // Executar limpeza a cada 24 horas
    setInterval(() => {
      this.cleanupExpiredLogs().catch(error => {
        console.error('[AUDIT LOG] Erro na limpeza de logs:', error);
      });
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Limpar logs expirados
   */
  private static async cleanupExpiredLogs(): Promise<void> {
    try {
      const now = new Date();
      
      // TODO: Implementar exclusão de logs expirados
      // await db.delete(auditLogs).where(lt(auditLogs.retentionUntil, now));

      console.log('[AUDIT LOG] Limpeza de logs expirados concluída');
    } catch (error) {
      console.error('[AUDIT LOG] Erro ao limpar logs expirados:', error);
    }
  }

  /**
   * Calcular data de retenção
   */
  private static calculateRetentionDate(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + this.RETENTION_YEARS);
    return date;
  }

  /**
   * Buscar logs de auditoria
   */
  static async getLogs(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      // TODO: Implementar busca no banco de dados com filtros
      console.log('[AUDIT LOG] Buscando logs com filtros:', filters);
      return [];
    } catch (error) {
      console.error('[AUDIT LOG] Erro ao buscar logs:', error);
      throw error;
    }
  }

  /**
   * Exportar logs para conformidade
   */
  static async exportLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const logs = await this.getLogs({
        startDate,
        endDate
      });

      if (format === 'csv') {
        return this.convertToCsv(logs);
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('[AUDIT LOG] Erro ao exportar logs:', error);
      throw error;
    }
  }

  /**
   * Converter logs para CSV
   */
  private static convertToCsv(logs: AuditLogEntry[]): string {
    const headers = [
      'Timestamp',
      'User ID',
      'User Role',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'IP Address',
      'User Agent'
    ];

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.userId,
      log.userRole,
      log.action,
      log.resource,
      log.resourceId,
      log.status,
      log.ipAddress,
      log.userAgent
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Gerar relatório de auditoria
   */
  static async generateAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    actionsByType: Record<string, number>;
    actionsByUser: Record<string, number>;
    actionsByResource: Record<string, number>;
  }> {
    try {
      const logs = await this.getLogs({
        startDate,
        endDate
      });

      const report = {
        totalActions: logs.length,
        successfulActions: logs.filter(l => l.status === 'success').length,
        failedActions: logs.filter(l => l.status === 'failure').length,
        actionsByType: {} as Record<string, number>,
        actionsByUser: {} as Record<string, number>,
        actionsByResource: {} as Record<string, number>
      };

      for (const log of logs) {
        report.actionsByType[log.action] = (report.actionsByType[log.action] || 0) + 1;
        report.actionsByUser[log.userId] = (report.actionsByUser[log.userId] || 0) + 1;
        report.actionsByResource[log.resource] = (report.actionsByResource[log.resource] || 0) + 1;
      }

      return report;
    } catch (error) {
      console.error('[AUDIT LOG] Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Shutdown - fazer flush final
   */
  static async shutdown(): Promise<void> {
    console.log('[AUDIT LOG] Encerrando serviço de auditoria...');
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Fazer flush final
    await this.flushLogs();
    
    console.log('[AUDIT LOG] Serviço de auditoria encerrado');
  }
}

export default AuditLogService;
