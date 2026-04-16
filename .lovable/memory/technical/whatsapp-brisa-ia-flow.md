---
name: WhatsApp Brisa IA COO Flow
description: Brisa Singularity - COO + Social Media + Retention Engine + Crisis Alert + Clinical Handoff + Prescription Dispatch + Affiliate Tracking
type: feature
---

## Brisa COO — Singularidade IA 360° + Retenção

### Edge Functions (6 total)
- `whatsapp-chatbot`: IA conversacional, deep linking, UTM, opt-out, clinical handoff, affiliate tagging
- `brisa-reports`: Relatórios semanais operacionais
- `brisa-social-manager`: Postagens automáticas, recuperação de carrinho, métricas marketing
- `brisa-whatsapp-status`: Status diário WhatsApp com links do site
- `brisa-prescription-dispatch`: Envio automático de prescrição pós-assinatura
- `brisa-retention`: Régua de relacionamento, win-back, restock, crise, métricas retenção

### Retention Engine (brisa-retention)
- **follow_up**: D+7 acolhimento, D+30 restock, D+60 renovação
- **win_back**: 90+ dias inativos → cupom Planta-Coins
- **restock_alert**: 5 dias antes do óleo acabar (30ml = 30 dias)
- **crisis_check**: Se sentimento negativo >50% na semana → alerta WhatsApp ao ADM
- **retention_metrics**: Taxa retenção, follow-ups enviados, churn rate, alerta crise

### Opt-out
- Palavras-chave: "parar", "cancelar lembrete", "não me mande", etc.
- Tag `no_followup` respeitada em todos os follow-ups e win-back

### Admin Dashboard (BrisaReportsModule)
- 12 StatCards: operacional (4) + marketing (4) + retenção (4)
- Alerta de Crise visual (⚠️ ATIVO / ✅ Normal)
- Sentimento, intenções, vendas assistidas por afiliado
