-- Prevent duplicate delivery confirmations for the same escrow (defense-in-depth for payout race)
CREATE UNIQUE INDEX IF NOT EXISTS delivery_confirmations_escrow_id_uniq
  ON public.delivery_confirmations (escrow_id);