CREATE OR REPLACE FUNCTION public.trigger_brisa_social_post(_target text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public, net
AS $$
DECLARE
  v_secret text;
  v_url text;
  v_req_id bigint;
BEGIN
  IF _target NOT IN ('ig','fb') THEN
    RAISE EXCEPTION 'invalid target: %', _target;
  END IF;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'BRISA_CEO_SECRET_KEY'
  LIMIT 1;

  IF v_secret IS NULL OR length(v_secret) = 0 THEN
    RAISE EXCEPTION 'BRISA_CEO_SECRET_KEY missing in vault';
  END IF;

  v_url := CASE _target
    WHEN 'ig' THEN 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-ig-auto-post'
    WHEN 'fb' THEN 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-fb-auto-post'
  END;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := '{}'::jsonb
  ) INTO v_req_id;

  RETURN v_req_id;
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_brisa_social_post(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_brisa_social_post(text) TO postgres, service_role;