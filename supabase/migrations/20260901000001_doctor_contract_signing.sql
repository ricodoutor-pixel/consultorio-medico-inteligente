-- ======================================================================
-- MIGRATION: SISTEMA DE CONTRATO MÉDICO DIGITAL & AUDITORIA KYC V4
-- Data: 2026-09-01
-- ======================================================================

-- 1. Criação da tabela doctor_contracts
CREATE TABLE IF NOT EXISTS public.doctor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  contract_version VARCHAR(10) DEFAULT 'v1.0' NOT NULL,
  doctor_full_name TEXT NOT NULL,
  doctor_cpf VARCHAR(14) NOT NULL,
  doctor_crm VARCHAR(20) NOT NULL,
  doctor_crm_uf VARCHAR(2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'signed', 'revoked')) DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  signer_ip TEXT,
  signer_user_agent TEXT,
  pdf_storage_path TEXT,
  pdf_url TEXT,
  sha512_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas de auditoria de alta performance
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_doctor_id ON public.doctor_contracts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_user_id ON public.doctor_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_status ON public.doctor_contracts(status);
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_sha512 ON public.doctor_contracts(sha512_hash);

-- 2. Adição da coluna is_contract_signed na tabela doctors
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS is_contract_signed BOOLEAN DEFAULT false;

-- 3. Habilitação de RLS na tabela doctor_contracts
ALTER TABLE public.doctor_contracts ENABLE ROW LEVEL SECURITY;

-- Política 1: Médicos acessam exclusivamente seus próprios contratos
DROP POLICY IF EXISTS "Doctors can view own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can view own contracts"
  ON public.doctor_contracts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can insert own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can insert own contracts"
  ON public.doctor_contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can update own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can update own contracts"
  ON public.doctor_contracts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Política 2: Administradores possuem acesso irrestrito para auditoria e conformidade CFM
DROP POLICY IF EXISTS "Admins have full access to doctor contracts" ON public.doctor_contracts;
CREATE POLICY "Admins have full access to doctor contracts"
  ON public.doctor_contracts
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

-- 4. Criação do bucket de storage 'legal-documents' para guarda permanente
INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-documents', 'legal-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Políticas de Storage para legal-documents
DROP POLICY IF EXISTS "Doctors can view own legal documents" ON storage.objects;
CREATE POLICY "Doctors can view own legal documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'legal-documents' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br' OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Service role & admins can manage legal documents" ON storage.objects;
CREATE POLICY "Service role & admins can manage legal documents"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'legal-documents' AND (
      auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br' OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
      )
    )
  );

-- 5. Trigger de Trava Clínica: Impede abertura de horários se contrato não estiver assinado
CREATE OR REPLACE FUNCTION check_doctor_contract_before_availability()
RETURNS TRIGGER AS $$
DECLARE
  v_contract_signed BOOLEAN;
BEGIN
  -- Verifica status na tabela doctors
  SELECT is_contract_signed INTO v_contract_signed
  FROM public.doctors
  WHERE id = NEW.doctor_id;

  IF v_contract_signed IS NOT TRUE THEN
    RAISE EXCEPTION 'Abertura de horários bloqueada: O Contrato de Credenciamento Médico (CFM nº 2.336/2023) deve ser assinado digitalmente antes de disponibilizar agenda.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_doctor_contract_availability ON public.doctor_availability;
CREATE TRIGGER trg_check_doctor_contract_availability
BEFORE INSERT ON public.doctor_availability
FOR EACH ROW
EXECUTE FUNCTION check_doctor_contract_before_availability();
