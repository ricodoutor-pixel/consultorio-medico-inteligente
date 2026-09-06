
-- system_settings (key/value)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system_settings" ON public.system_settings;
CREATE POLICY "Anyone can read system_settings"
  ON public.system_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage system_settings" ON public.system_settings;
CREATE POLICY "Admins can manage system_settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.system_settings (key, value, description)
VALUES
  ('mp_contingency_mode', '{"enabled": false, "since": null, "reason": null}'::jsonb,
   'Quando enabled=true, exibe PIX estático no checkout enquanto Mercado Pago estiver fora do ar.'),
  ('pix_estatico_fallback', '{"chave":"contato@plantayraiz.com.br","tipo":"email","favorecido":"PLANTA Y RAIZ"}'::jsonb,
   'Dados PIX estático usados em modo contingência.')
ON CONFLICT (key) DO NOTHING;

-- financial_reconciliation
CREATE TABLE IF NOT EXISTS public.financial_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciled_at timestamptz NOT NULL DEFAULT now(),
  reference_date date NOT NULL,
  source text NOT NULL DEFAULT 'mercado_pago',
  order_id uuid,
  mp_payment_id text,
  expected_amount numeric,
  actual_amount numeric,
  diff numeric,
  status text NOT NULL DEFAULT 'open',
  details jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_finrec_date ON public.financial_reconciliation(reference_date DESC);
CREATE INDEX IF NOT EXISTS idx_finrec_status ON public.financial_reconciliation(status);
ALTER TABLE public.financial_reconciliation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view financial_reconciliation" ON public.financial_reconciliation;
CREATE POLICY "Admins can view financial_reconciliation"
  ON public.financial_reconciliation FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- prescription_hash_audit
CREATE TABLE IF NOT EXISTS public.prescription_hash_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL,
  audited_at timestamptz NOT NULL DEFAULT now(),
  signature_hash text,
  signed_pdf_url text,
  hash_present boolean NOT NULL DEFAULT false,
  pdf_reachable boolean,
  http_status integer,
  is_valid boolean NOT NULL DEFAULT false,
  notes text
);
CREATE INDEX IF NOT EXISTS idx_pha_prescription ON public.prescription_hash_audit(prescription_id);
CREATE INDEX IF NOT EXISTS idx_pha_audited ON public.prescription_hash_audit(audited_at DESC);
ALTER TABLE public.prescription_hash_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view prescription_hash_audit" ON public.prescription_hash_audit;
CREATE POLICY "Admins can view prescription_hash_audit"
  ON public.prescription_hash_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- doctors: fraud_score + suspended_at
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS fraud_score integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;
CREATE INDEX IF NOT EXISTS idx_doctors_fraud ON public.doctors(fraud_score) WHERE fraud_score IS NOT NULL;
