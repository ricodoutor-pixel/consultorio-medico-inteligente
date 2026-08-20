-- Fix appointment_alerts SELECT for doctors: join via doctors.user_id
DROP POLICY IF EXISTS "Doctors see their patient alerts" ON public.appointment_alerts;
CREATE POLICY "Doctors see their patient alerts"
ON public.appointment_alerts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.user_id = auth.uid()
      AND d.id = appointment_alerts.doctor_id
  )
);

-- Fix nps_alerts SELECT for professionals: join via doctors.user_id
DROP POLICY IF EXISTS "Professionals can view own alerts" ON public.nps_alerts;
CREATE POLICY "Professionals can view own alerts"
ON public.nps_alerts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.user_id = auth.uid()
      AND d.id = nps_alerts.professional_id
  )
);