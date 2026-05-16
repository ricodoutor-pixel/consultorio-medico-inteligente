---
name: Viral Loop Pós-Orientação
description: Card celebratório em /payment-success + WhatsApp automático via webhook MP com Planta-Coins ganhos + link de indicação
type: feature
---
## Onde o paciente vê

1. **Tela `/payment-success`**: componente `<PostConsultationViralLoop>` (src/components/PostConsultationViralLoop.tsx) com:
   - Card "Você ganhou R$15 em Planta-Coins"
   - Convite "+R$10 por indicação"
   - Busca/cria código em `referral_links`, gera `https://plantayraiz.com.br/?ref=CODE`
   - Botões Copiar e Compartilhar no WhatsApp (`wa.me/?text=...`)

2. **WhatsApp automático (Brisa via Evolution)**: dispara dentro do webhook `mercadopago-webhook` no momento em que `payment.status === "approved"` para uma consulta:
   - Credita Planta-Coins via RPC `increment_planta_coins` (mínimo 15 ou `floor(totalAmount/2)`)
   - Lê `profiles.full_name` e `profiles.phone` do paciente
   - Envia mensagem WhatsApp via `evolution-api-proxy` com saudação + coins ganhos + link `?ref=<patient_id>`
   - Falhas são logadas como `[viral-loop] non-fatal` — nunca quebra o fluxo de pagamento

Reusa o sistema de afiliados existente (`useReferralTracking`). Sem alteração financeira — apenas exposição visível do link.

Para mudar valores no componente: props `coinsEarned` e `bonusPerReferral` em `PaymentSuccess.tsx`.
Para mudar valores no webhook: ajustar fórmula `Math.max(15, Math.floor(totalAmount / 2))` em `supabase/functions/mercadopago-webhook/index.ts`.
