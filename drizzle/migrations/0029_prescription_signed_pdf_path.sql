-- Stores where the signed prescription PDF lives in the private `prescriptions` bucket, so patients and doctors
-- can always get a fresh short-lived download link (signed URLs saved in signed_pdf_url expire after 7 days).
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS signed_pdf_path text;
COMMENT ON COLUMN public.prescriptions.signed_pdf_path IS 'Object path in the private prescriptions bucket; served only through prescription-download.';
