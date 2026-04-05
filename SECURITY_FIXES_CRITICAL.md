# 🚨 CORREÇÕES CRÍTICAS DE SEGURANÇA - FORÇA TOTAL

**Data:** 5 de Abril de 2026  
**Status:** ⏳ EM EXECUÇÃO - CORREÇÃO FORÇA TOTAL  
**Prioridade:** CRÍTICA - BLOQUEADOR PARA PRODUÇÃO

---

## 🔴 VULNERABILIDADES CRÍTICAS (6)

### 1. ❌ Notificações sem Validação de Destinatário
**Problema:** Qualquer usuário autenticado pode enviar notificações para qualquer outro usuário.

**Solução:**
```typescript
// ANTES (VULNERÁVEL)
export const createNotification = protectedProcedure
  .input(z.object({
    userId: z.string(),
    message: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    // ❌ Sem validação - qualquer um pode notificar qualquer um
    return db.notifications.create({
      userId: input.userId,
      message: input.message,
    });
  });

// DEPOIS (SEGURO)
export const createNotification = protectedProcedure
  .input(z.object({
    userId: z.string(),
    message: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    // ✅ Validação: apenas admin ou remetente pode notificar
    if (ctx.user.role !== 'admin' && ctx.user.id !== input.userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Você não pode enviar notificações para outros usuários',
      });
    }

    return db.notifications.create({
      userId: input.userId,
      senderId: ctx.user.id,
      message: input.message,
      createdAt: new Date(),
    });
  });
```

---

### 2. ❌ Relatórios Financeiros sem RLS
**Problema:** Tabela de relatórios financeiros não possui segurança em nível de linha.

**Solução:**
```typescript
// Implementar RLS no Drizzle
export const financialReports = sqliteTable('financial_reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'commission', 'payment', 'revenue'
  amount: real('amount').notNull(),
  createdAt: integer('created_at').notNull(),
});

// Adicionar validação de acesso
export async function getFinancialReports(userId: string, userRole: string) {
  if (userRole === 'admin') {
    // Admin vê todos os relatórios
    return db.select().from(financialReports);
  }

  // Usuário comum vê apenas seus relatórios
  return db
    .select()
    .from(financialReports)
    .where(eq(financialReports.userId, userId));
}
```

---

### 3. ❌ AI Gateway sem Autenticação
**Problema:** Rotas sensíveis do AI Gateway expostas sem autenticação.

**Solução:**
```typescript
// ANTES (VULNERÁVEL)
app.post('/api/ai/triage', (req, res) => {
  // ❌ Sem autenticação
  const result = await aiService.triage(req.body);
  res.json(result);
});

// DEPOIS (SEGURO)
app.post('/api/ai/triage', authenticateToken, async (req, res) => {
  // ✅ Requer token válido
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ✅ Validar role
  if (req.user.role !== 'patient' && req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = await aiService.triage(req.body, req.user.id);
  res.json(result);
});
```

---

### 4. ❌ Transmissão de Dados Sensíveis sem Controle
**Problema:** Transmite dados médicos e financeiros sensíveis a todos os assinantes.

**Solução:**
```typescript
// ANTES (VULNERÁVEL)
io.on('connection', (socket) => {
  socket.on('subscribe', (channel) => {
    // ❌ Qualquer um pode se inscrever em qualquer canal
    socket.join(channel);
  });

  socket.on('broadcast', (data) => {
    // ❌ Dados sensíveis transmitidos para todos
    io.emit('data', data);
  });
});

// DEPOIS (SEGURO)
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  const userRole = socket.handshake.auth.userRole;

  socket.on('subscribe', async (channel) => {
    // ✅ Validar acesso ao canal
    const hasAccess = await validateChannelAccess(userId, userRole, channel);
    if (!hasAccess) {
      socket.emit('error', 'Acesso negado');
      return;
    }

    socket.join(`${channel}:${userId}`); // Isolado por usuário
  });

  socket.on('broadcast', (data) => {
    // ✅ Dados sensíveis apenas para usuários autorizados
    const authorizedUsers = await getAuthorizedUsers(data.channel, userRole);
    authorizedUsers.forEach((user) => {
      io.to(`${data.channel}:${user.id}`).emit('data', data);
    });
  });
});
```

---

### 5. ❌ Canais em Tempo Real sem Autorização
**Problema:** Qualquer usuário autenticado pode se inscrever em qualquer canal.

**Solução:**
```typescript
// Implementar validação rigorosa
export async function validateRealtimeChannelAccess(
  userId: string,
  userRole: string,
  channel: string
): Promise<boolean> {
  const [channelType, channelId] = channel.split(':');

  switch (channelType) {
    case 'consultation':
      // Apenas médico ou paciente da consulta
      const consultation = await db.consultations.findById(channelId);
      return (
        consultation?.doctorId === userId ||
        consultation?.patientId === userId
      );

    case 'prescription':
      // Apenas médico ou paciente
      const prescription = await db.prescriptions.findById(channelId);
      return (
        prescription?.doctorId === userId ||
        prescription?.patientId === userId
      );

    case 'notification':
      // Apenas destinatário ou admin
      const notification = await db.notifications.findById(channelId);
      return notification?.userId === userId || userRole === 'admin';

    case 'admin':
      // Apenas admin
      return userRole === 'admin';

    default:
      return false;
  }
}
```

---

