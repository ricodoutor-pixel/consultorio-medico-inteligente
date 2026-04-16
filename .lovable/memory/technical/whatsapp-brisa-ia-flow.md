---
name: WhatsApp Brisa IA COO Flow
description: Brisa Singularity - COO + Social Media Manager + Lead Recovery + Clinical Handoff + Prescription Dispatch + Affiliate Tracking
type: feature
---

## Brisa COO — Singularidade IA 360°

**Papel**: Enfermeira, COO e Gestora de Tráfego. Segunda autoridade, reportando ao Dr. Edilson Bezerra.

### Edge Functions
- `whatsapp-chatbot`: IA conversacional via Twilio. Deep linking, UTM detection, clinical handoff, affiliate tagging, sentiment analysis.
- `brisa-reports`: Relatórios semanais (leads, conversão, receita, sentimento).
- `brisa-social-manager`: Postagens automáticas (Facebook/Instagram), recuperação de carrinho abandonado, métricas de marketing.
- `brisa-whatsapp-status`: Postagem diária no WhatsApp Status com links do site.
- `brisa-prescription-dispatch`: Envio automático de prescrição via WhatsApp pós-assinatura digital.

### Social Media Automation (brisa-social-manager)
- **action: generate_and_post** — 7 temas rotativos (RDC, CBD, depoimentos, quiz, marketplace, telemedicina, Planta-Coins)
- **action: recovery_check** — Busca leads com 15min de inatividade em shopping/triagem/preços, envia lembrete acolhedor
- **action: marketing_metrics** — Retorna posts publicados, leads orgânicos, recuperações, comissões de afiliados

### Deep Linking + UTM
- Mapa completo: shopping, planos, agenda, afiliado, ajuda, anvisa, quiz
- UTM: utm_source=brisa_ia, utm_medium=social/facebook/whatsapp
- Regra de retenção: nunca encerrar sem confirmação do paciente
- Saudação personalizada por origem (Instagram, Facebook, etc.)

### Clinical Handoff
- Ao detectar intenção "agendar" com 4+ mensagens, gera resumo clínico via AI
- Armazena em whatsapp_conversations.clinical_summary
- Campos DB: clinical_summary (text), clinical_summary_at (timestamptz), sentiment (text)

### Admin Dashboard (BrisaReportsModule)
- 8 StatCards: leads, conversas, conversão, receita, posts, leads orgânicos, recuperações, comissões
- Sentimento do paciente (positivo/neutro/negativo)
- Intenções detectadas
- Vendas assistidas pela Brisa (afiliados)

### Telemetry
- Threshold: 2s
- DB + AI Gateway + Twilio medidos
