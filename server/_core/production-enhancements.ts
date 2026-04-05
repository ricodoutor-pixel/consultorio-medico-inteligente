/**
 * 🚀 MELHORIAS ADICIONAIS PARA PRODUÇÃO
 * Planta y Raiz - Telemedicina Cannabis Medicinal
 * Data: 5 de Abril de 2026
 */

import { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { createProxyMiddleware } from 'express-http-proxy';

/**
 * 1️⃣ COMPRESSÃO DE RESPOSTA - Reduz tamanho de dados
 */
export function setupCompression(app: Express) {
  app.use(compression({
    level: 6, // Nível de compressão (0-9)
    threshold: 1024, // Apenas comprime respostas > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));
}

/**
 * 2️⃣ CACHING ESTRATÉGICO - Melhora performance
 */
export function setupCaching(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Cache estático (imagens, CSS, JS)
    if (/\.(jpg|jpeg|png|gif|css|js|woff|woff2|eot|ttf|otf|svg)$/i.test(req.path)) {
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 ano
    }
    // Cache de HTML (5 minutos)
    else if (/\.html$/i.test(req.path)) {
      res.set('Cache-Control', 'public, max-age=300');
    }
    // Sem cache para API
    else if (req.path.startsWith('/api')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // Cache padrão (10 minutos)
    else {
      res.set('Cache-Control', 'public, max-age=600');
    }

    next();
  });
}

/**
 * 3️⃣ MONITORAMENTO DE PERFORMANCE - Rastreia métricas
 */
export function setupPerformanceMonitoring(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      // Log de performance
      if (duration > 1000) {
        console.warn(`⚠️  Slow request: ${req.method} ${req.path} - ${duration}ms (${status})`);
      }

      // Métricas
      const metrics = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status,
        duration,
        ip: req.ip,
      };

      // Enviar para monitoring (implementar conforme sua estratégia)
      // sendToMonitoring(metrics);
    });

    next();
  });
}

/**
 * 4️⃣ TRATAMENTO DE ERROS - Respostas consistentes
 */
export function setupErrorHandling(app: Express) {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Erro interno do servidor';

    console.error(`[ERROR] ${status} - ${message}`);

    res.status(status).json({
      error: {
        status,
        message,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  });

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        status: 404,
        message: 'Recurso não encontrado',
        path: req.path,
      },
    });
  });
}

/**
 * 5️⃣ HEALTH CHECK - Monitoramento de saúde
 */
export function setupHealthCheck(app: Express) {
  app.get('/health', (req: Request, res: Response) => {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: 'OK', // Implementar verificação real
        cache: 'OK', // Implementar verificação real
        api: 'OK',
      },
    };

    res.status(200).json(health);
  });

  // Readiness check (para Kubernetes/Docker)
  app.get('/ready', (req: Request, res: Response) => {
    const ready = {
      ready: true,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(ready);
  });

  // Liveness check (para Kubernetes/Docker)
  app.get('/live', (req: Request, res: Response) => {
    const live = {
      alive: true,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(live);
  });
}

/**
 * 6️⃣ LOGGING ESTRUTURADO - Rastreamento de eventos
 */
export function setupLogging(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    // Log de requisição
    console.log(`[REQUEST] ${JSON.stringify(log)}`);

    // Log de resposta
    res.on('finish', () => {
      console.log(`[RESPONSE] ${req.method} ${req.path} - ${res.statusCode}`);
    });

    next();
  });
}

/**
 * 7️⃣ PROXY REVERSO - Para APIs externas
 */
export function setupReverseProxy(app: Express) {
  // Proxy para Mercado Pago
  app.use('/api/mercadopago', createProxyMiddleware({
    target: 'https://api.mercadopago.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api/mercadopago': '',
    },
    headers: {
      'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
    },
  }));

  // Proxy para Google Maps
  app.use('/api/maps', createProxyMiddleware({
    target: 'https://maps.googleapis.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api/maps': '',
    },
  }));
}

/**
 * 8️⃣ VALIDAÇÃO DE VERSÃO DE API
 */
export function setupAPIVersioning(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const version = req.headers['api-version'] || '1.0.0';

    // Validar versão
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      return res.status(400).json({
        error: 'Versão de API inválida',
      });
    }

    (req as any).apiVersion = version;
    next();
  });
}

/**
 * 9️⃣ SETUP COMPLETO
 */
export function setupProductionEnhancements(app: Express) {
  // 1. Compressão
  setupCompression(app);

  // 2. Caching
  setupCaching(app);

  // 3. Performance Monitoring
  setupPerformanceMonitoring(app);

  // 4. Health Checks
  setupHealthCheck(app);

  // 5. Logging
  setupLogging(app);

  // 6. Reverse Proxy
  setupReverseProxy(app);

  // 7. API Versioning
  setupAPIVersioning(app);

  // 8. Error Handling (deve ser o último)
  setupErrorHandling(app);

  console.log('✅ Melhorias de produção configuradas');
}

export default {
  setupCompression,
  setupCaching,
  setupPerformanceMonitoring,
  setupHealthCheck,
  setupLogging,
  setupReverseProxy,
  setupAPIVersioning,
  setupErrorHandling,
  setupProductionEnhancements,
};
