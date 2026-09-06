
-- Security-definer helper: exposes ONLY display name + avatar for verified doctors
CREATE OR REPLACE FUNCTION public.get_doctor_display(_user_id uuid)
RETURNS TABLE(full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = _user_id
    AND EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = _user_id AND d.is_verified = true
    )
$$;

GRANT EXECUTE ON FUNCTION public.get_doctor_display(uuid) TO anon, authenticated;

-- Rebuild doctors_public view sourcing name/avatar via the helper
DROP VIEW IF EXISTS public.doctors_public;

CREATE VIEW public.doctors_public
WITH (security_invoker = on) AS
SELECT
  d.id,
  d.user_id,
  d.specialty,
  d.crm,
  d.crm_state,
  d.rqe,
  d.bio,
  d.rating,
  d.consultation_price,
  d.is_verified,
  d.is_online,
  d.plan_tier,
  d.total_consultations,
  d.available_hours,
  d.is_available,
  d.document_type,
  d.country,
  d.city,
  d.created_at,
  disp.full_name,
  disp.avatar_url
FROM public.doctors d
LEFT JOIN LATERAL public.get_doctor_display(d.user_id) disp ON true
WHERE d.is_verified = true;

GRANT SELECT ON public.doctors_public TO anon, authenticated;
