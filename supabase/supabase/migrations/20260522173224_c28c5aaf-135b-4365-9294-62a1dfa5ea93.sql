CREATE TABLE IF NOT EXISTS public.sre_alert_dedup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key text NOT NULL,
  alert_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  level text NOT NULL,
  title text,
  first_sent_at timestamptz NOT NULL DEFAULT now(),
  occurrences int NOT NULL DEFAULT 1,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sre_alert_dedup_unique UNIQUE (alert_key, alert_date)
);

ALTER TABLE public.sre_alert_dedup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read sre_alert_dedup" ON public.sre_alert_dedup;
CREATE POLICY "Admins read sre_alert_dedup" ON public.sre_alert_dedup
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_sre_alert_dedup_date ON public.sre_alert_dedup (alert_date DESC);