CREATE OR REPLACE FUNCTION public.sync_brisa_vault_secret(_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'BRISA_CEO_SECRET_KEY' LIMIT 1;
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(_value, 'BRISA_CEO_SECRET_KEY', 'Cron + edge function shared secret');
    RETURN 'created';
  ELSE
    PERFORM vault.update_secret(v_id, _value, 'BRISA_CEO_SECRET_KEY', 'Cron + edge function shared secret');
    RETURN 'updated';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_brisa_vault_secret(text) FROM PUBLIC, anon, authenticated;