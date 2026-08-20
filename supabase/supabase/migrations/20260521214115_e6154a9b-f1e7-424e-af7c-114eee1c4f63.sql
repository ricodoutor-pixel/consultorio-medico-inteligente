SELECT cron.schedule(
  'brisa-image-pool-refresh-weekly',
  '0 4 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-image-pool-refresh',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.service_role_key', true)),
    body := jsonb_build_object('count', 20, 'source', 'weekly_cron')
  );
  $$
);