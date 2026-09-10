REVOKE EXECUTE ON FUNCTION public.sync_doctor_contract_to_doctor_record() FROM anon, authenticated;

DROP POLICY IF EXISTS "Doctors can view own legal documents" ON storage.objects;
CREATE POLICY "Doctors can view own legal documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'legal-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.doctor_contracts dc
        WHERE dc.user_id = auth.uid()
          AND dc.pdf_storage_path = storage.objects.name
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage legal documents" ON storage.objects;
CREATE POLICY "Admins can manage legal documents"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'legal-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'legal-documents' AND public.has_role(auth.uid(), 'admin'));