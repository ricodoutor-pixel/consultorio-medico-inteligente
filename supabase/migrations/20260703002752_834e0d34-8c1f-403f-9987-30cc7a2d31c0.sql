
-- 1) Table
CREATE TABLE IF NOT EXISTS public.doctor_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_kind TEXT NOT NULL CHECK (document_kind IN ('crm_front','crm_back','id_front','id_back')),
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  verification_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_user_id, document_kind)
);

CREATE INDEX IF NOT EXISTS idx_doctor_kyc_documents_user ON public.doctor_kyc_documents(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_kyc_documents_status ON public.doctor_kyc_documents(verification_status);

-- 2) Grants
GRANT SELECT, INSERT, UPDATE ON public.doctor_kyc_documents TO authenticated;
GRANT ALL ON public.doctor_kyc_documents TO service_role;

-- 3) RLS
ALTER TABLE public.doctor_kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors_insert_own_kyc"
ON public.doctor_kyc_documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = doctor_user_id);

CREATE POLICY "doctors_select_own_kyc"
ON public.doctor_kyc_documents FOR SELECT TO authenticated
USING (auth.uid() = doctor_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_update_kyc"
ON public.doctor_kyc_documents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_doctor_kyc_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_doctor_kyc_updated_at ON public.doctor_kyc_documents;
CREATE TRIGGER trg_doctor_kyc_updated_at
BEFORE UPDATE ON public.doctor_kyc_documents
FOR EACH ROW EXECUTE FUNCTION public.tg_doctor_kyc_updated_at();

-- 5) Storage policies on doctor-kyc-documents bucket
-- Path convention: {user_id}/{document_kind}.{ext}
CREATE POLICY "kyc_bucket_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'doctor-kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "kyc_bucket_owner_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'doctor-kyc-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "kyc_bucket_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'doctor-kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "kyc_bucket_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'doctor-kyc-documents'
  AND public.has_role(auth.uid(), 'admin')
);
