
-- Recreate the public clinic view with security_invoker (no privilege escalation)
DROP VIEW IF EXISTS public.clinic_profiles_public;

CREATE VIEW public.clinic_profiles_public
WITH (security_invoker = true)
AS
SELECT
  id,
  doctor_name,
  specialty,
  domain,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  tagline,
  description,
  active,
  created_at,
  updated_at
FROM public.clinic_profiles
WHERE active = true;

REVOKE ALL ON public.clinic_profiles_public FROM PUBLIC;
GRANT SELECT ON public.clinic_profiles_public TO anon, authenticated;

-- Allow anonymous + authenticated readers to SELECT only the safe columns
-- of active clinic rows on the base table. Sensitive columns (email, whatsapp,
-- owner_user_id) are NOT granted, so even direct table queries cannot read them.
GRANT SELECT (
  id, doctor_name, specialty, domain, slug, logo_url,
  primary_color, secondary_color, tagline, description,
  active, created_at, updated_at
) ON public.clinic_profiles TO anon, authenticated;

-- Add a row-level rule that lets the column-restricted public reads succeed
-- for active rows. Owners and admins keep their existing full-row policies.
CREATE POLICY "Public can read safe columns of active clinics"
  ON public.clinic_profiles
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Lock down remaining SECURITY DEFINER functions still callable by authenticated.
-- These are used inside RLS / server-side code; revoking direct EXECUTE does not
-- affect policy evaluation (which runs as the table owner).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_doctor_performance(integer, numeric, numeric, text) FROM authenticated;
