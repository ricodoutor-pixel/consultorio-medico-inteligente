CREATE OR REPLACE FUNCTION public.get_passport_by_token(_token text)
 RETURNS TABLE(id uuid, appointment_id uuid, metadata jsonb, expires_at timestamp with time zone, created_at timestamp with time zone, is_expired boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_passport_id uuid;
  v_expired boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
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
    jsonb_build_object(
      'patient_display_name', p.metadata->>'patient_display_name',
      'valid_until', to_char(p.expires_at, 'YYYY-MM-DD"T"HH24:MI:SSOF'),
      'issued_at', to_char(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF')
    ) AS metadata,
    p.expires_at,
    p.created_at,
    v_expired
  FROM public.patient_passports p
  WHERE p.id = v_passport_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_passport_by_token(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_passport_by_token(text) TO authenticated;