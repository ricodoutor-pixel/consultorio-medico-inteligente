CREATE OR REPLACE FUNCTION public.verify_ot_watchdog_secret(_secret text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_secret text;
BEGIN
  IF _secret IS NULL OR length(_secret) < 16 THEN RETURN false; END IF;
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'OT_WATCHDOG_CRON_SECRET';
  RETURN v_secret IS NOT NULL AND v_secret = _secret;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_ot_watchdog_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_ot_watchdog_secret(text) TO service_role;