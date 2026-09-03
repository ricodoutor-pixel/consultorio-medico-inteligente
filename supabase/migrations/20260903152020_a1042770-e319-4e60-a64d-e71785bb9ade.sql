-- 1) Prescrição digital ICP-Brasil / Receituário Especial
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS prescription_type text NOT NULL DEFAULT 'simples',
  ADD COLUMN IF NOT EXISTS thc_percentage numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS copies integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS icp_provider text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_prescription_type_check'
  ) THEN
    ALTER TABLE public.prescriptions
      ADD CONSTRAINT prescriptions_prescription_type_check
      CHECK (prescription_type IN ('simples','controle_especial_c1','notificacao_b'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prescriptions_verification_code
  ON public.prescriptions(verification_code) WHERE verification_code IS NOT NULL;

-- 2) Concierge ANVISA RDC 660
CREATE TABLE IF NOT EXISTS public.anvisa_import_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid,
  prescription_id uuid,
  patient_name text,
  patient_cpf text,
  doctor_name text,
  doctor_crm text,
  protocol_number text,
  product_name text,
  id_document_url text,
  address_proof_url text,
  power_of_attorney_url text,
  authorization_pdf_url text,
  international_tracking_code text,
  status text NOT NULL DEFAULT 'documentacao_enviada',
  notes text,
  submitted_at timestamptz DEFAULT now(),
  under_review_at timestamptz,
  approved_at timestamptz,
  dispatched_at timestamptz,
  in_transit_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anvisa_import_processes_status_check CHECK (
    status IN ('documentacao_enviada','em_analise_anvisa','autorizacao_deferida','pedido_despachado','em_transito','entregue','rejeitado')
  )
);

GRANT SELECT, INSERT, UPDATE ON public.anvisa_import_processes TO authenticated;
GRANT ALL ON public.anvisa_import_processes TO service_role;

ALTER TABLE public.anvisa_import_processes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pacientes veem seus processos anvisa" ON public.anvisa_import_processes;
CREATE POLICY "Pacientes veem seus processos anvisa"
  ON public.anvisa_import_processes FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Pacientes criam seus processos anvisa" ON public.anvisa_import_processes;
CREATE POLICY "Pacientes criam seus processos anvisa"
  ON public.anvisa_import_processes FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins atualizam processos anvisa" ON public.anvisa_import_processes;
CREATE POLICY "Admins atualizam processos anvisa"
  ON public.anvisa_import_processes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_anvisa_import_patient ON public.anvisa_import_processes(patient_id);
CREATE INDEX IF NOT EXISTS idx_anvisa_import_status ON public.anvisa_import_processes(status);

DROP TRIGGER IF EXISTS update_anvisa_import_updated_at ON public.anvisa_import_processes;
CREATE TRIGGER update_anvisa_import_updated_at
  BEFORE UPDATE ON public.anvisa_import_processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Split nativo + frete
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS mp_collector_id text,
  ADD COLUMN IF NOT EXISTS shipping_origin_cep text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS shipping_carrier text,
  ADD COLUMN IF NOT EXISTS shipping_deadline_days integer,
  ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS vendor_net_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS split_details jsonb,
  ADD COLUMN IF NOT EXISTS settlement_receipt jsonb;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS split_details jsonb,
  ADD COLUMN IF NOT EXISTS settlement_receipt jsonb;