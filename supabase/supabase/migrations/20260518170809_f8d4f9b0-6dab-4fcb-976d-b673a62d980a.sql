
-- 1. consultation_queue: add WITH CHECK to prevent patients flipping payment_confirmed / matched_doctor_id / amount / payment_id
DROP POLICY IF EXISTS "Patients can cancel own queue" ON public.consultation_queue;
CREATE POLICY "Patients can cancel own queue"
ON public.consultation_queue
FOR UPDATE
USING (auth.uid() = patient_id AND status = 'waiting')
WITH CHECK (
  auth.uid() = patient_id
  AND payment_confirmed = (SELECT q2.payment_confirmed FROM public.consultation_queue q2 WHERE q2.id = consultation_queue.id)
  AND payment_id IS NOT DISTINCT FROM (SELECT q3.payment_id FROM public.consultation_queue q3 WHERE q3.id = consultation_queue.id)
  AND amount = (SELECT q4.amount FROM public.consultation_queue q4 WHERE q4.id = consultation_queue.id)
  AND matched_doctor_id IS NOT DISTINCT FROM (SELECT q5.matched_doctor_id FROM public.consultation_queue q5 WHERE q5.id = consultation_queue.id)
);

-- 2. Remove appointments/orders/consultation_queue from realtime publication (frontend uses Broadcast channels)
ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments;
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.consultation_queue;

-- 3. nps_responses: validate professional_id is a real doctor row tied to the appointment
DROP POLICY IF EXISTS "Patients can insert own NPS" ON public.nps_responses;
CREATE POLICY "Patients can insert own NPS"
ON public.nps_responses
FOR INSERT
WITH CHECK (
  patient_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.id = nps_responses.consultation_id
      AND a.patient_id = auth.uid()
      AND d.id = nps_responses.professional_id
  )
);

-- 4. vendor_transactions: drop the overlapping vendor INSERT policy; only buyers (or admin/service role) may create
DROP POLICY IF EXISTS "Vendors can insert own transactions" ON public.vendor_transactions;
