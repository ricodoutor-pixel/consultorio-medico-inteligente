---
name: Lead Funnel CRM
description: Tabela leads (status) + funnel_events (rastreamento público) + /admin/leads + tracking em ProtocolCalculator e EbookGate
type: feature
---

## Database
- `public.leads` ganhou coluna `status` (`new|contacted|qualified|converted|lost`, default `new`)
- `public.funnel_events` — RLS aceita anon INSERT validado por `funnel IN ('protocol_calculator','ebook_gate')`
- Apenas admins (`has_role(uid,'admin')`) leem leads e eventos

## Tracking helper
- `src/lib/funnel-tracking.ts` → `trackFunnelEvent(funnel, event, metadata, leadId?)`
- session_id auto-persistido em sessionStorage (`py_funnel_session`)

## Eventos emitidos
- **protocol_calculator**: `calculator_viewed`, `step_answered`, `calculator_completed`, `whatsapp_clicked`
- **ebook_gate**: `ebook_viewed`, `ebook_form_submitted`, `ebook_pdf_downloaded`

## WhatsApp da Calculadora
Mensagem inicial agora inclui: nome do paciente + razão CBD:THC + espectro + todas as respostas (condição, idade, meds, intensidade, experiência prévia).
Lead salvo automaticamente em `leads` ao clicar (se nome+WA preenchidos), score=60, source=`protocol_calculator_home`.

## Admin
- Rota: `/admin/leads` (guarda `AdminRoute`)
- Stats: total, convertidos, taxa de conversão, janela
- Funil agregado por evento (últimos N dias)
- Filtros: busca livre, status, origem, período (7/30/90/365 dias)
- Export CSV com BOM UTF-8 (planilhas brasileiras)
- Mudança de status inline com `UPDATE`
