DROP POLICY IF EXISTS "Authenticated can insert alerts" ON public.appointment_alerts;

CREATE POLICY "Authenticated can insert alerts"
ON public.appointment_alerts
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_alerts.appointment_id
      AND a.patient_id = appointment_alerts.patient_id
      AND a.doctor_id = appointment_alerts.doctor_id
      AND (
        a.patient_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.doctors d
          WHERE d.id = a.doctor_id AND d.user_id = auth.uid()
        )
      )
  )
);