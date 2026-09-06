-- =====================================================================
-- 🤖 UNIVERSAL COMMERCE PROTOCOL (UCP / MCP) & AGENTIC TRANSACTIONS
-- Migration: 20260827230000_ucp_agentic_commerce.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.agentic_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id),
  vendor_id UUID,
  items JSONB NOT NULL, -- [{ product_id, sku, name, quantity, unit_price }]
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'quoted', 'authorized', 'paid', 'processing', 'delivered', 'cancelled')) DEFAULT 'draft',
  payment_method TEXT CHECK (payment_method IN ('google_pay', 'pix', 'credit_card', 'mercado_pago')),
  regulatory_hash TEXT NOT NULL, -- SHA-512 da receita digital vinculada
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ativação de Row Level Security
ALTER TABLE public.agentic_orders ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas prévias
DROP POLICY IF EXISTS "Patients manage own agentic orders" ON public.agentic_orders;
DROP POLICY IF EXISTS "Vendors view own agentic orders" ON public.agentic_orders;
DROP POLICY IF EXISTS "Admins manage all agentic orders" ON public.agentic_orders;

-- 1. Paciente acessa apenas seus próprios pedidos
CREATE POLICY "Patients manage own agentic orders" ON public.agentic_orders
  FOR ALL
  TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- 2. Lojistas visualizam pedidos vinculados ao seu vendor_id
CREATE POLICY "Vendors view own agentic orders" ON public.agentic_orders
  FOR SELECT
  TO authenticated
  USING (
    vendor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE user_id = auth.uid() AND id = agentic_orders.vendor_id
    )
  );

-- 3. Administradores possuem acesso irrestrito
CREATE POLICY "Admins manage all agentic orders" ON public.agentic_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_agentic_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agentic_orders_updated_at ON public.agentic_orders;
CREATE TRIGGER trg_agentic_orders_updated_at
  BEFORE UPDATE ON public.agentic_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_agentic_orders_timestamp();

-- Índices de performance para UCP/MCP queries
CREATE INDEX IF NOT EXISTS idx_agentic_orders_patient ON public.agentic_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_agentic_orders_prescription ON public.agentic_orders(prescription_id);
CREATE INDEX IF NOT EXISTS idx_agentic_orders_status ON public.agentic_orders(status);
