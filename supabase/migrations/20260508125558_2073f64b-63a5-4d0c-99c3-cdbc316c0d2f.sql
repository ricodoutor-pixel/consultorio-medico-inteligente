-- 1) Tabela de alertas DOU/ANVISA
CREATE TABLE IF NOT EXISTS public.anvisa_dou_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  title text NOT NULL,
  url text NOT NULL UNIQUE,
  summary text,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anvisa_dou_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage dou alerts" ON public.anvisa_dou_alerts;
CREATE POLICY "Admins manage dou alerts" ON public.anvisa_dou_alerts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_dou_alerts_created ON public.anvisa_dou_alerts(created_at DESC);

-- 2) Extensões necessárias para schedulers
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3) Schedulers nativos (substituem dependência de n8n)
-- Usa anon key publicável (igual frontend) + service role no header customizado
DO $$
DECLARE
  fn_url text := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';
BEGIN
  -- Limpa duplicados antes de reagendar
  PERFORM cron.unschedule(jobname) FROM cron.job
   WHERE jobname IN ('dou-anvisa-daily','pubmed-weekly-import','prescriptions-expiry-check','brisa-weekly-report');

  PERFORM cron.schedule(
    'dou-anvisa-daily',
    '0 7 * * *',
    format($f$ select net.http_post(
      url:='%s/dou-anvisa-monitor',
      headers:=jsonb_build_object('Content-Type','application/json','apikey','%s','Authorization','Bearer ' || current_setting('app.service_role_key', true)),
      body:='{}'::jsonb
    ); $f$, fn_url, anon_key)
  );

  PERFORM cron.schedule(
    'pubmed-weekly-import',
    '0 3 * * 0',
    format($f$ select net.http_post(
      url:='%s/import-pubmed-bulk',
      headers:=jsonb_build_object('Content-Type','application/json','apikey','%s','Authorization','Bearer ' || current_setting('app.service_role_key', true)),
      body:='{"max_results":300}'::jsonb
    ); $f$, fn_url, anon_key)
  );

  PERFORM cron.schedule(
    'prescriptions-expiry-check',
    '0 6 * * *',
    format($f$ select net.http_post(
      url:='%s/prescription-dispatch',
      headers:=jsonb_build_object('Content-Type','application/json','apikey','%s','Authorization','Bearer ' || current_setting('app.service_role_key', true)),
      body:='{"mode":"expiry_check"}'::jsonb
    ); $f$, fn_url, anon_key)
  );

  PERFORM cron.schedule(
    'brisa-weekly-report',
    '0 8 * * 0',
    format($f$ select net.http_post(
      url:='%s/brisa-reports',
      headers:=jsonb_build_object('Content-Type','application/json','apikey','%s','Authorization','Bearer ' || current_setting('app.service_role_key', true)),
      body:='{"period":"weekly"}'::jsonb
    ); $f$, fn_url, anon_key)
  );
END $$;