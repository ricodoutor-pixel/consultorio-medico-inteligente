---
name: Lead Funnel CRM
description: Tabela leads (status) + funnel_events + lead_status_history + /admin/leads (charts) + /admin/leads/:id + edge admin-lead-status-update
type: feature
---

## Database
- `public.leads.status` (`new|contacted|qualified|converted|lost`, default `new`)
- `public.funnel_events` — RLS: anon insert valida `funnel IN ('protocol_calculator','ebook_gate')`; admin pode inserir `funnel='lead_status'`
- `public.lead_status_history` — log completo de cada mudança (from/to, changed_by, note, whatsapp_sent, message, error). Apenas admin lê/insere.

## Tracking helper
- `src/lib/funnel-tracking.ts` → `trackFunnelEvent(funnel, event, metadata, leadId?)`
- session_id persistido em `sessionStorage` (`py_funnel_session`)
- FunnelName aceita `protocol_calculator | ebook_gate | lead_status`

## Eventos
- **protocol_calculator**: `calculator_viewed`, `step_answered`, `calculator_completed`, `whatsapp_clicked`
- **ebook_gate**: `ebook_viewed`, `ebook_form_submitted`, `ebook_pdf_downloaded`
- **lead_status**: `status_<new|contacted|qualified|converted|lost>` (emitido pela edge function)

## Edge function `admin-lead-status-update`
- Valida JWT + `has_role(admin)`.
- Atualiza `leads.status`, envia WhatsApp via Evolution API (`Brisa_CEO`) com template por status (contacted/qualified/converted/lost), aceita `custom_message`.
- Registra `lead_status_history` (com erro se falhar) e insere evento em `funnel_events`.
- Templates: pt-BR, assinatura Enfª Brisa / Dr. Edilson CRM 10963.

## Admin
- `/admin/leads` (AdminRoute):
  - Stats, filtros (busca, status, origem, 7/30/90/365 dias)
  - Charts (recharts): Linha leads/dia, Pie status, Bar origens, Funis com taxa de avanço por etapa
  - Tabela com select de status → abre modal (nota interna + checkbox WhatsApp + mensagem custom) → invoca edge function
  - Export CSV (BOM UTF-8)
- `/admin/leads/:id` (AdminLeadDetail):
  - Resumo + dados do formulário (metadata)
  - Histórico de status (com mensagem WhatsApp + status de envio)
  - Eventos do funil (direct lead_id + matched por session_id em metadata)
