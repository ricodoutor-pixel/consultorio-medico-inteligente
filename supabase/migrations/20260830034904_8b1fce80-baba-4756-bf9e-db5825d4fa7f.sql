-- Pharmacy / Lojista Marketplace Engine (regulatory extension)

-- 1. vendors regulatory columns
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS razao_social TEXT,
  ADD COLUMN IF NOT EXISTS nome_fantasia TEXT,
  ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18),
  ADD COLUMN IF NOT EXISTS responsavel_tecnico TEXT,
  ADD COLUMN IF NOT EXISTS crf_numero TEXT,
  ADD COLUMN IF NOT EXISTS crf_uf VARCHAR(2),
  ADD COLUMN IF NOT EXISTS anvisa_afe TEXT,
  ADD COLUMN IF NOT EXISTS anvisa_ae TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS fachada_foto_url TEXT,
  ADD COLUMN IF NOT EXISTS telefone_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS endereco_completo JSONB,
  ADD COLUMN IF NOT EXISTS is_kyc_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_approved_by UUID,
  ADD COLUMN IF NOT EXISTS max_showcase_products INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS pix_key TEXT,
  ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS contrato_social_url TEXT,
  ADD COLUMN IF NOT EXISTS crf_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS afe_doc_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS vendors_cnpj_unique ON public.vendors (cnpj) WHERE cnpj IS NOT NULL;

DROP POLICY IF EXISTS "Public can view approved vendors" ON public.vendors;
CREATE POLICY "Public can view approved vendors" ON public.vendors
  FOR SELECT TO anon, authenticated
  USING (is_kyc_approved = true);

-- 2. vendor_products marketplace columns
ALTER TABLE public.vendor_products
  ADD COLUMN IF NOT EXISTS concentration TEXT,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_showcase BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_approved_by_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_prescription BOOLEAN NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Public can view showcase approved products" ON public.vendor_products;
CREATE POLICY "Public can view showcase approved products" ON public.vendor_products
  FOR SELECT TO anon, authenticated
  USING (
    is_showcase = true
    AND is_approved_by_admin = true
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_products.vendor_id AND v.is_kyc_approved = true)
  );

-- enforce showcase limit per vendor
CREATE OR REPLACE FUNCTION public.enforce_vendor_showcase_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  IF NEW.is_showcase IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(max_showcase_products, 10) INTO v_limit FROM public.vendors WHERE id = NEW.vendor_id;
  SELECT count(*) INTO v_count FROM public.vendor_products
    WHERE vendor_id = NEW.vendor_id AND is_showcase = true AND id <> NEW.id;
  IF v_count >= COALESCE(v_limit, 10) THEN
    RAISE EXCEPTION 'Limite de % produtos na vitrine principal atingido para esta farmácia', COALESCE(v_limit, 10);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_vendor_showcase_limit ON public.vendor_products;
CREATE TRIGGER trg_enforce_vendor_showcase_limit
  BEFORE INSERT OR UPDATE OF is_showcase ON public.vendor_products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_vendor_showcase_limit();

-- 3. pharmacy prescriptions inbox
CREATE TABLE IF NOT EXISTS public.pharmacy_prescriptions_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id),
  prescription_pdf_url TEXT NOT NULL,
  regulatory_hash TEXT NOT NULL,
  order_id UUID REFERENCES public.agentic_orders(id),
  delivery_address JSONB,
  patient_whatsapp TEXT,
  dispatch_mode TEXT NOT NULL CHECK (dispatch_mode IN ('automatic_1click','manual_upload')),
  status TEXT NOT NULL DEFAULT 'recebida' CHECK (status IN ('recebida','em_analise_farmaceutica','aprovada_dispensacao','medicamento_separado','despachado','entregue','recusada')),
  tracking_code TEXT,
  motivo_recusa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pharmacy_prescriptions_inbox TO authenticated;
GRANT ALL ON public.pharmacy_prescriptions_inbox TO service_role;
ALTER TABLE public.pharmacy_prescriptions_inbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors manage their inbox" ON public.pharmacy_prescriptions_inbox;
CREATE POLICY "Vendors manage their inbox" ON public.pharmacy_prescriptions_inbox
  FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Patients view own dispatches" ON public.pharmacy_prescriptions_inbox;
CREATE POLICY "Patients view own dispatches" ON public.pharmacy_prescriptions_inbox
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Patients create own dispatches" ON public.pharmacy_prescriptions_inbox;
CREATE POLICY "Patients create own dispatches" ON public.pharmacy_prescriptions_inbox
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pharm_inbox_vendor ON public.pharmacy_prescriptions_inbox (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pharm_inbox_patient ON public.pharmacy_prescriptions_inbox (patient_id, created_at DESC);

-- 4. vendor sales splits (95/5)
CREATE TABLE IF NOT EXISTS public.vendor_sales_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  total_item_amount NUMERIC(10,2) NOT NULL,
  platform_fee_5pct NUMERIC(10,2) NOT NULL,
  vendor_net_95pct NUMERIC(10,2) NOT NULL,
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending','processed','paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vendor_sales_splits TO authenticated;
GRANT ALL ON public.vendor_sales_splits TO service_role;
ALTER TABLE public.vendor_sales_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors view their splits" ON public.vendor_sales_splits;
CREATE POLICY "Vendors view their splits" ON public.vendor_sales_splits
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage splits" ON public.vendor_sales_splits;
CREATE POLICY "Admins manage splits" ON public.vendor_sales_splits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_vendor_splits_vendor ON public.vendor_sales_splits (vendor_id, created_at DESC);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_pharm_inbox_updated_at ON public.pharmacy_prescriptions_inbox;
CREATE TRIGGER trg_pharm_inbox_updated_at
  BEFORE UPDATE ON public.pharmacy_prescriptions_inbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();