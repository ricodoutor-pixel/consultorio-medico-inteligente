import { Express, Request, Response, NextFunction } from "express";
import compression from "compression";

/**
 * Configurar compressão gzip e brotli
 */
export function setupCompression(app: Express) {
  // Compressão gzip padrão
  app.use(
    compression({
      // Comprimir apenas se tamanho > 1KB
      threshold: 1024,
      // Nível de compressão (0-9, padrão 6)
      level: 6,
      // Tipos MIME para comprimir
      filter: (req: Request, res: Response) => {
        // Não comprimir se o header "no-compression" estiver presente
        if (req.headers["x-no-compression"]) {
          return false;
        }

        // Usar filtro padrão
        return compression.filter(req, res);
      },
    })
  );

  // Middleware customizado para brotli (se suportado)
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Verificar se cliente suporta brotli
    const acceptEncoding = req.headers["accept-encoding"] || "";

    if (acceptEncoding.includes("br")) {
      // Adicionar header indicando que brotli é suportado
      res.setHeader("X-Compression-Supported", "brotli");
    } else if (acceptEncoding.includes("gzip")) {
      res.setHeader("X-Compression-Supported", "gzip");
    }

    next();
  });

  console.log("✅ Compressão gzip/brotli configurada");
}

/**
 * Middleware para cache de compressão
 */
export function setupCompressionCache(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Adicionar headers de cache para assets comprimidos
    if (req.path.match(/\.(js|css|json|svg|woff|woff2)$/)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }

    next();
  });

  console.log("✅ Cache de compressão configurado");
}

/**
 * Middleware para monitorar compressão
 */
export function setupCompressionMonitoring(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      const contentEncoding = res.getHeader("content-encoding");
      const contentLength = res.getHeader("content-length");

      if (contentEncoding) {
        console.log(
          `[COMPRESSION] ${req.path} - ${contentEncoding} - ${contentLength} bytes`
        );
      }

      return originalSend.call(this, data);
    };

    next();
  });

  console.log("✅ Monitoramento de compressão configurado");
}

/**
 * Inicializar todos os middlewares de compressão
 */
export function initializeCompressionMiddlewares(app: Express) {
  console.log("\n📦 Inicializando middlewares de compressão...\n");

  setupCompression(app);
  setupCompressionCache(app);
  setupCompressionMonitoring(app);

  console.log("\n✅ Todos os middlewares de compressão inicializados!\n");
}
