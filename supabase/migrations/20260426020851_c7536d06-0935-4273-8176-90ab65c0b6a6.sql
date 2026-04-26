-- Restrict clinic_profiles SELECT: remove public anon access to PII (doctor_name, whatsapp, email, domain).
-- The table is only consumed by the Admin panel (AdminClinicas.tsx); no public frontend reads it.
-- If a future public listing is needed, create a view exposing only non-PII columns.

DROP POLICY IF EXISTS "Public can view active clinics" ON public.clinic_profiles;

-- Allow authenticated users to view active clinics (preserves authenticated-app use cases),
-- but prevents anonymous scraping of doctor PII (whatsapp, email, domain).
CREATE POLICY "Authenticated can view active clinics"
  ON public.clinic_profiles
  FOR SELECT
  TO authenticated
  USING (active = true);
