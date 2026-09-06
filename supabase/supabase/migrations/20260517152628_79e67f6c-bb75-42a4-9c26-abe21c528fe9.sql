CREATE OR REPLACE FUNCTION public.get_passport_by_token(_token text)
RETURNS TABLE(
  id uuid,
  appointment_id uuid,
  metadata jsonb,
  expires_at timestamptz,
  created_at timestamptz,
  is_expired boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passport_id uuid;
  v_expired boolean;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN RETURN; END IF;

  SELECT p.id, (p.expires_at < now())
    INTO v_passport_id, v_expired
  FROM public.patient_passports p
  WHERE p.token = _token
  LIMIT 1;

  IF v_passport_id IS NULL THEN RETURN; END IF;

  UPDATE public.patient_passports
     SET access_count = access_count + 1,
         last_accessed_at = now()
   WHERE patient_passports.id = v_passport_id;

  RETURN QUERY
  SELECT
    p.id,
    p.appointment_id,
    CASE WHEN v_expired
         THEN jsonb_build_object('patient_display_name', p.metadata->>'patient_display_name')
         ELSE p.metadata END,
    p.expires_at,
    p.created_at,
    v_expired
  FROM public.patient_passports p
  WHERE p.id = v_passport_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_passport_by_token(text) TO anon, authenticated;