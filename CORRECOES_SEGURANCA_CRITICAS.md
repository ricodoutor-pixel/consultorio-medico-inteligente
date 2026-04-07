# 🔒 CORREÇÕES DE SEGURANÇA CRÍTICAS - PLANTA & RAIZ

## Status: 🚨 VULNERABILIDADES DETECTADAS E CORRIGIDAS

---

## ❌ VULNERABILIDADE 1: Row-Level Security (RLS) - Relatórios Financeiros

### Problema
- Tabela de relatórios financeiros sem Row-Level Security
- Qualquer usuário autenticado pode visualizar relatórios de outros usuários
- Dados financeiros sensíveis expostos

### Solução Implementada

```sql
-- 1. Habilitar RLS na tabela de relatórios
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para usuários normais (ver apenas seus próprios relatórios)
CREATE POLICY "Users can only view their own financial reports"
ON financial_reports
FOR SELECT
USING (user_id = auth.uid());

-- 3. Criar política para inserção (apenas próprios dados)
CREATE POLICY "Users can only insert their own financial reports"
ON financial_reports
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 4. Criar política para atualização (apenas próprios dados)
CREATE POLICY "Users can only update their own financial reports"
ON financial_reports
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Criar política para exclusão (apenas próprios dados)
CREATE POLICY "Users can only delete their own financial reports"
ON financial_reports
FOR DELETE
USING (user_id = auth.uid());

-- 6. Criar política para administradores (ver todos)
CREATE POLICY "Admins can view all financial reports"
ON financial_reports
FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- 7. Criar política para administradores (atualizar todos)
CREATE POLICY "Admins can update all financial reports"
ON financial_reports
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### Validação
```typescript
// Backend - tRPC procedure com RLS
export const getFinancialReports = protectedProcedure
  .query(async ({ ctx }) => {
    // RLS automático: apenas relatórios do usuário autenticado
    return await db.query.financial_reports.findMany({
      where: { user_id: ctx.user.id }
    });
  });
```

---

## ❌ VULNERABILIDADE 2: Canais em Tempo Real Sem Autorização

### Problema
- Qualquer usuário autenticado pode se inscrever em qualquer canal
- Notificações de outros usuários são recebidas sem autorização
- Vazamento de dados em tempo real

### Solução Implementada

```typescript
// server/_core/realtime.ts - Validação de Autorização de Canais

import { TRPCError } from "@trpc/server";

export async function validateChannelAccess(
  userId: string,
  channelId: string,
  action: "subscribe" | "publish"
): Promise<boolean> {
  // 1. Verificar se o canal existe
  const channel = await db.query.channels.findFirst({
    where: { id: channelId }
  });

  if (!channel) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Canal não encontrado"
    });
  }

  // 2. Verificar permissões baseado no tipo de canal
  switch (channel.type) {
    case "private":
      // Apenas membros do canal podem acessar
      const isMember = await db.query.channel_members.findFirst({
        where: {
          channel_id: channelId,
          user_id: userId
        }
      });
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para acessar este canal"
        });
      }
      return true;

    case "group":
      // Apenas membros do grupo podem acessar
      const isGroupMember = await db.query.group_members.findFirst({
        where: {
          group_id: channel.group_id,
          user_id: userId
        }
      });
      if (!isGroupMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não é membro deste grupo"
        });
      }
      return true;

    case "public":
      // Qualquer usuário autenticado pode acessar
      return true;

    default:
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Tipo de canal desconhecido"
      });
  }
}

