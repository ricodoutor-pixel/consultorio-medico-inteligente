-- ======================================================================
-- MIGRATION: LEDGER IMUTÁVEL DE CASOS CLÍNICOS EM BLOCKCHAIN (Prompt 2.1)
-- Data: 2026-09-05
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.clinical_case_blockchain_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_crm TEXT NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  anonymized_payload JSONB NOT NULL,
  payload_sha256 TEXT NOT NULL,
  ipfs_cid TEXT,
  ipfs_gateway_url TEXT,
  blockchain_network TEXT NOT NULL DEFAULT 'polygon-amoy',
  tx_hash TEXT,
  explorer_url TEXT,
  status TEXT NOT NULL DEFAULT 'local_ledger_anchored' 
    CHECK (status IN ('anchored_on_chain', 'ipfs_pinned', 'pending_broadcast', 'local_ledger_anchored')),
  block_number BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  anchored_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_clinical_blockchain_hash ON public.clinical_case_blockchain_ledger(payload_sha256);
CREATE INDEX IF NOT EXISTS idx_clinical_blockchain_doctor ON public.clinical_case_blockchain_ledger(doctor_crm);

-- Regra de imutabilidade append-only: proíbe updates e deletes
CREATE OR REPLACE RULE no_update_clinical_ledger AS ON UPDATE TO public.clinical_case_blockchain_ledger DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_clinical_ledger AS ON DELETE TO public.clinical_case_blockchain_ledger DO INSTEAD NOTHING;

ALTER TABLE public.clinical_case_blockchain_ledger ENABLE ROW LEVEL SECURITY;

-- Consulta pública/autenticada dos casos anonimizados para pesquisa científica
CREATE POLICY "Allow read anonymized clinical cases"
  ON public.clinical_case_blockchain_ledger
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Permite inserção de novos registros ancorados por médicos autenticados
CREATE POLICY "Allow doctors to insert clinical cases"
  ON public.clinical_case_blockchain_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role possui acesso operacional
CREATE POLICY "Allow service_role full access to clinical cases"
  ON public.clinical_case_blockchain_ledger
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
