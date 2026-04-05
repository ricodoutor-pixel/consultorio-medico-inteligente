/**
 * CONFIGURAÇÃO DE HEADERS DE SEGURANÇA
 * HTTPS, CSP, HSTS, X-Frame-Options, X-Content-Type-Options
 */

import { Express } from 'express';

export function setupSecurityHeaders(app: Express) {
  // ==================== HSTS ====================
  // HTTP Strict Transport Security
  // Força HTTPS por 1 ano (31536000 segundos)
  app.use((req, res, next) => {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    next();
  });

  // ==================== CSP ====================
  // Content Security Policy
  // Restringe recursos a origens confiáveis
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net https://unpkg.com https://meet.jitsi",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src 'self' https: wss: blob:",
        "frame-src 'self' https://meet.jitsi https://www.youtube.com https://player.vimeo.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join('; ')
    );
    next();
  });

  // ==================== X-Content-Type-Options ====================
  // Previne MIME type sniffing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // ==================== X-Frame-Options ====================
  // Previne clickjacking
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // ==================== X-XSS-Protection ====================
  // Proteção contra XSS (legacy)
  app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // ==================== Referrer-Policy ====================
  // Controla informações de referência
  app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // ==================== Permissions-Policy ====================
  // Controla permissões de recursos
  app.use((req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      [
        'accelerometer=()',
        'ambient-light-sensor=()',
        'autoplay=()',
        'battery=()',
        'camera=(self "https://meet.jitsi")',
        'display-capture=()',
        'document-domain=()',
        'encrypted-media=()',
        'execution-while-not-rendered=()',
        'execution-while-out-of-viewport=()',
        'fullscreen=(self)',
        'geolocation=(self)',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=(self "https://meet.jitsi")',
        'midi=()',
        'navigation-override=()',
        'payment=()',
        'picture-in-picture=()',
        'publickey-credentials-get=()',
        'speaker-selection=()',
        'sync-xhr=()',
        'usb=()',
        'vr=()',
        'xr-spatial-tracking=()',
      ].join(', ')
    );
    next();
  });

  // ==================== CORS ====================
  // Cross-Origin Resource Sharing
  app.use((req, res, next) => {
    const allowedOrigins = [
      'https://plantayraiz.com.br',
      'https://www.plantayraiz.com.br',
      'https://localhost:3000',
      'https://localhost:5173',
    ];

    const origin = req.headers.origin as string;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // ==================== HTTPS Redirect ====================
  // Redireciona HTTP para HTTPS em produção
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // ==================== Remove X-Powered-By ====================
  // Remove header que revela tecnologia
  app.disable('x-powered-by');

  console.log('✅ Security headers configurados com sucesso');
}

/**
 * CHECKLIST DE SEGURANÇA
 * 
 * ✅ HSTS: Força HTTPS por 1 ano
 * ✅ CSP: Restringe recursos a origens confiáveis
 * ✅ X-Content-Type-Options: Previne MIME type sniffing
 * ✅ X-Frame-Options: Previne clickjacking
 * ✅ X-XSS-Protection: Proteção contra XSS
 * ✅ Referrer-Policy: Controla informações de referência
 * ✅ Permissions-Policy: Controla permissões de recursos
 * ✅ CORS: Cross-Origin Resource Sharing configurado
 * ✅ HTTPS Redirect: Redireciona HTTP para HTTPS
 * ✅ X-Powered-By: Removido
 * 
 * RESULTADO ESPERADO: SSL Labs A+ Rating
 */
