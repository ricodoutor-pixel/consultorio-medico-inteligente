CREATE INDEX IF NOT EXISTS idx_brisa_orientacao_pending
  ON public.brisa_orientacao_payments (created_at DESC)
  WHERE status = 'approved' AND payout_released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_brisa_orientacao_released
  ON public.brisa_orientacao_payments (payout_released_at DESC)
  WHERE payout_released_at IS NOT NULL;