-- 1. OT orders: block anon reads + tighten owner policy to authenticated only
DROP POLICY IF EXISTS "OT orders: owner can read" ON public.orientacao_tecnica_orders;
CREATE POLICY "OT orders: owner can read"
  ON public.orientacao_tecnica_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OT orders: deny anon select"
  ON public.orientacao_tecnica_orders
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- 2. doctors: deny anon (public reads go through doctors_public view)
CREATE POLICY "doctors: deny anon select"
  ON public.doctors
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- 3. payment_webhooks: explicit anon deny
CREATE POLICY "payment_webhooks: deny anon select"
  ON public.payment_webhooks
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- 4. profiles: explicit anon deny (PII: CPF, DOB, phone)
CREATE POLICY "profiles: deny anon select"
  ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- 5. ebook_funnel_log: explicit anon deny
CREATE POLICY "ebook_funnel_log: deny anon select"
  ON public.ebook_funnel_log
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- 6. consultation_credit_audit: hide audit_phone from professionals (admin-only column)
REVOKE SELECT (audit_phone) ON public.consultation_credit_audit FROM authenticated, anon;
GRANT  SELECT (audit_phone) ON public.consultation_credit_audit TO service_role;
