# Guia de Uso da Skill: telemedicina-cannabis-platform

## Introdução

Este guia explica como usar a skill `telemedicina-cannabis-platform` durante o desenvolvimento da plataforma.

## Quando Usar a Skill

### ✅ Use a Skill Para:

1. **Criar um novo router tRPC**
   - Seguir padrão de validação com Zod
   - Implementar tratamento de erros
   - Adicionar logging e notificações

2. **Criar um novo componente React**
   - Aplicar design system (cores, tipografia)
   - Garantir responsividade mobile-first
   - Usar componentes shadcn/ui

3. **Implementar segurança**
   - Row-Level Security (RLS)
   - Autorização de usuários
   - Validação de webhooks

4. **Criar testes E2E**
   - Usar Playwright
   - Testar fluxos completos
   - Validar performance

5. **Implementar features**
   - Prescrição RDC 660
   - Telemedicina
   - Notificações em tempo real
   - Pagamentos

## Como Acessar a Skill

### Opção 1: Ler Localmente

```bash
cat /home/ubuntu/skills/telemedicina-cannabis-platform/SKILL.md
```

### Opção 2: Acessar Referências

```bash
ls /home/ubuntu/skills/telemedicina-cannabis-platform/references/
# security-checklist.md
# database-schema.sql
# api-endpoints.md
# marketing-strategy.md
# seo-strategy.md
# deployment-guide.md
```

### Opção 3: Usar Templates

```bash
ls /home/ubuntu/skills/telemedicina-cannabis-platform/templates/
# router-template.ts
# component-template.tsx
# test-template.spec.ts
# env-template.txt
```

## Exemplos de Uso

### Exemplo 1: Criar um Novo Router

**Problema:** Preciso criar um novo router para gerenciar prescrições.

**Solução com a Skill:**

```bash
# 1. Ler a skill
cat /home/ubuntu/skills/telemedicina-cannabis-platform/SKILL.md

# 2. Copiar template
cp /home/ubuntu/skills/telemedicina-cannabis-platform/templates/router-template.ts \
   server/routers/prescriptions.ts

# 3. Editar e implementar
# - Adicionar validação com Zod
# - Implementar procedures
# - Adicionar segurança (RLS)
# - Adicionar notificações
# - Adicionar logging

# 4. Testar
npm test

# 5. Fazer commit
git add server/routers/prescriptions.ts
git commit -m "✨ FEATURE: Novo router de prescrições"
```

### Exemplo 2: Criar um Novo Componente

**Problema:** Preciso criar um componente de prescrição.

**Solução com a Skill:**

```bash
# 1. Ler a skill para design system
# Cores: Verde Floresta (#10B981) + Off-white (#F9FAFB)
# Tipografia: Poppins + Inter
# Componentes: shadcn/ui

# 2. Copiar template
cp /home/ubuntu/skills/telemedicina-cannabis-platform/templates/component-template.tsx \
   client/src/pages/PrescriptionForm.tsx

# 3. Implementar
# - Aplicar design system
# - Usar shadcn/ui
# - Garantir responsividade
# - Integrar com tRPC

# 4. Testar responsividade
# - Mobile (320px)
# - Tablet (768px)
# - Desktop (1920px)

# 5. Fazer commit
git add client/src/pages/PrescriptionForm.tsx
git commit -m "🎨 UI: Novo componente de prescrição"
```

### Exemplo 3: Implementar Segurança

**Problema:** Preciso garantir que usuários só vejam seus próprios dados.

**Solução com a Skill:**

```typescript
// 1. Ler referência de segurança
// /home/ubuntu/skills/telemedicina-cannabis-platform/references/security-checklist.md

// 2. Implementar RLS
const data = await db.prescriptions
  .where("user_id", "=", ctx.user.id)
  .select();

// 3. Validar autorização
if (!userHasAccess(ctx.user, prescription)) {
  throw new TRPCError({ code: "FORBIDDEN" });
}

// 4. Testar segurança
// - Tentar acessar dados de outro usuário
// - Verificar que é bloqueado
// - Verificar logs de auditoria
```

### Exemplo 4: Criar Testes E2E

**Problema:** Preciso testar o fluxo completo de prescrição.

**Solução com a Skill:**

