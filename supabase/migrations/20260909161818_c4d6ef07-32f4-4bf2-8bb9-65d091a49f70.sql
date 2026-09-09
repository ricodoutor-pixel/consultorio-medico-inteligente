ALTER TABLE public.doctors_public ADD COLUMN IF NOT EXISTS kyc_docs_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.sync_doctor_kyc_docs_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := COALESCE(NEW.doctor_user_id, OLD.doctor_user_id);
BEGIN
  UPDATE public.doctors_public dp
     SET kyc_docs_count = (
       SELECT COUNT(*) FROM public.doctor_kyc_documents k
        WHERE k.doctor_user_id = _uid
     )
   WHERE dp.user_id = _uid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_doctor_kyc_docs_count ON public.doctor_kyc_documents;
CREATE TRIGGER trg_sync_doctor_kyc_docs_count
AFTER INSERT OR UPDATE OR DELETE ON public.doctor_kyc_documents
FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_kyc_docs_count();