ALTER TABLE "public"."doctor_kyc_documents" DROP CONSTRAINT IF EXISTS "doctor_kyc_documents_document_kind_check";
ALTER TABLE "public"."doctor_kyc_documents" ADD CONSTRAINT "doctor_kyc_documents_document_kind_check" CHECK (
  "document_kind" IN (
    'crm_front', 
    'crm_back', 
    'id_front', 
    'id_back',
    'cpf_doc', 
    'address_proof', 
    'selfie', 
    'cfm_print',
    'icp_brasil'
  )
);
