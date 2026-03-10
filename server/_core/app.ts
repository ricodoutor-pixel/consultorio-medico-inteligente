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

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
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
// INICIAR MANUS CEO
// ============================================================================

app.listen(3000, async () => {
  console.log('🚀 Servidor Express iniciado na porta 3000');
  
  // Iniciar Manus CEO
  await iniciarManusCEO();
  
  console.log('✅ Plataforma pronta para operação 24/7');
});

export default app;
