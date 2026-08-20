
-- 1. brisa_orientacao_payments: allow service_role to insert/update
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brisa_orientacao_payments' AND policyname='service_role_insert_brisa_orientacao_payments') THEN
    CREATE POLICY "service_role_insert_brisa_orientacao_payments"
      ON public.brisa_orientacao_payments FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brisa_orientacao_payments' AND policyname='service_role_update_brisa_orientacao_payments') THEN
    CREATE POLICY "service_role_update_brisa_orientacao_payments"
      ON public.brisa_orientacao_payments FOR UPDATE
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- 2. medicoes_cardiacas: remove anonymous NULL user_id insert
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='medicoes_cardiacas' AND cmd='INSERT' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.medicoes_cardiacas', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "users_insert_own_medicoes_cardiacas"
  ON public.medicoes_cardiacas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_role_insert_medicoes_cardiacas"
  ON public.medicoes_cardiacas FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 3. consultation_credit_audit: mask audit_phone from professionals
DROP POLICY IF EXISTS "professional view own audit" ON public.consultation_credit_audit;

CREATE OR REPLACE VIEW public.consultation_credit_audit_professional
WITH (security_invoker = on) AS
SELECT
  id, consultation_id, professional_id, patient_id, rating_id,
  stars, amount, status, reason, created_at,
  CASE
    WHEN audit_phone IS NULL OR length(audit_phone) < 4 THEN audit_phone
    ELSE repeat('*', greatest(length(audit_phone) - 4, 0)) || right(audit_phone, 4)
  END AS audit_phone_masked
FROM public.consultation_credit_audit
WHERE professional_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin'::app_role);

CREATE POLICY "admin view all consultation_credit_audit"
  ON public.consultation_credit_audit FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));
