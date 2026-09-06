ALTER TABLE public.doctor_kyc_documents DROP CONSTRAINT IF EXISTS doctor_kyc_documents_document_kind_check;
ALTER TABLE public.doctor_kyc_documents ADD CONSTRAINT doctor_kyc_documents_document_kind_check
CHECK (document_kind IN ('crm_front','crm_back','id_front','id_back','cpf_doc','address_proof','selfie','cfm_print'));
INSERT INTO public.doctor_kyc_documents (doctor_user_id, document_kind, storage_path, mime_type, size_bytes, verification_status, verification_notes)
VALUES ('df8484a2-1579-404f-8eae-614ddeddd487','cfm_print','df8484a2-1579-404f-8eae-614ddeddd487/cfm_print.png','image/png',227901,'approved','Captura CFM: CRM 36942/PR - Regular - UNOESTE 2016');