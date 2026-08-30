-- Pharmacy KYC storage policies (private bucket, folder = auth.uid())
DROP POLICY IF EXISTS "Pharmacy owners read own kyc docs" ON storage.objects;
CREATE POLICY "Pharmacy owners read own kyc docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'pharmacy-kyc-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

DROP POLICY IF EXISTS "Pharmacy owners upload own kyc docs" ON storage.objects;
CREATE POLICY "Pharmacy owners upload own kyc docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pharmacy-kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Pharmacy owners update own kyc docs" ON storage.objects;
CREATE POLICY "Pharmacy owners update own kyc docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'pharmacy-kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'pharmacy-kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Pharmacy owners delete own kyc docs" ON storage.objects;
CREATE POLICY "Pharmacy owners delete own kyc docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'pharmacy-kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated pharmacies to publish logo / storefront / product images in the public avatars bucket
DROP POLICY IF EXISTS "Users manage own pharmacy public images" ON storage.objects;
CREATE POLICY "Users manage own pharmacy public images" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'pharmacy'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'pharmacy'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );