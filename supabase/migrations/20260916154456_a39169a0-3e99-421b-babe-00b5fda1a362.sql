-- 1. Doctors: allow self-created profile (fraud_score defaults to 100)
DROP POLICY IF EXISTS "Users can create own doctor profile" ON public.doctors;
CREATE POLICY "Users can create own doctor profile"
ON public.doctors FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(is_verified, false) = false
  AND COALESCE(is_approved_by_admin, false) = false
  AND COALESCE(kyc_status, 'pending') = 'pending'
  AND COALESCE(approval_status, 'pending') = 'pending'
  AND COALESCE(is_crm_valid, false) = false
);

-- 2. vendor_products: vendors may update their own rows; approval flags guarded by trigger
DROP POLICY IF EXISTS "Vendors manage own products" ON public.vendor_products;

CREATE POLICY "Vendors insert own products"
ON public.vendor_products FOR INSERT TO authenticated
WITH CHECK (
  vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = auth.uid())
  AND COALESCE(is_approved_by_admin, false) = false
  AND COALESCE(is_showcase, false) = false
);

CREATE POLICY "Vendors select own products"
ON public.vendor_products FOR SELECT TO authenticated
USING (vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = auth.uid()));

CREATE POLICY "Vendors update own products"
ON public.vendor_products FOR UPDATE TO authenticated
USING (vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = auth.uid()))
WITH CHECK (vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = auth.uid()));

CREATE POLICY "Vendors delete own products"
ON public.vendor_products FOR DELETE TO authenticated
USING (vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = auth.uid()));

-- Guard approval/showcase flags at trigger level (non-admin cannot change them)
CREATE OR REPLACE FUNCTION public.guard_vendor_product_approval_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.is_approved_by_admin := OLD.is_approved_by_admin;
  NEW.is_showcase := OLD.is_showcase;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_vendor_product_approval_flags ON public.vendor_products;
CREATE TRIGGER guard_vendor_product_approval_flags
BEFORE UPDATE ON public.vendor_products
FOR EACH ROW EXECUTE FUNCTION public.guard_vendor_product_approval_flags();

-- 3. error_logs: add severity/context used by admin panel and watchdog
ALTER TABLE public.error_logs
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'error',
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS error_logs_severity_created_at_idx
  ON public.error_logs (severity, created_at DESC);