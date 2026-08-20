SELECT cron.schedule(
  'prescription_expiry_notify',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := concat(current_setting('app.settings.supabase_url', true), '/functions/v1/prescription-expiry-notify'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key', true))
    ),
    body := concat('{"time":"', now()::text, '"}')::jsonb
  ) AS request_id;
  $$
);