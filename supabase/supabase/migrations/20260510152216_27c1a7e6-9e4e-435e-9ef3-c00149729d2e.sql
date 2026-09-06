
CREATE TABLE IF NOT EXISTS public.cron_circuit_breaker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL UNIQUE,
  state text NOT NULL DEFAULT 'closed' CHECK (state IN ('closed','open','half_open')),
  consecutive_failures int NOT NULL DEFAULT 0,
  consecutive_successes int NOT NULL DEFAULT 0,
  last_failure_at timestamptz,
  last_success_at timestamptz,
  opened_at timestamptz,
  threshold int NOT NULL DEFAULT 5,
  cooldown_minutes int NOT NULL DEFAULT 30,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_circuit_breaker_state ON public.cron_circuit_breaker(state);

ALTER TABLE public.cron_circuit_breaker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view circuit breaker"
  ON public.cron_circuit_breaker FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage circuit breaker"
  ON public.cron_circuit_breaker FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cron_circuit_breaker_updated_at
  BEFORE UPDATE ON public.cron_circuit_breaker
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
