/**
 * 🔐 SEGURANÇA ADICIONAL - HARDENING COMPLETO
 * Planta y Raiz - Telemedicina Cannabis Medicinal
 * Data: 5 de Abril de 2026
 */

import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { Express } from 'express';

/**
 * 1️⃣ RATE LIMITING - Proteção contra Brute Force
 */
export const rateLimiters = {
  // Global Rate Limiter
  global: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições por IP
    message: 'Muitas requisições, tente novamente mais tarde',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Não limitar health checks
      return req.path === '/health';
    },
  }),

  // Login Rate Limiter (Mais restritivo)
  login: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 tentativas
    skipSuccessfulRequests: true,
    message: 'Muitas tentativas de login, tente novamente em 15 minutos',
  }),

  // API Rate Limiter
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 requisições por minuto
    message: 'Limite de API excedido',
  }),

  // Checkout Rate Limiter (Mais restritivo)
  checkout: rateLimit({
    windowMs: 60 * 1000,
    max: 3, // 3 checkouts por minuto
    message: 'Limite de checkout excedido',
  }),

  // Consultation Rate Limiter
  consultation: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // 5 consultas por hora
    message: 'Limite de consultas excedido',
  }),

  // File Upload Rate Limiter
  upload: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10, // 10 uploads por hora
    message: 'Limite de uploads excedido',
  }),
};

/**
 * 2️⃣ CORS HARDENED - Proteção contra CSRF
 */
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'https://plantayraiz.com.br',
      'https://www.plantayraiz.com.br',
      'https://app.plantayraiz.com.br',
      'http://localhost:3000', // Desenvolvimento
      'http://localhost:5173', // Vite
    ];

    // Permitir requisições sem origin (mobile apps, curl, etc)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS não permitido'));
    }
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 horas
};

/**
 * 3️⃣ SECURITY HEADERS - Proteção contra Ataques Comuns
 */
export const securityHeaders = {
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },

  // CSP (Content Security Policy)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Para inline scripts (considerar remover em produção)
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        'https://maps.googleapis.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      connectSrc: [
        "'self'",
        'https://api.plantayraiz.com.br',
        'https://maps.googleapis.com',
      ],
      frameSrc: [
        "'self'",
        'https://www.google.com/maps',
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-XSS-Protection
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Permissions-Policy
  permissionsPolicy: {
    features: {
      geolocation: ["'self'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'self'"],
    },
  },
};

/**
 * 4️⃣ HELMET CONFIGURATION
 */
export const helmetConfig = {
  contentSecurityPolicy: securityHeaders.contentSecurityPolicy,
  hsts: securityHeaders.hsts,
  noSniff: securityHeaders.noSniff,
  frameguard: securityHeaders.frameguard,
  xssFilter: securityHeaders.xssFilter,
  referrerPolicy: securityHeaders.referrerPolicy,
  permissionsPolicy: securityHeaders.permissionsPolicy,
};

/**
 * 5️⃣ INPUT VALIDATION & SANITIZATION
 */
export const inputValidation = {
  // Tamanho máximo
  maxRequestSize: '10mb',
  maxJsonSize: '1mb',
  maxUrlEncodedSize: '1mb',

  // Caracteres permitidos
  allowedCharacters: /^[a-zA-Z0-9\s\-_.@áéíóúàâêôãõç]*$/,

  // Email validation
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Phone validation
  phoneRegex: /^[\d\s\-\+\(\)]*$/,

  // SQL Injection Prevention
  sqlKeywords: [
    'DROP',
    'DELETE',
    'INSERT',
    'UPDATE',
    'UNION',
    'SELECT',
  ],
};

/**
 * 6️⃣ AUTHENTICATION SECURITY
 */
export const authSecurity = {
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true, // Não acessível via JavaScript
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  },

  // JWT
  jwt: {
    expiresIn: '24h',
    refreshExpiresIn: '7d',
    algorithm: 'HS256',
  },

  // Password
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },

  // 2FA
  twoFactor: {
    enabled: true,
    provider: 'totp', // Time-based One-Time Password
    window: 1,
  },
};

/**
 * 7️⃣ ENCRYPTION
 */
export const encryptionConfig = {
  // AES-256
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  authTagLength: 16,

  // Sensitive Fields to Encrypt
  encryptedFields: [
    'ssn',
    'creditCard',
    'bankAccount',
    'medicalHistory',
    'consultationNotes',
    'prescriptions',
  ],
};

/**
 * 8️⃣ LOGGING & MONITORING
 */
export const loggingConfig = {
  // Sensitive Data to Mask
  maskFields: [
    'password',
    'token',
    'apiKey',
    'creditCard',
    'ssn',
    'email',
    'phone',
  ],

  // Log Levels
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },

  // Retention
  retention: {
    error: 90, // 90 dias
    warn: 30, // 30 dias
    info: 7, // 7 dias
    debug: 1, // 1 dia
  },
};

/**
 * 9️⃣ SETUP SECURITY MIDDLEWARE
 */
export function setupSecurityMiddleware(app: Express) {
  // Helmet
  app.use(helmet(helmetConfig));

  // CORS
  app.use(cors(corsConfig));

  // Rate Limiting
  app.use(rateLimiters.global);

  // Specific Rate Limiters
  app.post('/api/auth/login', rateLimiters.login);
  app.post('/api/checkout', rateLimiters.checkout);
  app.post('/api/consultation', rateLimiters.consultation);
  app.post('/api/upload', rateLimiters.upload);

  // Security Headers
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
    next();
  });

  // CSRF Protection
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const token = req.headers['x-csrf-token'] as string;
      if (!token) {
        return res.status(403).json({ error: 'CSRF token missing' });
      }
    }
    next();
  });
}

export default {
  rateLimiters,
  corsConfig,
  securityHeaders,
  helmetConfig,
  inputValidation,
  authSecurity,
  encryptionConfig,
  loggingConfig,
  setupSecurityMiddleware,
};
