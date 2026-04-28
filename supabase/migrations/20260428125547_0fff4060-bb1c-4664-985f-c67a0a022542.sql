-- Remove public SELECT on clinic_profiles (which exposes email and whatsapp)
DROP POLICY IF EXISTS "Public can read safe columns of active clinics" ON public.clinic_profiles;

-- Create a safe public view exposing only non-sensitive columns
CREATE OR REPLACE VIEW public.clinic_profiles_public
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.clinic_profiles_public TO anon, authenticated;

-- Allow authenticated users to read full row only if they are the owner or admin (already covered),
-- and add a policy so authenticated users can see basic info via the view's underlying access.
-- The view uses security_invoker, so it requires SELECT on base table. We need a policy that allows
-- selecting active rows but only when accessed through trusted columns. Since RLS can't restrict by column,
-- we instead grant SELECT only on non-sensitive columns at the table level.
GRANT SELECT (id, doctor_name, specialty, domain, slug, logo_url, primary_color, secondary_color, tagline, description, active, created_at, updated_at)
  ON public.clinic_profiles TO anon, authenticated;

-- Add a permissive RLS policy for active rows so column-level grants take effect
CREATE POLICY "Public can read active clinic non-sensitive columns"
  ON public.clinic_profiles
  FOR SELECT
  TO anon, authenticated
  USING (active = true);