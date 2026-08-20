CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  message_id text NOT NULL,
  channel text,
  sender text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, message_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_created_at
  ON public.webhook_idempotency (created_at DESC);

ALTER TABLE public.webhook_idempotency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins can read webhook idempotency" ON public.webhook_idempotency;
CREATE POLICY "admins can read webhook idempotency"
  ON public.webhook_idempotency
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-cleanup older than 30 days (best-effort; safe to run repeatedly)
CREATE OR REPLACE FUNCTION public.prune_webhook_idempotency()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.webhook_idempotency WHERE created_at < now() - interval '30 days';
$$;