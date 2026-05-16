---
name: Viral Loop Pós-Orientação
description: Card celebratório em /payment-success com Planta-Coins ganhos + link de indicação WhatsApp
type: feature
---
Após pagamento confirmado em `/payment-success`, exibimos `<PostConsultationViralLoop>` (src/components/PostConsultationViralLoop.tsx) com:

1. **Planta-Coins ganhos** (default R$15): card celebratório.
2. **Convite para indicação** (default +R$10 por amigo): busca/cria código em `referral_links`, gera `https://plantayraiz.com.br/?ref=CODE`, oferece botão Copiar e Compartilhar no WhatsApp (`wa.me/?text=...`).

Reusa o sistema de afiliados existente (`useReferralTracking`). Sem alteração financeira — apenas exposição visível do link.

Para mudar valores: props `coinsEarned` e `bonusPerReferral` em `PaymentSuccess.tsx`.
