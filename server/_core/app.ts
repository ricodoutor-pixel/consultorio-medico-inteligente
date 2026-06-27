/**
 * SERVIDOR EXPRESS COM MANUS CEO INTEGRADO
 * Todas as automações ativas 24/7
 * 
 * Data: 09/03/2026
 */

import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../routers';
import { createContext } from './context';
import { iniciarManusCEO } from '../manus-ceo-autonomous';
import cors from 'cors';
import whatsappWebhookRouter from '../routers/whatsappWebhook';
import { initializeSecurityMiddlewares } from './security-headers';
import { initializeCompressionMiddlewares } from './compression';
import { rateLimiters, corsConfig, helmetConfig } from './security-hardening';
import helmet from 'helmet';

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Inicializar middlewares de segurança
initializeSecurityMiddlewares(app);

// Inicializar middlewares de compressão
initializeCompressionMiddlewares(app);

// CORS seguro e hardening básico
app.use(cors(corsConfig));
app.use(helmet(helmetConfig));
app.use(rateLimiters.global);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ROTAS DE SAÚDE
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    manusCEO: 'active'
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    manusCEO: 'operational'
  });
});

// ============================================================================
// tRPC MIDDLEWARE
// ============================================================================

app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);

// ============================================================================
// WEBHOOK WHATSAPP
// ============================================================================

app.use('/', whatsappWebhookRouter);

// ============================================================================
// INICIAR MANUS CEO
// ============================================================================

app.listen(3000, async () => {
  console.log('🚀 Servidor Express iniciado na porta 3000');
  console.log('📱 Webhook WhatsApp ativo em /api/webhooks/whatsapp');
  
  // Iniciar Manus CEO
  await iniciarManusCEO();
  
  console.log('✅ Plataforma pronta para operação 24/7');
  console.log('🤖 Manus CEO operando 24/7 com alertas WhatsApp ativos');
});

export default app;
