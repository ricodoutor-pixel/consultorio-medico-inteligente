-- 1) Remove public access to clinic_profiles base table (sensitive email/whatsapp)
--    Anonymous/public consumers should use the existing public.clinic_profiles_public view instead.
DROP POLICY IF EXISTS "Public can view active clinics" ON public.clinic_profiles;

-- 2) Tighten triage_abandonment_tracking SELECT to block anonymous null-uid match
DROP POLICY IF EXISTS "Users view own triage tracking" ON public.triage_abandonment_tracking;
CREATE POLICY "Users view own triage tracking"
  ON public.triage_abandonment_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 3) Add explicit admin DELETE policy on the orientacao-tecnica private bucket
DROP POLICY IF EXISTS "orientacao-tecnica admin delete" ON storage.objects;
CREATE POLICY "orientacao-tecnica admin delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'orientacao-tecnica'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );