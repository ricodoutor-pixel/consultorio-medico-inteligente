CREATE POLICY doctors_update_own_kyc ON public.doctor_kyc_documents
FOR UPDATE TO authenticated
USING (auth.uid() = doctor_user_id)
WITH CHECK (auth.uid() = doctor_user_id AND verification_status = 'pending');

CREATE UNIQUE INDEX IF NOT EXISTS payments_mp_payment_id_key ON public.payments(mp_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS consultations_appointment_id_key ON public.consultations(appointment_id);