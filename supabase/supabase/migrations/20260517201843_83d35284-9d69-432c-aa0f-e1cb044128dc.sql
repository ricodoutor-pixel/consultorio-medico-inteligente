
-- 1) payment_contingency_config: restritiva nega tudo que não seja admin
CREATE POLICY "pcc_deny_non_admin"
  ON public.payment_contingency_config
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) doctors: remover SELECT público amplo (frontend deve usar view doctors_public)
DROP POLICY IF EXISTS "Public can view verified active doctors" ON public.doctors;

-- 3) consultation_queue: política de médicos limitada a matched_doctor_id
DROP POLICY IF EXISTS "Doctors see own matched entries" ON public.consultation_queue;
CREATE POLICY "Doctors see own matched entries"
  ON public.consultation_queue
  FOR SELECT
  TO authenticated
  USING (
    matched_doctor_id IN (
      SELECT d.id FROM public.doctors d WHERE d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 4) Restringir políticas overly permissive ao papel service_role
DROP POLICY IF EXISTS "Service role can insert reconciliation" ON public.financial_reconciliation;
CREATE POLICY "Service role can insert reconciliation"
  ON public.financial_reconciliation
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update reconciliation" ON public.financial_reconciliation;
CREATE POLICY "Service role can update reconciliation"
  ON public.financial_reconciliation
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role inserts triage" ON public.brisa_triage_severity;
CREATE POLICY "Service role inserts triage"
  ON public.brisa_triage_severity
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role updates triage" ON public.brisa_triage_severity;
CREATE POLICY "Service role updates triage"
  ON public.brisa_triage_severity
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert errors" ON public.error_autohealing;
CREATE POLICY "Service role can insert errors"
  ON public.error_autohealing
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "pph_service_write" ON public.payment_provider_health;
CREATE POLICY "pph_service_write"
  ON public.payment_provider_health
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 5) Reagendar cron hostinger-sync-daily para usar service_role_key em vez do anon JWT
DO $$
BEGIN
  PERFORM cron.unschedule('hostinger-sync-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'hostinger-sync-daily',
  '0 3 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/hostinger-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := jsonb_build_object('triggered_by', 'cron', 'at', now())
  );
  $cron$
);
