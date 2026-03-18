# 🔗 GUIA DE INTEGRAÇÃO - MERCADO PAGO E TWILIO
## Planta & Raiz 2026-2030

**Versão:** 1.0  
**Data:** 18 de Março de 2026  
**Status:** PRONTO PARA IMPLEMENTAÇÃO

---

## 📦 INTEGRAÇÃO MERCADO PAGO

### 1. Configuração Inicial

```bash
# Instalar SDK do Mercado Pago
npm install mercadopago

# Variáveis de ambiente (.env)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_XXXXXXXXXXXXXXX
MERCADO_PAGO_PUBLIC_KEY=APP_USR_XXXXXXXXXXXXXXX
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret
```

### 2. Implementar tRPC Procedure para Checkout

```typescript
// server/routers/payments.ts
import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const paymentsRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({
      planId: z.number(),
      planName: z.string(),
      amount: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const preference = {
          items: [
            {
              title: input.planName,
              quantity: 1,
              unit_price: input.amount,
            },
          ],
          payer: {
            email: ctx.user?.email || "user@example.com",
          },
          back_urls: {
            success: `${process.env.VITE_FRONTEND_URL}/payment/success`,
            failure: `${process.env.VITE_FRONTEND_URL}/payment/failure`,
            pending: `${process.env.VITE_FRONTEND_URL}/payment/pending`,
          },
          notification_url: `${process.env.VITE_FRONTEND_URL}/api/webhooks/mercado-pago`,
          external_reference: `USER_${ctx.user?.id}_PLAN_${input.planId}`,
          auto_return: "approved",
        };

        const response = await mercadopago.preferences.create(preference);
        
        return {
          checkoutUrl: response.body.init_point,
          preferenceId: response.body.id,
        };
      } catch (error) {
        console.error("Erro ao criar checkout:", error);
        throw new Error("Falha ao criar checkout");
      }
    }),

  // Verificar status de pagamento
  getPaymentStatus: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const payment = await mercadopago.payment.findById(input.paymentId);
        return {
          status: payment.body.status,
          statusDetail: payment.body.status_detail,
          amount: payment.body.transaction_amount,
        };
      } catch (error) {
        console.error("Erro ao buscar status:", error);
        throw new Error("Falha ao buscar status de pagamento");
      }
    }),
});
```

### 3. Implementar Webhook de Pagamento

```typescript
// server/_core/index.ts
import express from "express";

app.post("/api/webhooks/mercado-pago", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const paymentId = data.id;
      const payment = await mercadopago.payment.findById(paymentId);
      const paymentData = payment.body;

      if (paymentData.status === "approved") {
        // Extrair informações do pagamento
        const externalRef = paymentData.external_reference; // USER_123_PLAN_2
        const [, userId, , planId] = externalRef.split("_");

        // 1. Atualizar banco de dados
        await db.insert(subscriptions).values({
          userId: parseInt(userId),
          planId: parseInt(planId),
          status: "active",
          startDate: new Date(),
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        // 2. Registrar transação
        await db.insert(transactions).values({
          userId: parseInt(userId),
          type: "subscription",
          amount: paymentData.transaction_amount,
          adminFee: 0, // Sem taxa para assinantes
          netAmount: paymentData.transaction_amount,
          status: "completed",
        });

        // 3. Disparar comissões de afiliados (3 níveis)
        await triggerAffiliateCommissions(userId, planId, paymentData.transaction_amount);

        // 4. Enviar e-mail de confirmação
        await sendSubscriptionConfirmationEmail(userId, planId);

        // 5. Notificar owner
        await notifyOwner({
          title: "Nova Assinatura",
          content: `Usuário ${userId} assinou plano ${planId}. Valor: R$ ${paymentData.transaction_amount}`,
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    res.status(500).json({ error: "Erro ao processar webhook" });
  }
});
```

### 4. Frontend - Botão de Checkout

```typescript
// client/src/pages/Plans.tsx
import { trpc } from "@/lib/trpc";

export function PlanCard({ plan }) {
  const createCheckout = trpc.payments.createCheckout.useMutation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { checkoutUrl } = await createCheckout.mutateAsync({
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
      });
      
      // Redirecionar para Mercado Pago
      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error("Erro ao criar checkout");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
    >
      {isLoading ? "Processando..." : "Assinar Agora"}
    </Button>
  );
}
```

### 5. Fluxo de Comissões Automáticas

