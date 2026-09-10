ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS is_contract_signed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_ip TEXT,
  ADD COLUMN IF NOT EXISTS contract_hash TEXT,
  ADD COLUMN IF NOT EXISTS contract_version VARCHAR(20) DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS ip_capture_failed BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.doctor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  contract_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  doctor_full_name TEXT NOT NULL,
  doctor_cpf VARCHAR(14),
  doctor_crm VARCHAR(20),
  doctor_crm_uf VARCHAR(4),
  status TEXT CHECK (status IN ('pending','signed','revoked')) DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  signer_ip TEXT,
  signer_user_agent TEXT,
  pdf_storage_path TEXT,
  pdf_url TEXT,
  sha512_hash TEXT,
  ip_capture_failed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.doctor_contracts TO authenticated;
GRANT ALL ON public.doctor_contracts TO service_role;

ALTER TABLE public.doctor_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can view own contracts"
  ON public.doctor_contracts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Doctors can insert own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can insert own contracts"
  ON public.doctor_contracts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Doctors can update own contracts" ON public.doctor_contracts;
CREATE POLICY "Doctors can update own contracts"
  ON public.doctor_contracts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_doctor_contracts_doctor_id ON public.doctor_contracts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_user_id ON public.doctor_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_contracts_status ON public.doctor_contracts(status);

DROP TRIGGER IF EXISTS doctor_contracts_set_updated_at ON public.doctor_contracts;
CREATE TRIGGER doctor_contracts_set_updated_at
BEFORE UPDATE ON public.doctor_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_doctor_contract_to_doctor_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'signed' THEN
    UPDATE public.doctors
    SET is_contract_signed = true,
        contract_signed_at = COALESCE(NEW.signed_at, now()),
        contract_ip = NEW.signer_ip,
        contract_hash = NEW.sha512_hash,
        contract_version = NEW.contract_version,
        ip_capture_failed = COALESCE(NEW.ip_capture_failed, false)
    WHERE id = NEW.doctor_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_doctor_contract ON public.doctor_contracts;
CREATE TRIGGER trg_sync_doctor_contract
AFTER INSERT OR UPDATE OF status, sha512_hash, signer_ip ON public.doctor_contracts
FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_contract_to_doctor_record();