-- 1. Fix alert_history: restrict INSERT to service_role only
DROP POLICY IF EXISTS "System can insert alert history" ON public.alert_history;

CREATE POLICY "Service role can insert alert history"
ON public.alert_history
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Tighten prescription storage policies — only the prescribing doctor or owning patient
DROP POLICY IF EXISTS "Prescription SELECT: owner or doctor" ON storage.objects;
DROP POLICY IF EXISTS "Prescription UPDATE: doctors only" ON storage.objects;

CREATE POLICY "Prescription SELECT: patient owner or prescribing doctor"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.prescriptions p
      JOIN public.doctors d ON d.id = p.doctor_id
      WHERE d.user_id = auth.uid()
        AND (
          p.patient_id::text = (storage.foldername(storage.objects.name))[1]
          OR p.id::text = (storage.foldername(storage.objects.name))[2]
        )
    )
  )
);

CREATE POLICY "Prescription UPDATE: prescribing doctor only"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1
    FROM public.prescriptions p
    JOIN public.doctors d ON d.id = p.doctor_id
    WHERE d.user_id = auth.uid()
      AND (
        p.patient_id::text = (storage.foldername(storage.objects.name))[1]
        OR p.id::text = (storage.foldername(storage.objects.name))[2]
      )
  )
);

-- 3. Fix vendor_transactions self-referential policy bug
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.vendor_transactions;

CREATE POLICY "Authenticated users can create transactions"
ON public.vendor_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  buyer_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.vendor_products vp
    WHERE vp.id = vendor_transactions.product_id
      AND vp.vendor_id = vendor_transactions.vendor_id
      AND vp.is_active = true
  )
);
