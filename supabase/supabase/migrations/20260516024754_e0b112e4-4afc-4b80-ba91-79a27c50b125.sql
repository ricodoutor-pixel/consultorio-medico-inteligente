-- Adiciona coluna para rastrear quando o pedido de avaliação Google foi enviado
ALTER TABLE public.orientacao_tecnica_orders
ADD COLUMN IF NOT EXISTS google_review_requested_at TIMESTAMPTZ;

-- Índice para acelerar a busca do cron job (orientações concluídas há 24h sem review enviada)
CREATE INDEX IF NOT EXISTS idx_ot_orders_review_pending
ON public.orientacao_tecnica_orders (dispatched_at)
WHERE google_review_requested_at IS NULL AND dispatched_at IS NOT NULL;