ALTER TABLE public.payment_notify_log
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS http_status integer,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS amount_brl numeric(10,2),
  ADD COLUMN IF NOT EXISTS service text;

CREATE TABLE public.payment_notify_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES public.payment_notify_log(id) ON DELETE CASCADE,
  external_reference text NOT NULL,
  attempt_no integer NOT NULL,
  trigger text NOT NULL DEFAULT 'auto',
  status text NOT NULL CHECK (status IN ('sent','failed')),
  http_status integer,
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_notify_attempts_log_idx ON public.payment_notify_attempts(log_id, attempt_no);
GRANT SELECT ON public.payment_notify_attempts TO authenticated;
GRANT ALL ON public.payment_notify_attempts TO service_role;
ALTER TABLE public.payment_notify_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_notify_attempts_admin_read ON public.payment_notify_attempts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));