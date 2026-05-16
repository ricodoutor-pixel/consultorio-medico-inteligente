---
name: Google Review Auto-Request
description: Cron diário envia WhatsApp da Brisa pedindo avaliação Google 24h após orientação técnica
type: feature
---
Edge function `brisa-google-review-request` rodada diariamente via pg_cron `brisa-google-review-daily` às 13h UTC (10h BRT).

**Lógica:**
1. Busca em `orientacao_tecnica_orders` registros com `dispatched_at` entre 24h e 14 dias atrás, `google_review_requested_at IS NULL`, `patient_name != 'ANONIMIZADO'`.
2. Para cada um, envia WhatsApp via Twilio (whatsapp:+551191363154 / Brisa) com mensagem personalizada + link Google Review.
3. Marca `google_review_requested_at = now()` no sucesso.

**Configuração:**
- Constante `GOOGLE_REVIEW_URL` em `supabase/functions/brisa-google-review-request/index.ts` — atualizar com link real do Google Business ("Compartilhar avaliação").
- Twilio credentials: `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` (já configurados).

**Coluna nova:** `orientacao_tecnica_orders.google_review_requested_at TIMESTAMPTZ` + índice parcial `idx_ot_orders_review_pending`.
