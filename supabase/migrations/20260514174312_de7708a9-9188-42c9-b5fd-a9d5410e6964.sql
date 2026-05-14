
-- Manus CEO reports table
CREATE TABLE IF NOT EXISTS public.manus_ceo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  report_type text NOT NULL DEFAULT 'nightly',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  markdown text,
  sent_to text,
  delivery_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manus_ceo_reports_date ON public.manus_ceo_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_manus_ceo_reports_type ON public.manus_ceo_reports(report_type);

ALTER TABLE public.manus_ceo_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view manus reports" ON public.manus_ceo_reports;
CREATE POLICY "Admins can view manus reports"
  ON public.manus_ceo_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Brisa sentiment columns (idempotent)
ALTER TABLE public.whatsapp_brisa_log
  ADD COLUMN IF NOT EXISTS sentiment_score numeric,
  ADD COLUMN IF NOT EXISTS is_negative boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_brisa_log_created ON public.whatsapp_brisa_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brisa_log_sentiment ON public.whatsapp_brisa_log(sentiment_score) WHERE sentiment_score IS NOT NULL;
