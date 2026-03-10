/**
 * Performance Optimization Configuration
 * Caching, CDN, compression, lazy loading, and monitoring
 */

import { Express } from "express";

/**
 * Configure performance optimizations
 */
export function configurePerformance(app: Express): void {
  // Enable gzip compression
  // TODO: Install and configure compression middleware
  // app.use(compression());

  // Set cache headers for static assets
  app.use((req, res, next) => {
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
      // Cache static assets for 1 year
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else if (req.path.match(/\.(html)$/)) {
      // Cache HTML for 1 hour
      res.setHeader("Cache-Control", "public, max-age=3600");
    } else {
      // Don't cache API responses
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  // Enable CORS with caching
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
    next();
  });

  // Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
  });

  console.log("[PERFORMANCE] Optimizations configured");
  // TODO: Install compression package: npm install compression
  // TODO: Install rate-limit package: npm install express-rate-limit
}

/**
 * Caching strategies
 */
export const cacheStrategies = {
  /**
   * Cache-aside pattern
   */
  cacheAside: async (
    key: string,
    fetchFn: () => Promise<any>,
    ttl: number = 3600
  ): Promise<any> => {
    // TODO: Implement Redis caching
    // 1. Check cache
    // 2. If hit, return cached value
    // 3. If miss, fetch from source
    // 4. Cache result
    // 5. Return value

    return await fetchFn();
  },

  /**
   * Write-through pattern
   */
  writeThrough: async (key: string, value: any, ttl: number = 3600): Promise<void> => {
    // TODO: Implement write-through caching
    // 1. Write to cache
    // 2. Write to database
    // 3. Return success
  },

  /**
   * Write-behind pattern
   */
  writeBehind: async (key: string, value: any, ttl: number = 3600): Promise<void> => {
    // TODO: Implement write-behind caching
    // 1. Write to cache immediately
    // 2. Queue write to database
    // 3. Return success
    // 4. Process queue asynchronously
  },
};

/**
 * Image optimization
 */
export const imageOptimization = {
  /**
   * Generate responsive image sizes
   */
  generateResponsiveSizes: (originalUrl: string): Record<string, string> => {
    return {
      thumbnail: `${originalUrl}?w=150&h=150&fit=cover&q=80`,
      small: `${originalUrl}?w=300&h=300&fit=cover&q=80`,
      medium: `${originalUrl}?w=600&h=600&fit=cover&q=80`,
      large: `${originalUrl}?w=1200&h=1200&fit=cover&q=80`,
      webp: `${originalUrl}?w=1200&h=1200&fit=cover&q=80&fm=webp`,
    };
  },

  /**
   * Generate srcset for responsive images
   */
  generateSrcSet: (originalUrl: string): string => {
    return `
      ${originalUrl}?w=300&h=300&fit=cover&q=80 300w,
      ${originalUrl}?w=600&h=600&fit=cover&q=80 600w,
      ${originalUrl}?w=1200&h=1200&fit=cover&q=80 1200w
    `;
  },
};

/**
 * Database query optimization
 */
export const queryOptimization = {
  /**
   * Add database indexes
   */
  indexes: [
    "users.email",
    "users.created_at",
    "consultations.specialist_id",
    "consultations.patient_id",
    "consultations.status",
    "consultations.created_at",
    "products.category",
    "products.price",
    "orders.user_id",
    "orders.status",
    "orders.created_at",
    "referrals.referrer_id",
    "referrals.status",
  ],

  /**
   * Query pagination
   */
  paginate: (page: number = 1, limit: number = 20): { skip: number; take: number } => {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  },
};

/**
 * API rate limiting
 */
export const rateLimiting = {
  /**
   * Rate limit configuration
   */
  config: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  },

  /**
   * Strict rate limit for auth endpoints
   */
  strictConfig: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again later",
  },
};

/**
 * CDN configuration
 */
export const cdnConfig = {
  /**
   * Cloudflare configuration
   */
  cloudflare: {
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiKey: process.env.CLOUDFLARE_API_KEY,
    email: process.env.CLOUDFLARE_EMAIL,
    caching: {
      browser: 3600, // 1 hour
      cloudflare: 86400, // 1 day
    },
  },

  /**
   * AWS CloudFront configuration
   */
  cloudfront: {
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    domain: process.env.CLOUDFRONT_DOMAIN,
    caching: {
      default: 86400, // 1 day
      maxAge: 31536000, // 1 year for versioned assets
    },
  },
};

/**
 * Lazy loading configuration
 */
export const lazyLoadingConfig = {
  /**
   * Images lazy loading
   */
  images: {
    loading: "lazy",
    decoding: "async",
  },

  /**
   * Components lazy loading
   */
  components: {
    strategy: "route-based",
    preload: ["home", "consultation"],
  },

  /**
   * API calls lazy loading
   */
  api: {
    strategy: "on-demand",
    cache: true,
  },
};

/**
 * Monitoring and metrics
 */
export const monitoring = {
  /**
   * Performance metrics to track
   */
  metrics: [
    "response_time",
    "request_count",
    "error_rate",
    "cache_hit_rate",
    "database_query_time",
    "api_latency",
    "page_load_time",
    "time_to_interactive",
    "cumulative_layout_shift",
  ],

  /**
   * Alert thresholds
   */
  alerts: {
    responseTime: 1000, // 1 second
    errorRate: 0.05, // 5%
    cacheHitRate: 0.8, // 80%
    databaseQueryTime: 500, // 500ms
    apiLatency: 2000, // 2 seconds
  },
};

/**
 * Bundle size optimization
 */
export const bundleOptimization = {
  /**
   * Code splitting strategy
   */
  codeSplitting: {
    vendor: true,
    common: true,
    routes: true,
  },

  /**
   * Tree shaking configuration
   */
  treeShaking: {
    enabled: true,
    sideEffects: false,
  },

  /**
   * Minification
   */
  minification: {
    enabled: true,
    terser: {
      compress: {
        drop_console: true,
      },
    },
  },
};

export default {
  configurePerformance,
  cacheStrategies,
  imageOptimization,
  queryOptimization,
  rateLimiting,
  cdnConfig,
  lazyLoadingConfig,
  monitoring,
  bundleOptimization,
};
