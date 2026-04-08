import { Express, Request, Response, NextFunction } from "express";

/**
 * Middleware de Headers de Segurança
 * Implementa HSTS, X-Content-Type-Options, X-Frame-Options e outras proteções
 */
export function setupSecurityHeaders(app: Express) {
  // HSTS (HTTP Strict Transport Security)
  // Força HTTPS por 1 ano e inclui subdomínios
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    next();
  });

  // X-Content-Type-Options
  // Previne MIME type sniffing
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // X-Frame-Options
  // Previne clickjacking
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });

  // X-XSS-Protection
  // Proteção adicional contra XSS
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  // Referrer-Policy
  // Controla informações de referência
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Permissions-Policy (Feature-Policy)
  // Controla features do navegador
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=()"
    );
    next();
  });

  // Content-Security-Policy
  // Política de segurança de conteúdo
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://api.manus.im https://supabase.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );
    next();
  });

  console.log("✅ Security headers configurados com sucesso");
}

/**
 * Middleware para remover headers sensíveis
 */
export function removeServerHeaders(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Remover headers que expõem informações do servidor
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");
    next();
  });

  console.log("✅ Headers sensíveis removidos");
}

/**
 * Middleware para CORS seguro
 */
export function setupSecureCORS(app: Express) {
  const allowedOrigins = [
    "https://plantayraiz.com.br",
    "https://www.plantayraiz.com.br",
    "https://consultorio.plantayraiz.com.br",
    process.env.FRONTEND_URL || "http://localhost:3000"
  ];

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "3600");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  console.log("✅ CORS seguro configurado");
}

/**
 * Middleware para rate limiting básico
 */
export function setupRateLimiting(app: Express) {
  const requestCounts: Record<string, number[]> = {};
  const WINDOW_MS = 60000; // 1 minuto
  const MAX_REQUESTS = 100; // 100 requisições por minuto

  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    if (!requestCounts[ip]) {
      requestCounts[ip] = [];
    }

    // Remover requisições antigas
    requestCounts[ip] = requestCounts[ip].filter(
      (timestamp) => now - timestamp < WINDOW_MS
    );

    // Verificar limite
    if (requestCounts[ip].length >= MAX_REQUESTS) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Você excedeu o limite de requisições. Tente novamente em 1 minuto.",
      });
    }

    // Adicionar timestamp atual
    requestCounts[ip].push(now);

    next();
  });

  console.log("✅ Rate limiting configurado");
}

/**
 * Middleware para logging de segurança
 */
export function setupSecurityLogging(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Interceptar response
    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log de segurança para status codes altos
      if (statusCode >= 400) {
        console.warn(`[SECURITY] ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
      }

      return originalSend.call(this, data);
    };

    next();
  });

  console.log("✅ Security logging configurado");
}

/**
 * Inicializar todos os middlewares de segurança
 */
export function initializeSecurityMiddlewares(app: Express) {
  console.log("\n🔒 Inicializando middlewares de segurança...\n");

  setupSecurityHeaders(app);
  removeServerHeaders(app);
  setupSecureCORS(app);
  setupRateLimiting(app);
  setupSecurityLogging(app);

  console.log("\n✅ Todos os middlewares de segurança inicializados!\n");
}