```typescript
// server/routers/payments.ts
async function triggerAffiliateCommissions(
  userId: number,
  planId: number,
  amount: number
) {
  // 1. Buscar afiliado que indicou este usuário
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.referrerAffiliateId) return; // Sem afiliado

  // 2. Calcular comissões em 3 níveis
  const level1Affiliate = await db.query.affiliates.findFirst({
    where: eq(affiliates.id, user.referrerAffiliateId),
  });

  if (level1Affiliate) {
    // Nível 1: 50%
    const level1Commission = amount * 0.50;
    await db.insert(commissions).values({
      affiliateId: level1Affiliate.id,
      level: 1,
      transactionAmount: amount,
      commissionAmount: level1Commission,
      status: "approved",
    });

    // Nível 2: 5% (se houver afiliado que indicou o nível 1)
    if (level1Affiliate.referrerAffiliateId) {
      const level2Commission = amount * 0.05;
      await db.insert(commissions).values({
        affiliateId: level1Affiliate.referrerAffiliateId,
        level: 2,
        transactionAmount: amount,
        commissionAmount: level2Commission,
        status: "approved",
      });

      // Nível 3: 2% (se houver afiliado que indicou o nível 2)
      const level2Affiliate = await db.query.affiliates.findFirst({
        where: eq(affiliates.id, level1Affiliate.referrerAffiliateId),
      });

      if (level2Affiliate?.referrerAffiliateId) {
        const level3Commission = amount * 0.02;
        await db.insert(commissions).values({
          affiliateId: level2Affiliate.referrerAffiliateId,
          level: 3,
          transactionAmount: amount,
          commissionAmount: level3Commission,
          status: "approved",
        });
      }
    }
  }

  // 3. Atualizar saldos pendentes
  await updateAffiliateBalances();
}
```

---

## 📱 INTEGRAÇÃO TWILIO (WhatsApp)

### 1. Configuração Inicial

```bash
# Instalar SDK do Twilio
npm install twilio

# Variáveis de ambiente (.env)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+5511999999999
```

### 2. Implementar Envio de Código via WhatsApp

```typescript
// server/services/whatsapp.ts
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppCode(phoneNumber: string): Promise<string> {
  // Gerar código aleatório de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phoneNumber}`,
      body: `Seu código de verificação Planta & Raiz é: ${code}\n\nNunca compartilhe este código com ninguém.`,
    });

    return code;
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    throw new Error("Falha ao enviar código via WhatsApp");
  }
}

export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string
): Promise<void> {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
}
```

### 3. Implementar tRPC Procedure para Verificação

```typescript
// server/routers/auth.ts
import { sendWhatsAppCode } from "../services/whatsapp";

export const authRouter = router({
  sendWhatsAppCode: publicProcedure
    .input(z.object({
      phoneNumber: z.string().regex(/^\+\d{10,15}$/),
    }))
    .mutation(async ({ input }) => {
      try {
        const code = await sendWhatsAppCode(input.phoneNumber);

        // Armazenar código em cache (Redis) com TTL de 10 minutos
        await redis.setex(
          `whatsapp_code:${input.phoneNumber}`,
          600,
          code
        );

        return {
          success: true,
          message: "Código enviado via WhatsApp",
        };
      } catch (error) {
        throw new Error("Falha ao enviar código");
      }
    }),

  verifyWhatsAppCode: publicProcedure
    .input(z.object({
      phoneNumber: z.string(),
      code: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      try {
        // Buscar código armazenado
        const storedCode = await redis.get(
          `whatsapp_code:${input.phoneNumber}`
        );

        if (!storedCode || storedCode !== input.code) {
          throw new Error("Código inválido ou expirado");
        }

        // Marcar como verificado
        await redis.setex(
          `whatsapp_verified:${input.phoneNumber}`,
          3600,
          "true"
        );

        // Limpar código
        await redis.del(`whatsapp_code:${input.phoneNumber}`);

        return {
          success: true,
          message: "WhatsApp verificado com sucesso",
        };
      } catch (error) {
        throw new Error("Falha ao verificar código");
      }
    }),
});
```

### 4. Frontend - Fluxo de Verificação

```typescript
// client/src/pages/Onboarding.tsx
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function OnboardingFlow() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");

  const sendCode = trpc.auth.sendWhatsAppCode.useMutation();
  const verifyCode = trpc.auth.verifyWhatsAppCode.useMutation();

  const handleSendCode = async () => {
    try {
      await sendCode.mutateAsync({
        phoneNumber: `+55${phoneNumber.replace(/\D/g, "")}`,
      });
      setStep("code");
      toast.success("Código enviado via WhatsApp!");
    } catch (error) {
      toast.error("Erro ao enviar código");
    }
  };

  const handleVerifyCode = async () => {
    try {
      await verifyCode.mutateAsync({
        phoneNumber: `+55${phoneNumber.replace(/\D/g, "")}`,
        code,
      });
      toast.success("WhatsApp verificado!");
      // Redirecionar para próxima etapa
    } catch (error) {
      toast.error("Código inválido");
    }
  };

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          <Input
            placeholder="(11) 99999-9999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <Button onClick={handleSendCode} disabled={sendCode.isPending}>
            Enviar Código
          </Button>
        </>
      ) : (
        <>
          <Input
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
          <Button onClick={handleVerifyCode} disabled={verifyCode.isPending}>
            Verificar Código
          </Button>
        </>
      )}
    </div>
  );
}
```

### 5. Notificações Automáticas

```typescript
// server/services/notifications.ts
import { sendWhatsAppNotification } from "./whatsapp";