```bash
# 1. Copiar template
cp /home/ubuntu/skills/telemedicina-cannabis-platform/templates/test-template.spec.ts \
   tests/prescription.spec.ts

# 2. Implementar testes
# - Login
# - Criar prescrição
# - Validar dados
# - Exportar PDF
# - Logout

# 3. Executar testes
npm run test:e2e

# 4. Validar cobertura
# - Mínimo 80% de cobertura
# - Todos os fluxos cobertos
```

## Checklist de Conformidade

Antes de fazer commit, verificar:

```markdown
- [ ] Validação com Zod implementada
- [ ] Tratamento de erros completo
- [ ] Segurança (RLS, autorização) implementada
- [ ] Notificações configuradas
- [ ] Logging/audit implementado
- [ ] Design system aplicado (cores, tipografia)
- [ ] Responsividade testada (mobile, tablet, desktop)
- [ ] Componentes shadcn/ui utilizados
- [ ] Testes E2E criados (mínimo 2)
- [ ] Documentação atualizada
- [ ] Commit message descritivo
```

## Padrões da Skill

### Padrão 1: Validação com Zod

```typescript
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  dosage: z.number().positive(),
});

export const prescriptionRouter = router({
  create: protectedProcedure
    .input(inputSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementação
    }),
});
```

### Padrão 2: Tratamento de Erros

```typescript
try {
  const result = await db.prescriptions.create(data);
  
  // Notificar usuário
  await notifyUser({
    title: "Prescrição criada",
    content: "Sua prescrição foi criada com sucesso",
  });
  
  // Log de auditoria
  await auditLog({
    action: "PRESCRIPTION_CREATED",
    userId: ctx.user.id,
    resourceId: result.id,
  });
  
  return result;
} catch (error) {
  logger.error("Failed to create prescription", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Falha ao criar prescrição",
  });
}
```

### Padrão 3: Segurança

```typescript
// RLS em queries
const prescriptions = await db.prescriptions
  .where("user_id", "=", ctx.user.id)
  .select();

// Validação de autorização
if (prescription.user_id !== ctx.user.id) {
  throw new TRPCError({ code: "FORBIDDEN" });
}

// Validação de role
if (ctx.user.role !== "doctor") {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

### Padrão 4: Design System

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PrescriptionForm() {
  return (
    <Card className="bg-white border-border">
      <div className="space-y-4">
        <Input 
          placeholder="Nome do medicamento"
          className="border-border"
        />
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Criar Prescrição
        </Button>
      </div>
    </Card>
  );
}
```

### Padrão 5: Responsividade

```tsx
export function PrescriptionForm() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Mobile: 1 coluna */}
      {/* Tablet: 2 colunas */}
      {/* Desktop: 3 colunas */}
      
      <Card className="p-4 md:p-6 lg:p-8">
        {/* Conteúdo responsivo */}
      </Card>
    </div>
  );
}
```

## Troubleshooting

### Problema: "Tailwind class not found"

**Solução:**
- Use classes suportadas (w-10, h-10, não w-12, h-12)
- Use inline CSS se necessário
- Consulte referência de Tailwind v4

### Problema: "tRPC type error"

**Solução:**
- Verifique que input matches output type
- Use Zod para validação
- Consulte referência de tRPC

### Problema: "Teste E2E falhando"

**Solução:**
- Verifique seletores CSS
- Aguarde elementos carregarem
- Consulte referência de Playwright

## Próximos Passos

1. [ ] Ler a skill completa
2. [ ] Revisar exemplos de uso
3. [ ] Implementar novo router/componente
4. [ ] Seguir checklist de conformidade
5. [ ] Fazer commit com message descritivo
6. [ ] Fazer push para GitHub

## Suporte

Para dúvidas:
1. Consulte `/home/ubuntu/skills/telemedicina-cannabis-platform/SKILL.md`
2. Consulte exemplos em `/home/ubuntu/EXEMPLOS_APLICACAO_SKILL.md`
3. Consulte referências em `/home/ubuntu/skills/telemedicina-cannabis-platform/references/`

---

**Guia de Uso:** 07/04/2026  
**Status:** 🟢 PRONTO PARA USAR  
**Versão:** 1.0.0
