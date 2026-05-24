
-- Remove agendamento anterior (se existir) e cria novo de hora em hora
DO $$
DECLARE
  v_secret text;
  v_url text := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-ig-auto-post';
BEGIN
  -- Recupera secret do vault
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'BRISA_CEO_SECRET_KEY'
  LIMIT 1;

  -- Desagenda jobs antigos
  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN ('brisa-ig-auto-post-hourly','brisa-ig-auto-post-30min');

  -- Agenda de hora em hora
  PERFORM cron.schedule(
    'brisa-ig-auto-post-hourly',
    '0 * * * *',
    format($f$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'x-cron-secret', %L,
          'Authorization', 'Bearer ' || %L
        ),
        body := '{}'::jsonb
      );
    $f$, v_url, v_secret, v_secret)
  );

  -- Dispara uma postagem AGORA
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret', v_secret,
      'Authorization', 'Bearer ' || v_secret
    ),
    body := '{}'::jsonb
  );
END $$;
