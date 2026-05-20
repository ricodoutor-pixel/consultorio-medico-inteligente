-- Re-enable IG auto-post cron (mirrors to FB + Threads)
DO $$
DECLARE v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'BRISA_CEO_SECRET_KEY' LIMIT 1;

  -- Drop any leftover variants
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN ('brisa-ig-auto-post-30min','brisa-fb-auto-post-30min','ig-auto-post-30min','fb-auto-post-30min');

  -- IG every 30 min (function itself mirrors to FB + Threads)
  PERFORM cron.schedule(
    'brisa-ig-auto-post-30min',
    '*/30 * * * *',
    format($f$
      SELECT net.http_post(
        url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-ig-auto-post',
        headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',%L),
        body := '{}'::jsonb
      );
    $f$, v_secret)
  );

  -- Fire one post NOW (first of the 6 queued)
  PERFORM net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-ig-auto-post',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
    body := '{}'::jsonb
  );
END $$;