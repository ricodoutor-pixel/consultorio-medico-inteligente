
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clinic_profiles') THEN
    DROP POLICY IF EXISTS "Public can view active clinics" ON public.clinic_profiles;
    CREATE POLICY "Public can view active clinics"
      ON public.clinic_profiles FOR SELECT
      TO anon, authenticated
      USING (active = true);
  END IF;
END $$;

DROP POLICY IF EXISTS "Service role inserts errors" ON public.system_errors;
CREATE POLICY "Service role inserts errors"
  ON public.system_errors FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role inserts alerts" ON public.system_alerts;
CREATE POLICY "Service role inserts alerts"
  ON public.system_alerts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated can read active personas" ON public.ai_personas;
CREATE POLICY "Authenticated can read active personas"
  ON public.ai_personas FOR SELECT
  TO authenticated
  USING (active = true);

DROP VIEW IF EXISTS public.doctors_public CASCADE;
CREATE VIEW public.doctors_public WITH (security_invoker = true) AS
  SELECT
    id, user_id, specialty, crm, crm_state, rqe, bio, rating,
    consultation_price, is_verified, is_online, plan_tier,
    total_consultations, available_hours, created_at
  FROM public.doctors;
GRANT SELECT ON public.doctors_public TO anon, authenticated;
