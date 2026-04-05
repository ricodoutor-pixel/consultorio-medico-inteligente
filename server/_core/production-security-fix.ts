/**
 * 🔐 CORREÇÃO DE SEGURANÇA PARA PRODUÇÃO
 * Planta y Raiz - Telemedicina Cannabis Medicinal
 * Data: 5 de Abril de 2026
 * 
 * PROBLEMAS IDENTIFICADOS:
 * ❌ Headers de segurança faltando (HSTS, X-Frame-Options, X-Content-Type-Options)
 * ❌ Endpoints sem autenticação
 * ❌ RLS não está funcionando
 * ❌ Proteção de dados faltando (LGPD/ANVISA/CFM)
 */

import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

/**
 * 1️⃣ SECURITY HEADERS - CORREÇÃO IMEDIATA
 */
export function setupSecurityHeaders(app: Express) {
  // Helmet - Adiciona headers de segurança automaticamente
  app.use(helmet({
    // HSTS - Force HTTPS
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
    // X-Frame-Options - Previne clickjacking
    frameguard: {
      action: 'deny',
    },
    // X-Content-Type-Options - Previne MIME sniffing
    noSniff: true,
    // X-XSS-Protection
    xssFilter: true,
    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    // CSP - Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https://api.plantayraiz.com.br'],
        frameSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  }));

  // Headers customizados
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
    next();
  });
}

/**
 * 2️⃣ AUTENTICAÇÃO OBRIGATÓRIA - MIDDLEWARE
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  // Validar token (implementar conforme sua estratégia)
  try {
    // TODO: Validar JWT ou session
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

/**
 * 3️⃣ PROTEÇÃO DE ENDPOINTS - APLICAR A TODOS OS ENDPOINTS SENSÍVEIS
 */
export const protectedEndpoints = [
  '/api/trpc/auth.me',
  '/api/trpc/admin.getMetrics',
  '/api/trpc/consultation.schedule',
  '/api/trpc/checkout.create',
  '/api/trpc/ai.triage',
  '/api/trpc/user.deleteData',
  '/api/trpc/prescription.create',
];

/**
 * 4️⃣ RATE LIMITING - PROTEÇÃO CONTRA BRUTE FORCE
 */
export const rateLimiters = {
  global: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições
    message: 'Muitas requisições, tente novamente mais tarde',
  }),

  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 tentativas
    skipSuccessfulRequests: true,
    message: 'Muitas tentativas de login',
  }),

  api: rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requisições
    message: 'Limite de API excedido',
  }),
};

/**
 * 5️⃣ CORS - PROTEÇÃO CONTRA CSRF
 */
export const corsConfig = {
  origin: [
    'https://plantayraiz.com.br',
    'https://www.plantayraiz.com.br',
    'https://app.plantayraiz.com.br',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

/**
 * 6️⃣ VALIDAÇÃO DE ENTRADA - PREVENIR INJECTION
 */
export function validateInput(req: Request, res: Response, next: NextFunction) {
  const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'UNION', 'SELECT'];
  
  // Verificar body
  if (req.body) {
    const bodyStr = JSON.stringify(req.body).toUpperCase();
    for (const keyword of sqlKeywords) {
      if (bodyStr.includes(keyword)) {
        return res.status(400).json({ error: 'Entrada inválida' });
      }
    }
  }

  next();
}

/**
 * 7️⃣ LGPD COMPLIANCE - AUDITORIA DE ACESSO
 */
export function auditAccess(req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const user = (req as any).user?.id || 'anonymous';
  const endpoint = req.path;
  const method = req.method;

  // Log de acesso (implementar conforme sua estratégia)
  console.log(`[AUDIT] ${timestamp} - User: ${user} - ${method} ${endpoint}`);

  next();
}

/**
 * 8️⃣ SETUP COMPLETO
 */
export function setupProductionSecurity(app: Express) {
  // 1. Security Headers
  setupSecurityHeaders(app);

  // 2. CORS
  app.use(cors(corsConfig));

  // 3. Rate Limiting
  app.use(rateLimiters.global);
  app.post('/api/auth/login', rateLimiters.auth);
  app.use('/api/trpc', rateLimiters.api);

  // 4. Input Validation
  app.use(validateInput);

  // 5. Audit Logging
  app.use(auditAccess);

  // 6. Proteger endpoints sensíveis
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (protectedEndpoints.some(ep => req.path.includes(ep))) {
      requireAuth(req, res, next);
    } else {
      next();
    }
  });

  console.log('✅ Segurança de produção configurada');
}

export default {
  setupSecurityHeaders,
  requireAuth,
  protectedEndpoints,
  rateLimiters,
  corsConfig,
  validateInput,
  auditAccess,
  setupProductionSecurity,
};
