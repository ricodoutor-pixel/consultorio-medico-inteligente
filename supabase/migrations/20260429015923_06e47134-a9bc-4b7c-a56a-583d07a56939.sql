
-- ========== CLINIC PROFILES ==========
DROP POLICY IF EXISTS "Public can read active clinic non-sensitive columns" ON public.clinic_profiles;
DROP POLICY IF EXISTS "Public can read active clinic rows" ON public.clinic_profiles;

REVOKE ALL ON public.clinic_profiles FROM anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clinic_profiles TO authenticated;

GRANT SELECT (
  id, owner_user_id, slug, domain, doctor_name, specialty, description,
  tagline, logo_url, primary_color, secondary_color, active, created_at, updated_at
) ON public.clinic_profiles TO anon, authenticated;

GRANT SELECT (email, whatsapp) ON public.clinic_profiles TO authenticated;

CREATE POLICY "Public can read active clinic rows"
  ON public.clinic_profiles
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- ========== DOCTORS ==========
DROP POLICY IF EXISTS "Authenticated users can view verified doctors" ON public.doctors;

REVOKE ALL ON public.doctors FROM anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctors TO authenticated;

GRANT SELECT (
  id, user_id, bio, specialty, rating, consultation_price,
  is_online, is_verified, total_consultations, available_hours,
  organization_id, created_at, updated_at
) ON public.doctors TO anon, authenticated;

GRANT SELECT (
  crm, crm_state, rqe, kyc_status, document_type,
  is_crm_valid, last_crm_check
) ON public.doctors TO authenticated;

CREATE POLICY "Authenticated users can view verified doctors"
  ON public.doctors
  FOR SELECT
  TO authenticated
  USING (is_verified = true);

-- Drop and recreate doctors_public view with the correct columns
DROP VIEW IF EXISTS public.doctors_public;

CREATE VIEW public.doctors_public WITH (security_invoker = on) AS
SELECT id, user_id, bio, specialty, rating, consultation_price,
       is_online, is_verified, total_consultations, available_hours,
       organization_id, created_at
FROM public.doctors
WHERE is_verified = true;

GRANT SELECT ON public.doctors_public TO anon, authenticated;
