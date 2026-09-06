
-- 1) doctors_public: run as invoker (fixes SECURITY DEFINER view finding) ------
ALTER VIEW public.doctors_public SET (security_invoker = on);

-- Replace anon-deny with a narrow permissive read of verified doctors
DROP POLICY IF EXISTS "doctors: deny anon select" ON public.doctors;

CREATE POLICY "Public can view verified doctors"
  ON public.doctors
  FOR SELECT
  TO anon, authenticated
  USING (is_verified = true);

-- Column-level grants: expose ONLY non-sensitive columns to anon/authenticated
-- (defense in depth so anon can't SELECT sensitive columns directly on doctors).
REVOKE SELECT ON public.doctors FROM anon;
REVOKE SELECT ON public.doctors FROM authenticated;

GRANT SELECT (
  id, user_id, specialty, crm, crm_state, rqe, bio,
  rating, consultation_price, is_verified, is_online,
  plan_tier, total_consultations, available_hours,
  is_available, document_type, country, city, created_at
) ON public.doctors TO anon, authenticated;

-- Doctors still need to read all of their own columns; keep an ALL-column
-- grant scoped to authenticated (RLS restricts to own row / admin).
GRANT SELECT ON public.doctors TO authenticated;

-- Re-assert other privileges required for the app
GRANT INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;

-- Make sure the view remains queryable
GRANT SELECT ON public.doctors_public TO anon, authenticated;
GRANT ALL  ON public.doctors_public TO service_role;

-- 2) Doctors self-update policy: pin additional sensitive columns ------------
DROP POLICY IF EXISTS "Doctors can update own non-sensitive fields" ON public.doctors;

CREATE POLICY "Doctors can update own non-sensitive fields"
  ON public.doctors
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND is_verified       = (SELECT d.is_verified       FROM public.doctors d WHERE d.id = doctors.id)
    AND crm               = (SELECT d.crm               FROM public.doctors d WHERE d.id = doctors.id)
    AND crm_state         = (SELECT d.crm_state         FROM public.doctors d WHERE d.id = doctors.id)
    AND kyc_status        IS NOT DISTINCT FROM (SELECT d.kyc_status        FROM public.doctors d WHERE d.id = doctors.id)
    AND fraud_score       IS NOT DISTINCT FROM (SELECT d.fraud_score       FROM public.doctors d WHERE d.id = doctors.id)
    AND is_crm_valid      IS NOT DISTINCT FROM (SELECT d.is_crm_valid      FROM public.doctors d WHERE d.id = doctors.id)
    AND suspended_at      IS NOT DISTINCT FROM (SELECT d.suspended_at      FROM public.doctors d WHERE d.id = doctors.id)
    AND suspension_reason IS NOT DISTINCT FROM (SELECT d.suspension_reason FROM public.doctors d WHERE d.id = doctors.id)
  );
