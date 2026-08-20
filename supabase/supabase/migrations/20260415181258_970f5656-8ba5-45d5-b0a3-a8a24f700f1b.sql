-- Schedule auto-renewal daily at 08:00
SELECT cron.schedule(
  'auto_renewal_daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := concat(current_setting('app.settings.supabase_url', true), '/functions/v1/auto-renewal'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key', true))
    ),
    body := concat('{"time":"', now()::text, '"}')::jsonb
  ) AS request_id;
  $$
);

-- Schedule revenue tracker daily at 23:55
SELECT cron.schedule(
  'revenue_tracker_daily',
  '55 23 * * *',
  $$
  SELECT net.http_post(
    url := concat(current_setting('app.settings.supabase_url', true), '/functions/v1/revenue-tracker'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key', true))
    ),
    body := concat('{"time":"', now()::text, '"}')::jsonb
  ) AS request_id;
  $$
);