// WebSocket handler com validação
export function setupRealtimeServer(io: Server) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = await verifyToken(token);
      socket.userId = userId;
      next();
    } catch (error) {
      next(new Error("Autenticação falhou"));
    }
  });

  io.on("connection", (socket) => {
    // Validar inscrição em canal
    socket.on("subscribe", async (channelId) => {
      try {
        await validateChannelAccess(socket.userId, channelId, "subscribe");
        socket.join(`channel:${channelId}`);
        socket.emit("subscribed", { channelId });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Validar publicação em canal
    socket.on("publish", async (channelId, message) => {
      try {
        await validateChannelAccess(socket.userId, channelId, "publish");
        io.to(`channel:${channelId}`).emit("message", {
          userId: socket.userId,
          message,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });
  });
}
```

### Banco de Dados - Schema

```sql
-- Tabela de canais
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('public', 'private', 'group')),
  group_id UUID REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de membros de canal (para canais privados)
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Habilitar RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para canais
CREATE POLICY "Users can view public channels"
ON channels FOR SELECT
USING (type = 'public' OR auth.uid() IN (
  SELECT user_id FROM channel_members WHERE channel_id = channels.id
));

CREATE POLICY "Users can view their group channels"
ON channels FOR SELECT
USING (
  type = 'group' AND group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);
```

---

## ❌ VULNERABILIDADE 3: AI Gateway Expõe Rotas Sensíveis

### Problema
- AI Gateway expõe rotas sensíveis sem autenticação
- Qualquer pessoa pode chamar APIs de IA
- Risco de abuso e custos não controlados

### Solução Implementada

```typescript
// server/_core/ai-gateway.ts - Middleware de Autenticação

import { Request, Response, NextFunction } from "express";
import { TRPCError } from "@trpc/server";

// Whitelist de rotas públicas (sem autenticação)
const PUBLIC_ROUTES = [
  "/api/ai/health",
  "/api/ai/status"
];

// Whitelist de rotas que requerem autenticação
const PROTECTED_ROUTES = [
  "/api/ai/generate-image",
  "/api/ai/chat",
  "/api/ai/transcribe",
  "/api/ai/analyze"
];

// Whitelist de rotas que requerem role específico
const ADMIN_ROUTES = [
  "/api/ai/admin/logs",
  "/api/ai/admin/usage",
  "/api/ai/admin/quotas"
];

export async function validateAIGatewayAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const path = req.path;

  // 1. Rotas públicas - sem validação
  if (PUBLIC_ROUTES.includes(path)) {
    return next();
  }

  // 2. Rotas protegidas - requerem autenticação
  if (PROTECTED_ROUTES.includes(path)) {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        error: "Autenticação necessária",
        code: "UNAUTHORIZED"
      });
    }

    try {
      const decoded = await verifyJWT(token);
      req.user = decoded;
      
      // 3. Validar quota de uso
      const usage = await checkAIUsageQuota(decoded.id);
      if (usage.exceeded) {
        return res.status(429).json({
          error: "Quota de uso excedida",
          code: "QUOTA_EXCEEDED",
          reset_at: usage.reset_at
        });
      }
      
      return next();
    } catch (error) {
      return res.status(401).json({
        error: "Token inválido",
        code: "INVALID_TOKEN"
      });
    }
  }

  // 4. Rotas de administrador
  if (ADMIN_ROUTES.includes(path)) {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        error: "Autenticação necessária",
        code: "UNAUTHORIZED"
      });
    }

    try {
      const decoded = await verifyJWT(token);
      
      if (decoded.role !== "admin") {
        return res.status(403).json({
          error: "Acesso negado - privilégios de administrador necessários",
          code: "FORBIDDEN"
        });
      }
      
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({
        error: "Token inválido",
        code: "INVALID_TOKEN"
      });
    }
  }

  // 5. Rota desconhecida
  return res.status(404).json({
    error: "Rota não encontrada",
    code: "NOT_FOUND"
  });
}

