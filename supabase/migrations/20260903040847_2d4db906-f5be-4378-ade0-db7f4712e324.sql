CREATE TABLE IF NOT EXISTS public.fiscal_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('orientacao_tecnica','consulta_medica','assinatura_clube','produto_farmacia')),
  reference_id UUID NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_cpf_cnpj VARCHAR(18) NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_address JSONB DEFAULT '{}'::jsonb,
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_provider_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('nfse_servico','recibo_medico_irpf','nfe_produto','fatura_saas')),
  invoice_status TEXT DEFAULT 'pending' CHECK (invoice_status IN ('pending','authorized','rejected','cancelled')),
  external_invoice_id TEXT,
  nfe_number TEXT,
  nfe_series TEXT DEFAULT '1',
  nfe_verification_code TEXT,
  xml_url TEXT,
  pdf_url TEXT NOT NULL,
  cryptographic_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  authorized_at TIMESTAMPTZ
);

GRANT SELECT ON public.fiscal_invoices TO authenticated;
GRANT ALL ON public.fiscal_invoices TO service_role;

CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_user ON public.fiscal_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_reference ON public.fiscal_invoices(reference_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_status ON public.fiscal_invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_created ON public.fiscal_invoices(created_at DESC);

ALTER TABLE public.fiscal_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pacientes leem seus proprios recibos" ON public.fiscal_invoices;
CREATE POLICY "Pacientes leem seus proprios recibos"
  ON public.fiscal_invoices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Medicos leem recibos de seus atendimentos" ON public.fiscal_invoices;
CREATE POLICY "Medicos leem recibos de seus atendimentos"
  ON public.fiscal_invoices FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.id = fiscal_invoices.reference_id AND d.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins controlam notas fiscais" ON public.fiscal_invoices;
CREATE POLICY "Admins controlam notas fiscais"
  ON public.fiscal_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));