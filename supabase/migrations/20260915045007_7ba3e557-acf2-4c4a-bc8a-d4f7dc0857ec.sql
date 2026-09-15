-- doctors: lock sensitive fields on INSERT
DROP POLICY IF EXISTS "Users can create own doctor profile" ON public.doctors;
CREATE POLICY "Users can create own doctor profile"
ON public.doctors FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_verified = false
  AND coalesce(is_approved_by_admin, false) = false
  AND coalesce(kyc_status, 'pending') = 'pending'
  AND coalesce(approval_status, 'pending') = 'pending'
  AND coalesce(is_crm_valid, false) = false
  AND coalesce(fraud_score, 0) = 0
);

-- vendors: lock KYC fields on INSERT
DROP POLICY IF EXISTS "Auth users can create vendor" ON public.vendors;
CREATE POLICY "Auth users can create vendor"
ON public.vendors FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND coalesce(is_kyc_approved, false) = false
  AND coalesce(kyc_status, 'pending') = 'pending'
);

-- vendor_products: vendors cannot self-approve or self-showcase
DROP POLICY IF EXISTS "Vendors manage own products" ON public.vendor_products;
CREATE POLICY "Vendors manage own products"
ON public.vendor_products FOR ALL TO authenticated
USING (
  vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = auth.uid())
)
WITH CHECK (
  vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = auth.uid())
  AND coalesce(is_approved_by_admin, false) = false
  AND coalesce(is_showcase, false) = false
);