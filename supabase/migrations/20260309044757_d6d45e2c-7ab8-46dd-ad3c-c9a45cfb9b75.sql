-- Fix doctors table: prevent users from setting is_verified on INSERT/UPDATE
DROP POLICY IF EXISTS "Users can create own doctor profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON public.doctors;

-- Re-create INSERT policy that enforces is_verified = false
CREATE POLICY "Users can create own doctor profile" ON public.doctors
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND is_verified = false
  );

-- Re-create UPDATE policy that prevents changing is_verified
CREATE POLICY "Doctors can update own profile" ON public.doctors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND is_verified = (SELECT is_verified FROM public.doctors d2 WHERE d2.id = doctors.id)
  );

-- Fix appointments table: prevent patients from modifying payment fields
DROP POLICY IF EXISTS "Patients can cancel own appointments" ON public.appointments;

-- Re-create with restricted column updates
CREATE POLICY "Patients can cancel own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (
    patient_id = auth.uid()
    AND payment_status = (SELECT payment_status FROM public.appointments a2 WHERE a2.id = appointments.id)
    AND amount = (SELECT amount FROM public.appointments a3 WHERE a3.id = appointments.id)
    AND payment_id IS NOT DISTINCT FROM (SELECT payment_id FROM public.appointments a4 WHERE a4.id = appointments.id)
  );