
-- Fix vendor_transactions: require user ownership of vendor
DROP POLICY IF EXISTS "Vendors can insert own transactions" ON public.vendor_transactions;
CREATE POLICY "Vendors can insert own transactions"
ON public.vendor_transactions FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Fix consultation_queue: restrict doctor UPDATE with WITH CHECK
DROP POLICY IF EXISTS "Doctors can accept queue entries" ON public.consultation_queue;
CREATE POLICY "Doctors can accept queue entries"
ON public.consultation_queue FOR UPDATE
TO authenticated
USING (
  status = 'waiting'
  AND EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
)
WITH CHECK (
  matched_doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);
