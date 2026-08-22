ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;

ALTER TABLE public.doctor_kyc_documents DROP CONSTRAINT IF EXISTS doctor_kyc_documents_document_kind_check;
ALTER TABLE public.doctor_kyc_documents ADD CONSTRAINT doctor_kyc_documents_document_kind_check
CHECK (document_kind IN ('crm_front','crm_back','id_front','id_back','cpf_doc','address_proof','selfie','cfm_print','icp_brasil'));

UPDATE public.system_settings SET value = 'true'::jsonb WHERE key = 'brisa_whatsapp_paused';
INSERT INTO public.system_settings (key, value)
SELECT 'brisa_whatsapp_paused', 'true'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'brisa_whatsapp_paused');