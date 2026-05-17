DO $$
DECLARE v_existing int;
BEGIN
  SELECT count(*) INTO v_existing FROM cron.job WHERE jobname = 'alert-monitor-5min';
  IF v_existing > 0 THEN PERFORM cron.unschedule('alert-monitor-5min'); END IF;
END $$;

SELECT cron.schedule(
  'alert-monitor-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/alert-monitor',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('source','cron','ts', now())
  );
  $$
);