CREATE TABLE IF NOT EXISTS public.agentic_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id),
  vendor_id UUID,
  items JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'quoted', 'authorized', 'paid', 'processing', 'delivered', 'cancelled')) DEFAULT 'draft',
  payment_method TEXT CHECK (payment_method IN ('google_pay', 'pix', 'credit_card', 'mercado_pago')),
  regulatory_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentic_orders TO authenticated;
GRANT ALL ON public.agentic_orders TO service_role;

ALTER TABLE public.agentic_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients manage own agentic orders" ON public.agentic_orders;
DROP POLICY IF EXISTS "Vendors view own agentic orders" ON public.agentic_orders;
DROP POLICY IF EXISTS "Admins manage all agentic orders" ON public.agentic_orders;

CREATE POLICY "Patients manage own agentic orders" ON public.agentic_orders
  FOR ALL
  TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Vendors view own agentic orders" ON public.agentic_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.user_id = auth.uid() AND v.id = agentic_orders.vendor_id
    )
  );

CREATE POLICY "Admins manage all agentic orders" ON public.agentic_orders
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_agentic_orders_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agentic_orders_updated_at ON public.agentic_orders;
CREATE TRIGGER trg_agentic_orders_updated_at
  BEFORE UPDATE ON public.agentic_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agentic_orders_timestamp();

CREATE INDEX IF NOT EXISTS idx_agentic_orders_patient ON public.agentic_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_agentic_orders_prescription ON public.agentic_orders(prescription_id);
CREATE INDEX IF NOT EXISTS idx_agentic_orders_status ON public.agentic_orders(status);
CREATE INDEX IF NOT EXISTS idx_agentic_orders_vendor ON public.agentic_orders(vendor_id);