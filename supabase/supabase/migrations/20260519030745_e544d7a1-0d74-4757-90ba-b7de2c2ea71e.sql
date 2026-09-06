
-- Função interna restrita: só executável por postgres/service_role (não exposta ao PostgREST)
CREATE OR REPLACE FUNCTION private_get_brisa_cron_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'BRISA_CEO_SECRET_KEY' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private_get_brisa_cron_secret() FROM PUBLIC, anon, authenticated;

-- Reagenda crons lendo o secret real do vault em runtime
SELECT cron.unschedule('brisa-ig-auto-post-30min');
SELECT cron.unschedule('brisa-fb-auto-post-30min');

SELECT cron.schedule(
  'brisa-ig-auto-post-30min',
  '*/30 * * * *',
  $cron$
  SELECT net.http_post(
    url:='https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-ig-auto-post',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret', private_get_brisa_cron_secret()
    ),
    body:=jsonb_build_object('source','cron','at',now())
  );
  $cron$
);

SELECT cron.schedule(
  'brisa-fb-auto-post-30min',
  '*/30 * * * *',
  $cron$
  SELECT net.http_post(
    url:='https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-fb-auto-post',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret', private_get_brisa_cron_secret()
    ),
    body:=jsonb_build_object('source','cron','at',now())
  );
  $cron$
);
