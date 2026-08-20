-- Harden clinic_profiles and saude_verde_partners against anon access via RESTRICTIVE deny-anon policies
CREATE POLICY "deny_anon_clinic_profiles" ON public.clinic_profiles
  AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_saude_verde_partners" ON public.saude_verde_partners
  AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);