ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS neighborhood text;

ALTER TABLE public.doctor_kyc_documents
  DROP CONSTRAINT IF EXISTS doctor_kyc_documents_document_kind_check;

ALTER TABLE public.doctor_kyc_documents
  ADD CONSTRAINT doctor_kyc_documents_document_kind_check
  CHECK (document_kind = ANY (ARRAY[
    'crm_front','crm_back','id_front','id_back',
    'cpf_doc','address_proof','selfie'
  ]));