
-- 1. doctors: add public SELECT for verified, active, non-suspended doctors
CREATE POLICY "Public can view verified active doctors"
ON public.doctors
FOR SELECT
TO anon, authenticated
USING (
  is_verified = true
  AND kyc_status = 'approved'
  AND suspended_at IS NULL
  AND COALESCE(fraud_score, 100) >= 50
);

-- 2. error_autohealing: explicit service-role INSERT
CREATE POLICY "Service role can insert errors"
ON public.error_autohealing
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. financial_reconciliation: explicit service-role write policies
CREATE POLICY "Service role can insert reconciliation"
ON public.financial_reconciliation
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update reconciliation"
ON public.financial_reconciliation
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Replace permissive `true` policies on internal/service tables
DROP POLICY IF EXISTS "Service role inserts triage" ON public.brisa_triage_severity;
DROP POLICY IF EXISTS "Service role updates triage" ON public.brisa_triage_severity;
CREATE POLICY "Service role inserts triage"
ON public.brisa_triage_severity
FOR INSERT
TO service_role
WITH CHECK (true);
CREATE POLICY "Service role updates triage"
ON public.brisa_triage_severity
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service inserts ebook funnel" ON public.ebook_funnel_log;
CREATE POLICY "Service inserts ebook funnel"
ON public.ebook_funnel_log
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "pph_service_write" ON public.payment_provider_health;
CREATE POLICY "pph_service_write"
ON public.payment_provider_health
FOR INSERT
TO service_role
WITH CHECK (true);