export async function notifyPaymentConfirmed(
  phoneNumber: string,
  planName: string,
  amount: number
) {
  const message = `✅ Pagamento confirmado!\n\nPlano: ${planName}\nValor: R$ ${amount.toFixed(2)}\n\nBem-vindo à Planta & Raiz! 🌿`;
  await sendWhatsAppNotification(phoneNumber, message);
}

export async function notifyAffiliateCommission(
  phoneNumber: string,
  amount: number,
  level: number
) {
  const message = `💰 Você recebeu uma comissão!\n\nNível ${level}: R$ ${amount.toFixed(2)}\n\nAcesse seu dashboard para mais detalhes.`;
  await sendWhatsAppNotification(phoneNumber, message);
}

export async function notifyMedicationRefill(
  phoneNumber: string,
  medicationName: string
) {
  const message = `💊 Hora de reabastecer!\n\nMedicamento: ${medicationName}\n\nClique para reordenar: https://plantaraiz.com.br/refill`;
  await sendWhatsAppNotification(phoneNumber, message);
}
```

---

## 🔄 FLUXO COMPLETO DE ONBOARDING

```
1. Usuário acessa plantaraiz.com.br
   ↓
2. Clica em "Começar Agora"
   ↓
3. Autentica com Manus OAuth
   ↓
4. Seleciona perfil (Médico, Lojista, Afiliado)
   ↓
5. Insere número de WhatsApp
   ↓
6. Twilio envia código via WhatsApp
   ↓
7. Usuário confirma código
   ↓
8. Perfil criado no banco de dados
   ↓
9. E-mail de boas-vindas enviado
   ↓
10. Dashboard personalizado ativado
   ↓
11. Opção de assinar plano SaaS
   ↓
12. Clica em "Assinar Agora"
   ↓
13. Mercado Pago checkout criado
   ↓
14. Usuário completa pagamento
   ↓
15. Webhook confirma pagamento
   ↓
16. Assinatura ativada
   ↓
17. Comissões de afiliados disparadas (3 níveis)
   ↓
18. Notificações via WhatsApp enviadas
   ↓
19. Dashboard atualizado com benefícios
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Mercado Pago
- [ ] Criar conta e obter credenciais
- [ ] Instalar SDK
- [ ] Implementar tRPC procedure de checkout
- [ ] Implementar webhook de pagamento
- [ ] Testar fluxo completo em sandbox
- [ ] Testar fluxo completo em produção
- [ ] Implementar comissões automáticas
- [ ] Adicionar tratamento de erros e retries

### Twilio
- [ ] Criar conta e obter credenciais
- [ ] Instalar SDK
- [ ] Implementar envio de código
- [ ] Implementar verificação de código
- [ ] Testar em sandbox
- [ ] Implementar notificações automáticas
- [ ] Adicionar tratamento de erros

### Testes
- [ ] Testar pagamento com cartão de crédito
- [ ] Testar pagamento com PIX
- [ ] Testar rejeição de pagamento
- [ ] Testar envio de código WhatsApp
- [ ] Testar verificação de código
- [ ] Testar notificações automáticas

---

## 📊 ESTIMATIVA DE TEMPO

| Tarefa | Tempo |
|--------|-------|
| Integração Mercado Pago | 2-3 dias |
| Integração Twilio | 1-2 dias |
| Testes completos | 1-2 dias |
| Deploy em produção | 1 dia |
| **TOTAL** | **5-8 dias** |

---

**Próximo Passo:** Iniciar implementação de Mercado Pago (Semana 1)
