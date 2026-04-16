---
name: WhatsApp Brisa IA COO Flow
description: Brisa upgraded to COO role with full RAG context (ANVISA, Stripe, affiliates), sentiment analysis, Verdinho collaboration, and weekly admin reports
type: feature
---

## Brisa COO — Diretora Operacional IA

**Papel**: Segunda autoridade da plataforma, reportando ao Dr. Edilson Bezerra.

### Edge Functions
- `whatsapp-chatbot`: IA conversacional via Twilio WhatsApp. Modelo: Gemini 2.5 Flash.
- `brisa-reports`: Gera relatórios semanais (leads, conversão, receita, sentimento).

### RAG Context Injetado
- Leis: RDC 660/2022, RDC 327/2019, CFM 2.314/2022, LGPD
- Integrações: Stripe, Twilio, Supabase, Jitsi
- Negócio: Afiliados 3 gerações, Planta-Coins, política de reembolso, split 7%/93%
- Clínico: Full/Broad Spectrum, Isolado, condições tratáveis

### Colaboração Verdinho ↔ Brisa
- Verdinho: recepção do site, leads rápidos
- Brisa: casos complexos, WhatsApp, triagem clínica, pós-venda
- Compartilham: `leads_contatos` e `whatsapp_conversations`

### Painel ADM
- Aba "Relatórios da Brisa" no OmniChannelDashboard
- Métricas: leads, conversas, taxa conversão, receita, sentimento do paciente, intenções

### Telemetry
- DB, AI Gateway, Twilio latência medidos
- Health Check warn se total > 4s
