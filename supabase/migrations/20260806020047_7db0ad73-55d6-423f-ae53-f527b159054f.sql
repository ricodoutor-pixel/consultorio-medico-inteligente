-- 1. clinic_profiles: simplify tautological WITH CHECK and scope to authenticated
DROP POLICY IF EXISTS "Owners can update their own clinic" ON public.clinic_profiles;
CREATE POLICY "Owners can update their own clinic"
  ON public.clinic_profiles
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- 2. patient_passports: explicit anon deny (defense in depth for access tokens)
DROP POLICY IF EXISTS "deny_anon_patient_passports" ON public.patient_passports;
CREATE POLICY "deny_anon_patient_passports"
  ON public.patient_passports
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 3. doctors: restrictive guard so anonymous readers/realtime subscribers can
--    never receive unverified doctor rows (KYC/fraud/suspension data)
DROP POLICY IF EXISTS "anon_only_verified_doctors" ON public.doctors;
CREATE POLICY "anon_only_verified_doctors"
  ON public.doctors
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (is_verified = true);