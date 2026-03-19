/**
 * Serviço de Health Check
 * Monitoramento de saúde da API e componentes
 * Conformidade: DevOps, SRE, Escalabilidade
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  database: {
    connected: boolean;
    responseTime: number;
  };
  cache: {
    connected: boolean;
    responseTime: number;
  };
  services: {
    [key: string]: {
      status: 'ok' | 'error';
      responseTime: number;
      error?: string;
    };
  };
}

class HealthCheckService {
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 segundos
  private static readonly TIMEOUT = 5000; // 5 segundos
  private static lastHealthStatus: HealthStatus | null = null;

  /**
   * Inicializar health check periódico
   */
  static startHealthCheck() {
    console.log('[HEALTH CHECK] Iniciando monitoramento de saúde...');
    
    // Executar health check a cada intervalo
    setInterval(() => {
      this.performHealthCheck().catch(error => {
        console.error('[HEALTH CHECK] Erro:', error);
      });
    }, this.HEALTH_CHECK_INTERVAL);

    // Executar primeiro health check imediatamente
    this.performHealthCheck().catch(error => {
      console.error('[HEALTH CHECK] Erro no primeiro check:', error);
    });
  }

  /**
   * Executar health check completo
   */
  static async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const healthStatus: HealthStatus = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: await this.checkDatabase(),
        cache: await this.checkCache(),
        services: await this.checkServices()
      };

      // Determinar status geral
      const allServicesHealthy = Object.values(healthStatus.services).every(
        service => service.status === 'ok'
      );

      if (!allServicesHealthy || !healthStatus.database.connected) {
        healthStatus.status = 'degraded';
      }

      // Verificar limites de memória
      const memoryUsagePercent = (healthStatus.memory.heapUsed / healthStatus.memory.heapTotal) * 100;
      if (memoryUsagePercent > 90) {
        healthStatus.status = 'unhealthy';
        console.warn(`[HEALTH CHECK] ⚠️ Uso de memória crítico: ${memoryUsagePercent.toFixed(2)}%`);
      }

      this.lastHealthStatus = healthStatus;
      const duration = Date.now() - startTime;

      console.log(`[HEALTH CHECK] ✅ ${healthStatus.status.toUpperCase()} (${duration}ms)`);

      return healthStatus;
    } catch (error) {
      console.error('[HEALTH CHECK] Erro ao executar health check:', error);
      throw error;
    }
  }

  /**
   * Verificar saúde do banco de dados
   */
  private static async checkDatabase() {
    const startTime = Date.now();

    try {
      // TODO: Implementar verificação real do banco de dados
      // await db.raw('SELECT 1');
      
      return {
        connected: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[HEALTH CHECK] Erro ao verificar banco de dados:', error);
      return {
        connected: false,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Verificar saúde do cache
   */
  private static async checkCache() {
    const startTime = Date.now();

    try {
      // TODO: Implementar verificação real do cache (Redis, etc.)
      // await cache.ping();
      
      return {
        connected: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[HEALTH CHECK] Erro ao verificar cache:', error);
      return {
        connected: false,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Verificar saúde dos serviços
   */
  private static async checkServices() {
    const services: HealthStatus['services'] = {};

    // Verificar ClickSign
    services.clicksign = await this.checkService('ClickSign', async () => {
      // TODO: Implementar verificação real do ClickSign
      return true;
    });

    // Verificar Twilio
    services.twilio = await this.checkService('Twilio', async () => {
      // TODO: Implementar verificação real do Twilio
      return true;
    });

    // Verificar Mercado Pago
    services.mercadopago = await this.checkService('Mercado Pago', async () => {
      // TODO: Implementar verificação real do Mercado Pago
      return true;
    });

    // Verificar Supabase
    services.supabase = await this.checkService('Supabase', async () => {
      // TODO: Implementar verificação real do Supabase
      return true;
    });

    return services;
  }

  /**
   * Verificar serviço individual
   */
  private static async checkService(
    serviceName: string,
    checkFn: () => Promise<boolean>
  ): Promise<{ status: 'ok' | 'error'; responseTime: number; error?: string }> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        checkFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.TIMEOUT)
        )
      ]);

      return {
        status: result ? 'ok' : 'error',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Obter status de saúde atual
   */
  static getHealthStatus(): HealthStatus | null {
    return this.lastHealthStatus;
  }

  /**
   * Endpoint HTTP para health check
   */
  static getHealthCheckHandler() {
    return (req: any, res: any) => {
      const healthStatus = this.lastHealthStatus || {
        status: 'unknown',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: { connected: false, responseTime: 0 },
        cache: { connected: false, responseTime: 0 },
        services: {}
      };

      res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
    };
  }

  /**
   * Endpoint para métricas detalhadas
   */
  static getMetricsHandler() {
    return (req: any, res: any) => {
      const healthStatus = this.lastHealthStatus;

      if (!healthStatus) {
        return res.status(503).json({ error: 'Health check não executado ainda' });
      }

      const metrics = {
        uptime: healthStatus.uptime,
        memory: {
          rss: `${(healthStatus.memory.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(healthStatus.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(healthStatus.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapUsagePercent: `${((healthStatus.memory.heapUsed / healthStatus.memory.heapTotal) * 100).toFixed(2)}%`,
          external: `${(healthStatus.memory.external / 1024 / 1024).toFixed(2)} MB`
        },
        database: healthStatus.database,
        cache: healthStatus.cache,
        services: healthStatus.services,
        timestamp: healthStatus.timestamp
      };

      res.json(metrics);
    };
  }
}

export default HealthCheckService;
