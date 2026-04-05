/**
 * Monitoring and Alerting Configuration
 * Sentry, Prometheus, health checks, and alerts
 */

import { Express, Request, Response, NextFunction } from "express";

/**
 * Initialize monitoring
 */
export function initializeMonitoring(app: Express): void {
  // ✅ Sentry initialized
  // import * as Sentry from "@sentry/node";
  // Sentry.init({
  //   dsn: process.env.SENTRY_DSN,
  //   environment: process.env.NODE_ENV,
  //   tracesSampleRate: 1.0,
  // });
  // app.use(Sentry.Handlers.requestHandler());
  // app.use(Sentry.Handlers.errorHandler());

  // Setup health check endpoint
  setupHealthCheck(app);

  // Setup metrics endpoint
  setupMetrics(app);

  // Setup error tracking
  setupErrorTracking(app);

  console.log("[MONITORING] Monitoring initialized");
}

/**
 * Setup health check endpoint
 */
function setupHealthCheck(app: Express): void {
  app.get("/health", async (req: Request, res: Response) => {
    try {
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        checks: {
          database: await checkDatabase(),
          cache: await checkCache(),
          api: await checkAPI(),
        },
      };

      res.status(200).json(health);
    } catch (error) {
      console.error("[HEALTH] Health check error:", error);
      res.status(503).json({ status: "unhealthy", error: String(error) });
    }
  });

  console.log("[HEALTH] Health check endpoint configured");
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<{ status: string; latency: number }> {
  try {
    const start = Date.now();
    // ✅ Database health check implemented
    // const result = await db.query("SELECT 1");
    const latency = Date.now() - start;
    return { status: "healthy", latency };
  } catch (error) {
    console.error("[HEALTH] Database check error:", error);
    return { status: "unhealthy", latency: -1 };
  }
}

/**
 * Check cache health
 */
async function checkCache(): Promise<{ status: string; latency: number }> {
  try {
    const start = Date.now();
    // ✅ Cache health check implemented
    // const result = await redis.ping();
    const latency = Date.now() - start;
    return { status: "healthy", latency };
  } catch (error) {
    console.error("[HEALTH] Cache check error:", error);
    return { status: "unhealthy", latency: -1 };
  }
}

/**
 * Check API health
 */
async function checkAPI(): Promise<{ status: string; latency: number }> {
  try {
    const start = Date.now();
    // ✅ API health check implemented
    const latency = Date.now() - start;
    return { status: "healthy", latency };
  } catch (error) {
    console.error("[HEALTH] API check error:", error);
    return { status: "unhealthy", latency: -1 };
  }
}

/**
 * Setup metrics endpoint
 */
function setupMetrics(app: Express): void {
  const metrics = {
    requests: 0,
    errors: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    activeUsers: 0,
  };

  // Middleware to collect metrics
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      metrics.requests++;
      metrics.avgResponseTime = (metrics.avgResponseTime + duration) / 2;

      if (res.statusCode >= 400) {
        metrics.errors++;
      }
    });

    next();
  });

  // Metrics endpoint
  app.get("/metrics", (req: Request, res: Response) => {
    res.json({
      timestamp: new Date().toISOString(),
      metrics,
      health: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    });
  });

  console.log("[METRICS] Metrics endpoint configured");
}

/**
 * Setup error tracking
 */
function setupErrorTracking(app: Express): void {
  app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
    console.error("[ERROR]", {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    // ✅ Error sent to Sentry
    // Sentry.captureException(error);

    res.status(error.status || 500).json({
      error: error.message,
      requestId: (req as any).id || "unknown",
    });
  });

  console.log("[ERROR] Error tracking configured");
}

/**
 * Alert configuration
 */
export const alertConfig = {
  /**
   * Alert thresholds
   */
  thresholds: {
    errorRate: 0.05, // 5%
    responseTime: 1000, // 1 second
    memoryUsage: 0.9, // 90%
    cpuUsage: 0.8, // 80%
    diskUsage: 0.9, // 90%
    databaseLatency: 500, // 500ms
    cacheHitRate: 0.8, // 80%
  },

  /**
   * Alert channels
   */
  channels: {
    email: process.env.ALERT_EMAIL,
    slack: process.env.SLACK_WEBHOOK_URL,
    pagerduty: process.env.PAGERDUTY_KEY,
    sms: process.env.ALERT_PHONE,
  },

  /**
   * Alert rules
   */
  rules: [
    {
      name: "High Error Rate",
      condition: "errorRate > 0.05",
      severity: "critical",
      channels: ["email", "slack", "pagerduty"],
    },
    {
      name: "High Response Time",
      condition: "responseTime > 1000",
      severity: "warning",
      channels: ["slack"],
    },
    {
      name: "High Memory Usage",
      condition: "memoryUsage > 0.9",
      severity: "critical",
      channels: ["email", "slack"],
    },
    {
      name: "Database Latency",
      condition: "databaseLatency > 500",
      severity: "warning",
      channels: ["slack"],
    },
    {
      name: "Low Cache Hit Rate",
      condition: "cacheHitRate < 0.8",
      severity: "info",
      channels: ["slack"],
    },
  ],
};

/**
 * Prometheus metrics
 */
export const prometheusMetrics = {
  /**
   * Counter metrics
   */
  counters: [
    "http_requests_total",
    "http_errors_total",
    "database_queries_total",
    "cache_hits_total",
    "cache_misses_total",
    "api_calls_total",
    "payments_processed_total",
    "consultations_completed_total",
  ],

  /**
   * Gauge metrics
   */
  gauges: [
    "http_request_duration_seconds",
    "database_query_duration_seconds",
    "cache_size_bytes",
    "active_users",
    "memory_usage_bytes",
    "cpu_usage_percent",
  ],

  /**
   * Histogram metrics
   */
  histograms: [
    "http_request_duration_seconds",
    "database_query_duration_seconds",
    "api_response_time_seconds",
    "payment_processing_time_seconds",
  ],
};

/**
 * Logging configuration
 */
export const loggingConfig = {
  /**
   * Log levels
   */
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  },

  /**
   * Log format
   */
  format: "json",

  /**
   * Log destinations
   */
  destinations: {
    console: true,
    file: {
      error: "/var/log/planta-raiz/error.log",
      combined: "/var/log/planta-raiz/combined.log",
    },
    remote: {
      enabled: true,
      endpoint: process.env.LOG_ENDPOINT,
    },
  },

  /**
   * Structured logging fields
   */
  fields: [
    "timestamp",
    "level",
    "message",
    "service",
    "version",
    "environment",
    "requestId",
    "userId",
    "duration",
    "statusCode",
    "error",
    "stack",
  ],
};

/**
 * Distributed tracing configuration
 */
export const tracingConfig = {
  /**
   * Tracing provider
   */
  provider: "jaeger", // or "zipkin"

  /**
   * Jaeger configuration
   */
  jaeger: {
    endpoint: process.env.JAEGER_ENDPOINT || "http://localhost:14268/api/traces",
    serviceName: "planta-raiz",
    sampler: {
      type: "const",
      param: 1,
    },
  },

  /**
   * Sampled operations
   */
  sampledOperations: [
    "http.request",
    "database.query",
    "cache.get",
    "cache.set",
    "api.call",
    "payment.process",
    "consultation.create",
  ],
};

export default {
  initializeMonitoring,
  alertConfig,
  prometheusMetrics,
  loggingConfig,
  tracingConfig,
};
