CREATE INDEX IF NOT EXISTS idx_pph_checked_at ON public.payment_provider_health (checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);