
-- 1) doctors_public: expose safely to public (only verified doctors, only safe columns already)
ALTER VIEW public.doctors_public SET (security_invoker = false);
GRANT SELECT ON public.doctors_public TO anon, authenticated;

-- 2) funnel_events: allow anon/authenticated to insert (RLS policy already restricts fields)
GRANT INSERT ON public.funnel_events TO anon, authenticated;
GRANT SELECT ON public.funnel_events TO authenticated;
-- has_role must be callable by anon so the funnel_events INSERT policy check works for guests
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- 3) Enrich handle_new_user trigger so signup metadata (phone, country, role, user_type) lands in profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role text := COALESCE(meta->>'role', meta->>'signup_role', 'paciente');
  v_user_type text := CASE
    WHEN v_role IN ('medico','profissional','cuidador','doctor') THEN 'doctor'
    WHEN v_role IN ('farmacia','lojista','pharmacy') THEN 'pharmacy'
    WHEN v_role IN ('produtor','producer') THEN 'producer'
    ELSE 'patient'
  END;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, country, signup_role, user_type)
  VALUES (
    NEW.id,
    COALESCE(meta->>'full_name', ''),
    NULLIF(meta->>'phone', ''),
    NULLIF(meta->>'country', ''),
    v_role,
    v_user_type
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name    = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    phone        = COALESCE(EXCLUDED.phone, public.profiles.phone),
    country      = COALESCE(EXCLUDED.country, public.profiles.country),
    signup_role  = COALESCE(EXCLUDED.signup_role, public.profiles.signup_role),
    user_type    = COALESCE(EXCLUDED.user_type, public.profiles.user_type);
  RETURN NEW;
END;
$$;
