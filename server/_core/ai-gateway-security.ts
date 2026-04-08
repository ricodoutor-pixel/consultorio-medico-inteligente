import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Interface para JWT payload
 */
interface JWTPayload {
  sub: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient' | 'user';
  iat: number;
  exp: number;
}

/**
 * Interface para rate limit
 */
interface RateLimit {
  count: number;
  resetTime: number;
}

// Store para rate limiting (em produção usar Redis)
const rateLimitStore = new Map<string, RateLimit>();

/**
 * Middleware para validar JWT
 */
export function validateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    
    // Adicionar user info ao request
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware para verificar role
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JWTPayload;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Middleware para rate limiting
 */
export function rateLimit(maxRequests: number = 60, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JWTPayload;
    const key = `${user.sub}-${req.path}`;
    const now = Date.now();

    const limit = rateLimitStore.get(key);

    if (!limit || now > limit.resetTime) {
      // Nova janela de tempo
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
    } else if (limit.count < maxRequests) {
      // Incrementar contador
      limit.count++;
      next();
    } else {
      // Limite excedido
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetTime - now) / 1000),
      });
    }
  };
}

/**
 * Middleware para sanitizar entrada
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitizar query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      const value = req.query[key];
      if (typeof value === 'string') {
        req.query[key] = sanitize(value);
      }
    });
  }

  // Sanitizar body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
}

/**
 * Função para sanitizar string
 */
function sanitize(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/['";]/g, '') // Remove quotes
    .trim();
}

/**
 * Função para sanitizar objeto recursivamente
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitize(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    Object.keys(obj).forEach((key) => {
      sanitized[key] = sanitizeObject(obj[key]);
    });
    return sanitized;
  }

  return obj;
}

/**
 * Middleware para logging de segurança
 */
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as JWTPayload;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[SECURITY] ${new Date().toISOString()} - User: ${user?.email} - IP: ${ip} - Method: ${req.method} - Path: ${req.path}`);

  next();
}

/**
 * Middleware para headers de segurança
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

/**
 * Middleware para CORS seguro
 */
export function secureCORS(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = [
    'https://plantayraiz.com.br',
    'https://www.plantayraiz.com.br',
    process.env.FRONTEND_URL,
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}

/**
 * Middleware para tratamento de erro
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[ERROR]', err);

  // Não expor detalhes de erro em produção
  const isDevelopment = process.env.NODE_ENV === 'development';

  return res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
}

/**
 * Função para criar middleware chain
 */
export function createSecureMiddlewareChain() {
  return [
    securityHeaders,
    secureCORS,
    sanitizeInput,
    validateJWT,
    securityLogger,
    rateLimit(60, 60000), // 60 requisições por minuto
  ];
}
