-- Add KYC columns to doctors table
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS is_crm_valid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_crm_check timestamp with time zone,
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'pending';

-- Add constraint for document_type values
ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_document_type_check CHECK (document_type IN ('cpf', 'passport', 'rne'));

-- Add constraint for kyc_status values
ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_kyc_status_check CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'suspended'));

-- Index for KYC queries
CREATE INDEX IF NOT EXISTS idx_doctors_kyc_status ON public.doctors(kyc_status);
CREATE INDEX IF NOT EXISTS idx_doctors_is_crm_valid ON public.doctors(is_crm_valid);