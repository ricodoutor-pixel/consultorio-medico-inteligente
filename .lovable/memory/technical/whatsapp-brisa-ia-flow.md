---
name: WhatsApp Brisa IA COO Flow
description: Brisa COO with deep linking, clinical handoff, prescription dispatch, affiliate tagging, daily WhatsApp Status, and sentiment analysis
type: feature
---

## Brisa COO — Diretora Operacional IA (360°)

**Papel**: Segunda autoridade da plataforma, reportando ao Dr. Edilson Bezerra.

### Edge Functions
- `whatsapp-chatbot`: IA conversacional via Twilio WhatsApp. Modelo: Gemini 2.5 Flash. Deep linking, clinical handoff, affiliate tagging.
- `brisa-reports`: Gera relatórios semanais (leads, conversão, receita, sentimento, affiliate conversions).
- `brisa-whatsapp-status`: Postagem diária automática no WhatsApp Status com links para o site.
- `brisa-prescription-dispatch`: Webhook para envio automático de prescrição via WhatsApp após assinatura digital.

### Deep Linking (Navegação Inteligente)
- shopping → /shopping | preco → /planos | agendar → /falar-com-especialista
- afiliado → /dashboard/parceiro | reembolso → /ajuda | anvisa → /como-funciona
- Regra de retenção: nunca encerrar sem confirmação do paciente

### Clinical Handoff (Prontuário Inteligente)
- Ao detectar intenção "agendar" com 4+ mensagens, gera resumo clínico via AI
- Armazena em `whatsapp_conversations.clinical_summary`
- Formato: Sintomas, Duração, Intensidade, Tratamentos anteriores, Urgência

### Prescription Dispatch
- Webhook recebe: patient_phone, prescription_url, doctor_name
- Envia via Twilio com link do PDF + guia ANVISA

### Affiliate Tagging
- Detecta `ref=CODE` nas mensagens e tagga lead com `affiliate:CODE` + `brisa_assisted`
- Visível no BrisaReportsModule (Vendas Assistidas pela Brisa)

### RAG Context Injetado
- Leis: RDC 660/2022, RDC 327/2019, CFM 2.314/2022, LGPD
- Integrações: Stripe, Twilio, Supabase, Jitsi
- Negócio: Afiliados 3 gerações, Planta-Coins, política de reembolso, split 7%/93%
- Clínico: Full/Broad Spectrum, Isolado, condições tratáveis

### Telemetry
- Threshold reduzido para 2s (era 4s)
- DB, AI Gateway, Twilio latência medidos
- Health Check warn se total > 2s
