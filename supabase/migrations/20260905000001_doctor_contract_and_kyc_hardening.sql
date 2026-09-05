-- ======================================================================
-- MIGRATION: INTEGRIDADE DO CONTRATO MÉDICO & TRAVA DE HOMOLOGAÇÃO KYC
-- Tarefas: 0.4 e 0.5
-- Data: 2026-09-05
-- ======================================================================

-- 1. Garante a existência das colunas de contrato na tabela doctors
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS is_contract_signed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_ip TEXT,
ADD COLUMN IF NOT EXISTS contract_hash TEXT,
ADD COLUMN IF NOT EXISTS contract_version VARCHAR(20) DEFAULT 'v1.0',
ADD COLUMN IF NOT EXISTS ip_capture_failed BOOLEAN DEFAULT false;

-- 2. Tabela oficial doctor_contracts
CREATE TABLE IF NOT EXISTS public.doctor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  contract_version VARCHAR(20) DEFAULT 'v1.0' NOT NULL,
  doctor_full_name TEXT NOT NULL,
  doctor_cpf VARCHAR(14),
  doctor_crm VARCHAR(20) NOT NULL,
  doctor_crm_uf VARCHAR(2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'signed', 'revoked')) DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  signer_ip TEXT,
  signer_user_agent TEXT,
  pdf_storage_path TEXT,
  pdf_url TEXT,
  sha512_hash TEXT,
  ip_capture_failed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_doctor_id ON public.doctor_contracts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_user_id ON public.doctor_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_status ON public.doctor_contracts(status);
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_sha512 ON public.doctor_contracts(sha512_hash);

-- RLS para doctor_contracts
ALTER TABLE public.doctor_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can view own contracts"
  ON public.doctor_contracts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can insert own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can insert own contracts"
  ON public.doctor_contracts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can update own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can update own contracts"
  ON public.doctor_contracts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins have full access to doctor contracts" ON public.doctor_contracts;
CREATE POLICY "Admins have full access to doctor contracts"
  ON public.doctor_contracts FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

-- 3. Trigger de sincronização automática: doctor_contracts -> doctors
CREATE OR REPLACE FUNCTION sync_doctor_contract_to_doctor_record()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'signed' THEN
    UPDATE public.doctors
    SET 
      is_contract_signed = true,
      contract_signed_at = COALESCE(NEW.signed_at, now()),
      contract_ip = NEW.signer_ip,
      contract_hash = NEW.sha512_hash,
      contract_version = NEW.contract_version,
      ip_capture_failed = COALESCE(NEW.ip_capture_failed, false)
    WHERE id = NEW.doctor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_doctor_contract ON public.doctor_contracts;
CREATE TRIGGER trg_sync_doctor_contract
AFTER INSERT OR UPDATE OF status, sha512_hash, signer_ip ON public.doctor_contracts
FOR EACH ROW
EXECUTE FUNCTION sync_doctor_contract_to_doctor_record();

-- 4. Trava Backend (Trigger): Exigir Pré-requisitos para Homologação de Médico
-- Pré-requisitos mandatórios para aprovar médico na plataforma:
-- 1) CRM preenchido (mínimo 3 caracteres)
-- 2) CPF válido com 11 dígitos numéricos
-- 3) Pelo menos 1 documento KYC verificado
-- 4) Contrato CFM assinado digitalmente
CREATE OR REPLACE FUNCTION validate_doctor_approval_prerequisites()
RETURNS TRIGGER AS $$
DECLARE
  v_cpf TEXT;
  v_has_verified_doc BOOLEAN;
  v_has_signed_contract BOOLEAN;
BEGIN
  -- Aciona validação apenas quando estiver aprovando o médico
  IF (NEW.is_approved_by_admin = true AND (OLD.is_approved_by_admin IS DISTINCT FROM true))
     OR (NEW.is_verified = true AND (OLD.is_verified IS DISTINCT FROM true)) THEN

    -- Regra 1: CRM obrigatório
    IF NEW.crm IS NULL OR length(trim(NEW.crm)) < 3 THEN
      RAISE EXCEPTION 'Homologação rejeitada: O médico precisa possuir um número de CRM válido antes da homologação.';
    END IF;

    -- Regra 2: CPF do médico (obtido de doctors.document_number ou profiles.cpf)
    SELECT COALESCE(
      NULLIF(regexp_replace(NEW.document_number, '\D', '', 'g'), ''),
      (SELECT regexp_replace(cpf, '\D', '', 'g') FROM public.profiles WHERE id = NEW.user_id)
    ) INTO v_cpf;

    IF v_cpf IS NULL OR length(v_cpf) != 11 THEN
      RAISE EXCEPTION 'Homologação rejeitada: CPF válido com 11 dígitos numéricos é obrigatório para aprovação clínica.';
    END IF;

    -- Regra 3: Pelo menos 1 documento KYC com status 'verified'
    SELECT EXISTS (
      SELECT 1 FROM public.doctor_kyc_documents
      WHERE doctor_user_id = NEW.user_id
        AND verification_status = 'verified'
    ) INTO v_has_verified_doc;

    -- Permite se foi anexado signature_url ICP-Brasil diretamente
    IF NOT v_has_verified_doc AND NEW.signature_url IS NOT NULL AND length(NEW.signature_url) > 5 THEN
      v_has_verified_doc := true;
    END IF;

    IF NOT v_has_verified_doc THEN
      RAISE EXCEPTION 'Homologação rejeitada: É obrigatório validar pelo menos 1 documento profissional (CRM, Diploma ou Certidão Ética) na esteira KYC.';
    END IF;

    -- Regra 4: Contrato assinado
    SELECT (
      COALESCE(NEW.is_contract_signed, false) = true
      OR EXISTS (
        SELECT 1 FROM public.doctor_contracts
        WHERE doctor_id = NEW.id AND status = 'signed'
      )
    ) INTO v_has_signed_contract;

    IF NOT v_has_signed_contract THEN
      RAISE EXCEPTION 'Homologação rejeitada: O Contrato de Credenciamento Médico (CFM nº 2.336/2023) precisa estar formalmente assinado com registro de SHA-512.';
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_doctor_approval_prerequisites ON public.doctors;
CREATE TRIGGER trg_validate_doctor_approval_prerequisites
BEFORE UPDATE OF is_approved_by_admin, is_verified, approval_status ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION validate_doctor_approval_prerequisites();