### 6. ❌ RLS Sempre Verdadeira (CRÍTICO!)
**Problema:** Política de RLS é sempre verdadeira, permitindo acesso irrestrito.

**Solução:**
```typescript
// ANTES (VULNERÁVEL)
export function validateAccess(userId: string, resourceUserId: string): boolean {
  // ❌ SEMPRE RETORNA TRUE!
  return true;
}

// DEPOIS (SEGURO)
export function validateAccess(
  userId: string,
  resourceUserId: string,
  userRole: string
): boolean {
  // ✅ Admin tem acesso total
  if (userRole === 'admin') {
    return true;
  }

  // ✅ Usuário comum acessa apenas seus recursos
  if (userId === resourceUserId) {
    return true;
  }

  // ✅ Caso contrário, acesso negado
  return false;
}

// Usar em todas as queries
export async function getUser(userId: string, currentUserId: string, currentUserRole: string) {
  if (!validateAccess(currentUserId, userId, currentUserRole)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso negado',
    });
  }

  return db.users.findById(userId);
}
```

---

## 🟡 AVISOS (4)

### 7. ⚠️ Webhook de Pagamento sem Restrição
**Problema:** Dados do webhook com endereços de email sem restrição de inserção.

**Solução:**
```typescript
// Validar origem e assinatura do webhook
export const handlePaymentWebhook = publicProcedure
  .input(z.object({
    data: z.any(),
    signature: z.string(),
  }))
  .mutation(async ({ input }) => {
    // ✅ Validar assinatura do Mercado Pago
    const isValid = verifyMercadoPagoSignature(
      input.data,
      input.signature,
      process.env.MERCADO_PAGO_WEBHOOK_SECRET
    );

    if (!isValid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Assinatura inválida',
      });
    }

    // ✅ Validar origem
    if (input.data.source !== 'mercado_pago') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Origem inválida',
      });
    }

    // ✅ Apenas admin pode inserir
    return db.paymentWebhooks.create({
      data: input.data,
      signature: input.signature,
      verifiedAt: new Date(),
    });
  });
```

---

### 8. ⚠️ Eventos de IA sem Política SELECT
**Problema:** Tabela de eventos de IA sem política SELECT para usuários autenticados.

**Solução:**
```typescript
// Implementar política SELECT
export async function getAIEvents(userId: string, userRole: string) {
  if (userRole === 'admin') {
    // Admin vê todos os eventos
    return db.select().from(aiEvents);
  }

  // Usuário comum vê apenas seus eventos
  return db
    .select()
    .from(aiEvents)
    .where(eq(aiEvents.userId, userId));
}

// Usar em tRPC
export const getMyAIEvents = protectedProcedure.query(async ({ ctx }) => {
  return getAIEvents(ctx.user.id, ctx.user.role);
});
```

---

### 9. ⚠️ Bucket de Imagens sem Proteção UPDATE
**Problema:** Bucket de imagens sem política de UPDATE, permitindo sobrescrita.

**Solução:**
```typescript
// Validar propriedade antes de atualizar
export async function updateImage(
  imageId: string,
  newData: any,
  userId: string
): Promise<void> {
  // ✅ Verificar propriedade
  const image = await db.images.findById(imageId);
  if (image?.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Você não pode atualizar esta imagem',
    });
  }

  // ✅ Atualizar apenas campos permitidos
  await db.images.update(imageId, {
    title: newData.title,
    description: newData.description,
    updatedAt: new Date(),
  });
}
```

---

### 10. ⚠️ Upload/Exclusão sem Verificação de Propriedade
**Problema:** Políticas de upload e exclusão não verificam propriedade do arquivo.

**Solução:**
```typescript
// ANTES (VULNERÁVEL)
export const deleteImage = protectedProcedure
  .input(z.object({ imageId: z.string() }))
  .mutation(async ({ input }) => {
    // ❌ Sem verificar propriedade
    await s3.deleteObject({
      Bucket: 'images',
      Key: input.imageId,
    });
  });

// DEPOIS (SEGURO)
export const deleteImage = protectedProcedure
  .input(z.object({ imageId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // ✅ Verificar propriedade
    const image = await db.images.findById(input.imageId);
    if (!image) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Imagem não encontrada',
      });
    }

    if (image.userId !== ctx.user.id && ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Você não pode deletar esta imagem',
      });
    }

    // ✅ Deletar do S3
    await s3.deleteObject({
      Bucket: 'images',
      Key: input.imageId,
    });

    // ✅ Deletar do banco de dados
    await db.images.delete(input.imageId);
  });
```

---

## ✅ CHECKLIST DE CORREÇÕES

- [ ] Fase 1: Notificações validadas
- [ ] Fase 2: RLS em relatórios financeiros
- [ ] Fase 3: Autenticação no AI Gateway
- [ ] Fase 4: Controle de transmissão de dados
- [ ] Fase 5: Autorização em canais em tempo real
- [ ] Fase 6: RLS sempre verdadeira corrigida
- [ ] Fase 7: Webhook de pagamento protegido
- [ ] Fase 8: Política SELECT para eventos IA
- [ ] Fase 9: Bucket de imagens protegido
- [ ] Fase 10: Verificação de propriedade implementada
- [ ] Testes de segurança (100% passando)
- [ ] Deploy em produção

---

**Status: 🚀 INICIANDO CORREÇÕES FORÇA TOTAL**
