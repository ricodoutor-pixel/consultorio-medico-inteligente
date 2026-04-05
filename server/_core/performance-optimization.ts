/**
 * ⚡ OTIMIZAÇÕES DE PERFORMANCE
 * Planta y Raiz - Telemedicina Cannabis Medicinal
 * Data: 5 de Abril de 2026
 */

import compression from 'compression';
import { Express } from 'express';

/**
 * 1️⃣ CODE SPLITTING - Lazy Loading de Componentes
 */
export const codeSpittingConfig = {
  // React.lazy() será aplicado automaticamente em:
  components: [
    'AdminPanel',
    'AdminScheduleExport',
    'AdminScheduleMonitor',
    'AnalyticsDashboard',
    'WebhookConfiguration',
    'AIChatBox',
    'Map',
    'DashboardLayout',
  ],

  // Chunks por rota
  routeChunks: {
    '/admin': ['AdminPanel', 'AdminScheduleExport', 'AdminScheduleMonitor'],
    '/dashboard': ['DashboardLayout', 'AnalyticsDashboard'],
    '/consultation': ['AIChatBox', 'Map'],
    '/marketplace': ['ProductCard', 'CartSummary'],
  },

  // Preload crítico
  preload: [
    'HeroCarousel',
    'Navigation',
    'AuthGuard',
  ],
};

/**
 * 2️⃣ CACHE OTIMIZADO
 */
export const cacheConfig = {
  // Browser Cache
  staticAssets: {
    maxAge: '1y', // 1 ano para assets com hash
    immutable: true,
  },

  // API Cache (Redis)
  apiCache: {
    default: 300, // 5 minutos
    user: 600, // 10 minutos
    financial: 1800, // 30 minutos
    consultation: 60, // 1 minuto (dados críticos)
  },

  // Service Worker
  serviceWorker: {
    enabled: true,
    cacheName: 'planta-raiz-v1',
    strategies: {
      network_first: ['/api/'],
      cache_first: ['/assets/', '/fonts/', '/images/'],
      stale_while_revalidate: ['/'],
    },
  },
};

/**
 * 3️⃣ BUNDLE OPTIMIZATION
 */
export const bundleOptimization = {
  // Minificação
  minify: {
    js: true,
    css: true,
    html: true,
  },

  // Tree Shaking
  treeshaking: true,

  // Compression
  compression: {
    brotli: true,
    gzip: true,
    level: 11,
  },

  // Image Optimization
  images: {
    formats: ['webp', 'avif', 'jpg'],
    sizes: {
      thumbnail: 150,
      small: 300,
      medium: 600,
      large: 1200,
      xlarge: 1920,
    },
  },

  // Font Optimization
  fonts: {
    preload: ['Roboto', 'Open Sans'],
    display: 'swap',
    subset: ['latin'],
  },
};

/**
 * 4️⃣ DATABASE OPTIMIZATION
 */
export const dbOptimization = {
  // Connection Pooling
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Query Optimization
  queryCache: true,
  indexing: true,
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Batch Operations
  batchSize: 1000,
};

/**
 * 5️⃣ MIDDLEWARE DE PERFORMANCE
 */
export function setupPerformanceMiddleware(app: Express) {
  // Compression
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // Cache Headers
  app.use((req, res, next) => {
    if (req.path.startsWith('/assets/')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.path.startsWith('/api/')) {
      res.set('Cache-Control', 'private, max-age=300');
    } else {
      res.set('Cache-Control', 'public, max-age=3600');
    }
    next();
  });

  // ETag
  app.disable('x-powered-by');
  app.set('etag', 'strong');

  // Security Headers
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
}

/**
 * 6️⃣ MONITORAMENTO DE PERFORMANCE
 */
export const performanceMonitoring = {
  // Métricas Coletadas
  metrics: {
    pageLoadTime: true,
    firstContentfulPaint: true,
    largestContentfulPaint: true,
    cumulativeLayoutShift: true,
    firstInputDelay: true,
    timeToInteractive: true,
  },

  // Thresholds de Alerta
  thresholds: {
    pageLoadTime: 3000, // 3s
    firstContentfulPaint: 1800, // 1.8s
    largestContentfulPaint: 2500, // 2.5s
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100, // 100ms
  },

  // Sampling Rate
  samplingRate: 0.1, // 10% dos usuários
};

/**
 * 7️⃣ LAZY LOADING STRATEGY
 */
export const lazyLoadingStrategy = {
  // Images
  images: {
    strategy: 'intersection-observer',
    threshold: 0.1,
    rootMargin: '50px',
  },

  // Components
  components: {
    strategy: 'route-based',
    preload: 'on-hover',
  },

  // API Calls
  api: {
    strategy: 'on-demand',
    cache: true,
  },
};

/**
 * 8️⃣ CDN CONFIGURATION
 */
export const cdnConfig = {
  enabled: true,
  provider: 'cloudfront',
  regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
  ttl: 86400, // 24 horas

  // Purge Strategy
  purge: {
    onDeploy: true,
    onUpdate: true,
    schedule: 'daily',
  },
};

/**
 * 9️⃣ CRITICAL RENDERING PATH
 */
export const criticalRenderingPath = {
  // Inline Critical CSS
  inlineCritical: true,

  // Defer Non-Critical CSS
  deferNonCritical: true,

  // Async JavaScript
  asyncScripts: [
    'analytics',
    'tracking',
    'third-party',
  ],

  // Defer JavaScript
  deferScripts: [
    'non-critical',
    'below-fold',
  ],
};

/**
 * 🔟 PERFORMANCE BUDGET
 */
export const performanceBudget = {
  // Bundle Size
  js: {
    main: 250, // KB
    vendor: 200, // KB
    total: 450, // KB
  },

  css: {
    main: 50, // KB
    total: 100, // KB
  },

  images: {
    total: 500, // KB
  },

  // Load Time
  firstContentfulPaint: 1800, // ms
  largestContentfulPaint: 2500, // ms
  timeToInteractive: 3500, // ms
};

export default {
  codeSpittingConfig,
  cacheConfig,
  bundleOptimization,
  dbOptimization,
  performanceMonitoring,
  lazyLoadingStrategy,
  cdnConfig,
  criticalRenderingPath,
  performanceBudget,
};
