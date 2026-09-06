
CREATE TABLE IF NOT EXISTS public.brisa_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  user_ref TEXT,
  message_in TEXT,
  message_out TEXT,
  provider TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'ok',
  http_status INT,
  latency_ms INT,
  error TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brisa_interaction_logs_created ON public.brisa_interaction_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brisa_interaction_logs_channel ON public.brisa_interaction_logs (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brisa_interaction_logs_status ON public.brisa_interaction_logs (status, created_at DESC);

ALTER TABLE public.brisa_interaction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read brisa_interaction_logs" ON public.brisa_interaction_logs;
CREATE POLICY "admins read brisa_interaction_logs"
ON public.brisa_interaction_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
