-- Remove broad SELECT policies that exposed sensitive columns.
-- Public/authenticated browsing should use the security_invoker views
-- public.clinic_profiles_public and public.doctors_public, which expose
-- only safe columns.

-- 1) clinic_profiles: drop the public SELECT policy.
--    Owners (Clinic owners can view their own clinic) and Admins
--    (Admins can view all clinics) policies remain.
DROP POLICY IF EXISTS "Public can read active clinic rows" ON public.clinic_profiles;

-- 2) doctors: drop the broad authenticated SELECT policy.
--    Self-access (Doctors can view own profile) and Admin (Admins can manage doctors)
--    policies remain. Patients/visitors must use public.doctors_public view.
DROP POLICY IF EXISTS "Authenticated users can view verified doctors" ON public.doctors;

-- Ensure the public views are readable
GRANT SELECT ON public.clinic_profiles_public TO anon, authenticated;
GRANT SELECT ON public.doctors_public TO anon, authenticated;