import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { verifyJWT } from "./jwt";

/**
 * Middleware de autenticação para AI Gateway
 * Valida JWT e verifica permissões de rota
 */
export async function aiGatewayAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token não fornecido",
      });
    }

    // Verificar JWT
    const decoded = verifyJWT(token);
    if (!decoded) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token inválido ou expirado",
      });
    }

    // Adicionar usuário ao contexto
    (req as any).user = decoded;

    // Verificar autorização de rota
    const isAuthorized = await checkRouteAuthorization(
      req.path,
      decoded.role,
      decoded.id
    );

    if (!isAuthorized) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Você não tem permissão para acessar esta rota",
      });
    }

    // Verificar rate limit
    const rateLimitExceeded = await checkRateLimit(
      decoded.id,
      req.path
    );

    if (rateLimitExceeded) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Você excedeu o limite de requisições. Tente novamente em 1 minuto.",
      });
    }

    next();
  } catch (error) {
    console.error("AI Gateway Auth Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao validar autenticação",
    });
  }
}

/**
 * Extrair token JWT do header Authorization
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * Verificar autorização de rota
 */
async function checkRouteAuthorization(
  routePath: string,
  userRole: string,
  userId: string
): Promise<boolean> {
  try {
    // Rotas públicas (sem autenticação necessária)
    const publicRoutes = [
      "/api/ai/health",
      "/api/ai/status",
    ];

    if (publicRoutes.includes(routePath)) {
      return true;
    }

    // Rotas que requerem autenticação
    const protectedRoutes: Record<string, string[]> = {
      "/api/ai/medical-diagnosis": ["doctor", "admin"],
      "/api/ai/prescription-generator": ["doctor", "admin"],
      "/api/ai/patient-analysis": ["doctor", "admin"],
      "/api/ai/admin-reports": ["admin"],
      "/api/ai/system-audit": ["admin"],
      "/api/ai/user-profile": ["user", "doctor", "admin"],
    };

    // Verificar se a rota existe e o usuário tem permissão
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (routePath.startsWith(route)) {
        return allowedRoles.includes(userRole);
      }
    }

    // Rota não encontrada
    return false;
  } catch (error) {
    console.error("Route Authorization Check Error:", error);
    return false;
  }
}

/**
 * Verificar rate limit por usuário e rota
 */
async function checkRateLimit(
  userId: string,
  routePath: string
): Promise<boolean> {
  try {
    const cacheKey = `rate_limit:${userId}:${routePath}`;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Simulação de cache (usar Redis em produção)
    // const requestCount = await redis.get(cacheKey);
    // const requests = requestCount ? JSON.parse(requestCount) : [];

    // Filtrar requisições do último minuto
    // const recentRequests = requests.filter(
    //   (timestamp: number) => timestamp > oneMinuteAgo
    // );

    // Obter limite de requisições da rota
    // const routeConfig = await getRouteConfig(routePath);
    // const limit = routeConfig?.rate_limit_per_minute || 60;

    // if (recentRequests.length >= limit) {
    //   return true; // Rate limit excedido
    // }

    // Adicionar timestamp atual
    // recentRequests.push(now);
    // await redis.setex(cacheKey, 60, JSON.stringify(recentRequests));

    return false; // Rate limit não excedido
  } catch (error) {
    console.error("Rate Limit Check Error:", error);
    return false;
  }
}

/**
 * Middleware para validar role específica
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Usuário não autenticado",
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Esta ação requer uma das seguintes roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
}

/**
 * Middleware para registrar acesso ao AI Gateway
 */
export async function logAIGatewayAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;
  const startTime = Date.now();

  // Interceptar response para registrar resultado
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    // Registrar acesso (assíncrono, não bloqueia resposta)
    if (user) {
      logAccess({
        userId: user.id,
        route: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date(),
      }).catch((error) => {
        console.error("Error logging AI Gateway access:", error);
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Registrar acesso ao AI Gateway
 */
async function logAccess(data: {
  userId: string;
  route: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}) {
  try {
    // Inserir log no banco de dados
    // await db.insert(aiGatewayAccessLogs).values(data);
    console.log(`[AI Gateway] ${data.method} ${data.route} - ${data.statusCode} (${data.duration}ms)`);
  } catch (error) {
    console.error("Error logging AI Gateway access:", error);
  }
}

/**
 * Obter configuração de rota
 */
async function getRouteConfig(routePath: string) {
  try {
    // Buscar configuração no banco de dados
    // const config = await db.query
    //   .select()
    //   .from(aiGatewayRoutes)
    //   .where(eq(aiGatewayRoutes.routePath, routePath))
    //   .limit(1);
    // return config[0] || null;
    return null;
  } catch (error) {
    console.error("Error getting route config:", error);
    return null;
  }
}