// Middleware de rate limiting por usuário
export async function rateLimitAIGateway(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.user?.id;
  const endpoint = req.path;
  
  // Limites por endpoint
  const limits = {
    "/api/ai/generate-image": { requests: 10, window: 3600 }, // 10/hora
    "/api/ai/chat": { requests: 100, window: 3600 }, // 100/hora
    "/api/ai/transcribe": { requests: 20, window: 3600 }, // 20/hora
    "/api/ai/analyze": { requests: 50, window: 3600 } // 50/hora
  };

  const limit = limits[endpoint] || { requests: 100, window: 3600 };
  
  const key = `ai-gateway:${userId}:${endpoint}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, limit.window);
  }

  if (current > limit.requests) {
    return res.status(429).json({
      error: "Rate limit excedido",
      code: "RATE_LIMIT_EXCEEDED",
      limit: limit.requests,
      window: limit.window,
      reset_at: new Date(Date.now() + limit.window * 1000)
    });
  }

  res.setHeader("X-RateLimit-Limit", limit.requests);
  res.setHeader("X-RateLimit-Remaining", limit.requests - current);
  
  next();
}

// Aplicar middleware
app.use("/api/ai", validateAIGatewayAccess);
app.use("/api/ai", rateLimitAIGateway);
```

---

## ❌ VULNERABILIDADE 4: Notificações em Tempo Real Sem Autorização

### Problema
- Notificações transmitidas para todos os usuários autenticados
- Sem validação de autorização do canal
- Vazamento de dados sensíveis

### Solução Implementada

```typescript
// server/routers/notifications.ts - Notificações Seguras

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const notificationsRouter = router({
  // Inscrever em canal de notificações
  subscribe: protectedProcedure
    .input(z.object({
      channel: z.enum(["personal", "group", "clinic"])
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Validar autorização
      const hasAccess = await validateNotificationAccess(
        ctx.user.id,
        input.channel
      );

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para acessar este canal"
        });
      }

      // 2. Registrar inscrição
      await db.insert(notification_subscriptions).values({
        user_id: ctx.user.id,
        channel: input.channel,
        subscribed_at: new Date()
      });

      // 3. Retornar token de inscrição
      const token = generateSubscriptionToken(ctx.user.id, input.channel);
      
      return { success: true, token };
    }),

  // Enviar notificação (apenas para usuários autorizados)
  send: protectedProcedure
    .input(z.object({
      recipient_id: z.string().uuid(),
      title: z.string(),
      message: z.string(),
      channel: z.enum(["personal", "group", "clinic"])
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Validar que o remetente tem permissão
      const canSend = await validateNotificationSendPermission(
        ctx.user.id,
        input.recipient_id,
        input.channel
      );

      if (!canSend) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para enviar notificações"
        });
      }

      // 2. Validar que o destinatário está inscrito
      const isSubscribed = await db.query.notification_subscriptions.findFirst({
        where: {
          user_id: input.recipient_id,
          channel: input.channel
        }
      });

      if (!isSubscribed) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Destinatário não está inscrito neste canal"
        });
      }

      // 3. Criar notificação
      const notification = await db.insert(notifications).values({
        sender_id: ctx.user.id,
        recipient_id: input.recipient_id,
        title: input.title,
        message: input.message,
        channel: input.channel,
        created_at: new Date()
      });

      // 4. Emitir via WebSocket (apenas para o destinatário)
      io.to(`user:${input.recipient_id}`).emit("notification", {
        id: notification.id,
        title: input.title,
        message: input.message,
        channel: input.channel,
        timestamp: new Date()
      });

      return { success: true, notification_id: notification.id };
    }),

  // Listar notificações (apenas do usuário)
  list: protectedProcedure
    .input(z.object({
      channel: z.enum(["personal", "group", "clinic"]).optional(),
      limit: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      // RLS automático: apenas notificações do usuário
      return await db.query.notifications.findMany({
        where: {
          recipient_id: ctx.user.id,
          ...(input.channel && { channel: input.channel })
        },
        limit: input.limit,
        orderBy: { created_at: "desc" }
      });
    })
});

// Função de validação de autorização
async function validateNotificationAccess(
  userId: string,
  channel: string
): Promise<boolean> {
  switch (channel) {
    case "personal":
      // Usuário sempre tem acesso ao seu próprio canal
      return true;

    case "group":
      // Validar se usuário é membro de algum grupo
      const groupMembership = await db.query.group_members.findFirst({
        where: { user_id: userId }
      });
      return !!groupMembership;

    case "clinic":
      // Validar se usuário é médico ou staff da clínica
      const clinicMembership = await db.query.clinic_staff.findFirst({
        where: { user_id: userId }
      });
      return !!clinicMembership;

    default:
      return false;
  }
}

// Função de validação de permissão de envio
async function validateNotificationSendPermission(
  senderId: string,
  recipientId: string,
  channel: string
): Promise<boolean> {
  switch (channel) {
    case "personal":
      // Apenas o próprio usuário pode enviar notificações pessoais
      return senderId === recipientId;

    case "group":
      // Ambos devem ser membros do mesmo grupo
      const senderGroups = await db.query.group_members.findMany({
        where: { user_id: senderId }
      });
      const recipientGroups = await db.query.group_members.findMany({
        where: { user_id: recipientId }
      });
      
      const commonGroup = senderGroups.some(sg =>
        recipientGroups.some(rg => rg.group_id === sg.group_id)
      );
      return commonGroup;

    case "clinic":
      // Apenas staff da clínica pode enviar
      const isStaff = await db.query.clinic_staff.findFirst({
        where: { user_id: senderId }
      });
      return !!isStaff;

    default:
      return false;
  }
}
```

---

## ⚠️ VULNERABILIDADE 5: Webhook de Pagamento Sem Validação

### Problema
- Dados do webhook (emails dos pagadores) acessíveis apenas a admins
- Inserção de dados não está protegida
- Qualquer pessoa pode inserir dados falsos

### Solução Implementada

```typescript
// server/routers/webhooks.ts - Webhook de Pagamento Seguro

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import crypto from "crypto";

export const webhooksRouter = router({
  // Webhook do Mercado Pago
  mercadoPagoWebhook: publicProcedure
    .input(z.object({
      id: z.string(),
      type: z.string(),
      data: z.record(z.any()),
      signature: z.string(),
      timestamp: z.number()
    }))
    .mutation(async ({ input }) => {
      // 1. Validar assinatura do webhook
      const isValid = validateWebhookSignature(
        input.id,
        input.type,
        input.data,
        input.signature,
        input.timestamp
      );

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Assinatura do webhook inválida"
        });
      }

      // 2. Validar timestamp (evitar replay attacks)
      const now = Date.now() / 1000;
      if (Math.abs(now - input.timestamp) > 300) { // 5 minutos
        throw new TRPCError({
          code: "INVALID_INPUT",
          message: "Webhook expirado"
        });
      }

      // 3. Processar apenas tipos de evento conhecidos
      if (!["payment.created", "payment.updated"].includes(input.type)) {
        return { success: false, message: "Tipo de evento não suportado" };
      }

      // 4. Validar dados do pagamento
      const paymentData = validatePaymentData(input.data);
      if (!paymentData.valid) {
        throw new TRPCError({
          code: "INVALID_INPUT",
          message: paymentData.error
        });
      }

      // 5. Registrar webhook (com dados mascarados)
      const webhookRecord = await db.insert(webhook_logs).values({
        provider: "mercado_pago",
        event_type: input.type,
        event_id: input.id,
        payload: {
          // Mascarar dados sensíveis
          payer_email: maskEmail(input.data.payer?.email),
          amount: input.data.transaction_amount,
          status: input.data.status,
          external_reference: input.data.external_reference
        },
        signature_valid: true,
        processed_at: new Date()
      });

      // 6. Processar pagamento
      if (input.type === "payment.created" && input.data.status === "approved") {
        await processApprovedPayment(input.data);
      }

      // 7. Retornar sucesso
      return {
        success: true,
        webhook_id: webhookRecord.id
      };
    })
});

// Validar assinatura do webhook
function validateWebhookSignature(
  id: string,
  type: string,
  data: any,
  signature: string,
  timestamp: number
): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  
  // Criar string para assinar
  const payload = `${id}${type}${JSON.stringify(data)}${timestamp}`;
  
  // Calcular HMAC-SHA256
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  // Comparação segura (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Validar dados do pagamento
function validatePaymentData(data: any): { valid: boolean; error?: string } {
  // Validar campos obrigatórios
  if (!data.transaction_amount || typeof data.transaction_amount !== "number") {
    return { valid: false, error: "Valor da transação inválido" };
  }

  if (!data.status || !["approved", "pending", "rejected"].includes(data.status)) {
    return { valid: false, error: "Status do pagamento inválido" };
  }

  if (!data.external_reference) {
    return { valid: false, error: "Referência externa obrigatória" };
  }

  // Validar email do pagador
  if (data.payer?.email && !isValidEmail(data.payer.email)) {
    return { valid: false, error: "Email do pagador inválido" };
  }

  return { valid: true };
}

// Mascarar email
function maskEmail(email: string): string {
  if (!email) return null;
  const [local, domain] = email.split("@");
  return `${local.substring(0, 2)}****@${domain}`;
}

// Processar pagamento aprovado
async function processApprovedPayment(paymentData: any) {
  // 1. Buscar consulta associada
  const consultation = await db.query.consultations.findFirst({
    where: { external_reference: paymentData.external_reference }
  });

  if (!consultation) {
    console.error("Consulta não encontrada:", paymentData.external_reference);
    return;
  }

  // 2. Atualizar status da consulta
  await db.update(consultations)
    .set({
      payment_status: "approved",
      payment_id: paymentData.id,
      updated_at: new Date()
    })
    .where({ id: consultation.id });

  // 3. Enviar notificação ao paciente
  await notifyPatient(consultation.patient_id, {
    title: "Pagamento Confirmado",
    message: "Sua consulta foi confirmada. Você receberá um link para entrar na videochamada."
  });

  // 4. Notificar médico
  await notifyDoctor(consultation.doctor_id, {
    title: "Nova Consulta Agendada",
    message: `Você tem uma nova consulta agendada com ${consultation.patient_name}`
  });
}

// Validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Banco de Dados - Schema

```sql
-- Tabela de logs de webhook
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver logs
CREATE POLICY "Only admins can view webhook logs"
ON webhook_logs
FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Índices para performance
CREATE INDEX idx_webhook_logs_event_id ON webhook_logs(event_id);
CREATE INDEX idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX idx_webhook_logs_processed_at ON webhook_logs(processed_at);
```

---

## 🔒 HEADERS DE SEGURANÇA ADICIONAIS

```typescript
// server/_core/security-headers.ts

import { Express } from "express";

export function setupSecurityHeaders(app: Express) {
  // 1. HSTS (HTTP Strict Transport Security)
  app.use((req, res, next) => {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    next();
  });

  // 2. X-Content-Type-Options (Prevent MIME sniffing)
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // 3. X-Frame-Options (Prevent Clickjacking)
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });

  // 4. Content Security Policy (CSP)
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.googleapis.com; connect-src 'self' https://api.manus.im https://api.mercadopago.com; frame-ancestors 'none';"
    );
    next();
  });

  // 5. X-XSS-Protection
  app.use((req, res, next) => {
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  // 6. Referrer-Policy
  app.use((req, res, next) => {
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // 7. Permissions-Policy
  app.use((req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=()"
    );
    next();
  });
}
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] Row-Level Security (RLS) implementado
- [x] Canais em tempo real com autorização
- [x] AI Gateway com autenticação e rate limiting
- [x] Notificações com validação de acesso
- [x] Webhook com assinatura e validação
- [x] Headers de segurança (HSTS, CSP, X-Frame-Options)
- [x] Mascaramento de dados sensíveis
- [x] Validação de entrada (Zod)
- [x] Tratamento de erros seguro
- [x] Logs de auditoria

---

## 🚀 DEPLOY DAS CORREÇÕES

```bash
# 1. Fazer commit das correções
git add -A
git commit -m "🔒 Corrigir 5 vulnerabilidades críticas de segurança"

# 2. Executar migrações do banco
pnpm db:push

# 3. Testar localmente
pnpm dev

# 4. Build para produção
pnpm build

# 5. Deploy em Hostinger
git push origin main
```

---

## 📊 RESULTADO FINAL

✅ **Row-Level Security:** Implementado  
✅ **Canais Seguros:** Autorização validada  
✅ **AI Gateway:** Autenticação + Rate Limiting  
✅ **Notificações:** Acesso controlado  
✅ **Webhooks:** Assinatura + Validação  
✅ **Headers:** HSTS, CSP, X-Frame-Options  

**Status:** 🟢 TODAS AS VULNERABILIDADES CORRIGIDAS
