DROP POLICY IF EXISTS "Public can view active clinics" ON public.clinic_profiles;
CREATE POLICY "Public can view active clinics"
  ON public.clinic_profiles
  FOR SELECT
  TO anon, authenticated
  USING (active = true);