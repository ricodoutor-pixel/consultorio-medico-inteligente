
-- 1. Enforce security_invoker on doctors_public view (was implicitly SECURITY DEFINER)
ALTER VIEW public.doctors_public SET (security_invoker = true);

-- 2. Storage policies for private medical-documents bucket (patient-owner scoped)
CREATE POLICY "medical_documents_owner_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "medical_documents_owner_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "medical_documents_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'medical-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'medical-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "medical_documents_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'medical-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "medical_documents_admin_all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'medical-documents' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'medical-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 3. social-posts UPDATE / DELETE policies (admin-only lifecycle management)
CREATE POLICY "social_posts_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'social-posts' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'social-posts' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "social_posts_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'social-posts' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Partner API key column for validate-health-card authentication
ALTER TABLE public.saude_verde_partners
  ADD COLUMN IF NOT EXISTS api_key_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_sv_partners_api_key_hash
  ON public.saude_verde_partners(api_key_hash)
  WHERE api_key_hash IS NOT NULL;
