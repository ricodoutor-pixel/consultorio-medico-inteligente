DROP POLICY IF EXISTS "Prescription UPDATE: prescribing doctor only" ON storage.objects;
CREATE POLICY "Prescription UPDATE: prescribing doctor only"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'prescriptions' AND EXISTS (
      SELECT 1 FROM public.prescriptions p
      JOIN public.doctors d ON d.id = p.doctor_id
      WHERE d.user_id = auth.uid()
        AND (p.patient_id::text = (storage.foldername(objects.name))[1]
          OR p.id::text = (storage.foldername(objects.name))[2])
    )
  )
  WITH CHECK (
    bucket_id = 'prescriptions' AND EXISTS (
      SELECT 1 FROM public.prescriptions p
      JOIN public.doctors d ON d.id = p.doctor_id
      WHERE d.user_id = auth.uid()
        AND (p.patient_id::text = (storage.foldername(objects.name))[1]
          OR p.id::text = (storage.foldername(objects.name))[2])
    )
  );