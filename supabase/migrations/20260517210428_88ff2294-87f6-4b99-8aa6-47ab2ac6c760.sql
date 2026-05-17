-- Índice para consultas de janela curta por source/created_at
CREATE INDEX IF NOT EXISTS idx_error_logs_source_created_at
  ON public.error_logs (source, created_at DESC);

-- Índice para latência/falhas de envio Brisa em janelas curtas
CREATE INDEX IF NOT EXISTS idx_ai_events_brisa_dispatch
  ON public.ai_events (ai_name, event_type, created_at DESC);

-- Agendar alert-monitor a cada 5 minutos via pg_cron + pg_net (service_role)
DO $$
DECLARE
  v_existing int;
BEGIN
  SELECT count(*) INTO v_existing FROM cron.job WHERE jobname = 'alert-monitor-5min';
  IF v_existing > 0 THEN
    PERFORM cron.unschedule('alert-monitor-5min');
  END IF;
END $$;

SELECT cron.schedule(
  'alert-monitor-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/alert-monitor',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := jsonb_build_object('source','cron','ts', now())
  );
  $$
);