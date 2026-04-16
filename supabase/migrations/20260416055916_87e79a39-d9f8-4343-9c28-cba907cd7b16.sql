
-- ============================================================
-- 1. PRESCRIPTIONS STORAGE - FIX RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can view prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can upload prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete prescriptions" ON storage.objects;

CREATE POLICY "Prescription SELECT: owner or doctor"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Prescription INSERT: doctors only"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions'
  AND EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
);

CREATE POLICY "Prescription UPDATE: doctors only"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
);

CREATE POLICY "Prescription DELETE: admin only"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND public.has_role(auth.uid(), 'admin')
);

-- ============================================================
-- 2. DOCTORS_FINANCIAL - ISOLATE SENSITIVE DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.doctors_financial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL UNIQUE REFERENCES public.doctors(id) ON DELETE CASCADE,
  pix_key TEXT,
  document_number TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors_financial ENABLE ROW LEVEL SECURITY;

INSERT INTO public.doctors_financial (doctor_id, pix_key, document_number)
SELECT id, pix_key, document_number FROM public.doctors
WHERE pix_key IS NOT NULL OR document_number IS NOT NULL
ON CONFLICT (doctor_id) DO NOTHING;

CREATE POLICY "Doctor can view own financial data"
ON public.doctors_financial FOR SELECT
TO authenticated
USING (
  doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Doctor can update own financial data"
ON public.doctors_financial FOR UPDATE
TO authenticated
USING (
  doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Doctor can insert own financial data"
ON public.doctors_financial FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can delete financial data"
ON public.doctors_financial FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.doctors DROP COLUMN IF EXISTS pix_key;
ALTER TABLE public.doctors DROP COLUMN IF EXISTS document_number;

-- ============================================================
-- 3. FIX "ALWAYS TRUE" POLICIES
-- ============================================================

DROP POLICY IF EXISTS "System can insert alerts" ON public.appointment_alerts;
CREATE POLICY "Authenticated can insert alerts"
ON public.appointment_alerts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = doctor_id
  OR auth.uid() = patient_id
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "System can insert triage tracking" ON public.triage_abandonment_tracking;
CREATE POLICY "Authenticated insert triage tracking"
ON public.triage_abandonment_tracking FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Vendors can insert own transactions" ON public.vendor_transactions;
CREATE POLICY "Vendors can insert own transactions"
ON public.vendor_transactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendor_products vp
    WHERE vp.vendor_id = vendor_transactions.vendor_id
    AND vp.id = vendor_transactions.product_id
  )
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Doctors see waiting and matched entries" ON public.consultation_queue;
CREATE POLICY "Doctors see own matched entries"
ON public.consultation_queue FOR SELECT
TO authenticated
USING (
  patient_id = auth.uid()
  OR matched_doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
