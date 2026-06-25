
-- Permitir Cédula de Identidad (CI) boliviana e adicionar país/cidade ao cadastro médico
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_document_type_check;
ALTER TABLE public.doctors ADD CONSTRAINT doctors_document_type_check
  CHECK (document_type = ANY (ARRAY['cpf'::text, 'passport'::text, 'rne'::text, 'ci'::text]));

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS country text DEFAULT 'BR';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS city text;
