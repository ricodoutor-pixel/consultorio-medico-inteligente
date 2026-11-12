-- Consultation documents share the signed-PDF pipeline of prescriptions (issue -> gov.br signature -> patient download):
-- adds medical certificates and exam requests to the accepted document types.
ALTER TABLE public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_prescription_type_check;
ALTER TABLE public.prescriptions ADD CONSTRAINT prescriptions_prescription_type_check
  CHECK (prescription_type IN ('simples', 'controle_especial_c1', 'notificacao_b', 'atestado', 'solicitacao_exames'));
