ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS signature_hash text,
  ADD COLUMN IF NOT EXISTS signature_provider text CHECK (signature_provider IN ('gov.br','clicksign','manual')),
  ADD COLUMN IF NOT EXISTS signed_pdf_url text;

CREATE INDEX IF NOT EXISTS idx_prescriptions_signature_provider
  ON public.prescriptions(signature_provider) WHERE signature_provider IS NOT NULL;