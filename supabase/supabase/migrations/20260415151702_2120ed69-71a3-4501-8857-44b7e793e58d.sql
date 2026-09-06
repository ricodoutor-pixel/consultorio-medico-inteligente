
-- Drop the current permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.vendor_transactions;

-- Recreate with vendor_id + product_id integrity validation
CREATE POLICY "Authenticated users can create transactions"
  ON public.vendor_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (buyer_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.is_active = true
    )
    AND (
      product_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.vendor_products vp
        WHERE vp.id = product_id AND vp.vendor_id = vendor_id AND vp.is_active = true
      )
    )
  );
