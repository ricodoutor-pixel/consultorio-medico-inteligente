-- Migration: Pharmacy Marketplace Engine (Lojistas)
-- Date: 2026-08-30

-- 1. Tabela vendors (Farmácias/Lojistas)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    responsavel_tecnico TEXT NOT NULL,
    crf_numero TEXT NOT NULL,
    crf_uf VARCHAR(2) NOT NULL,
    anvisa_afe TEXT NOT NULL,
    anvisa_ae TEXT,
    logo_url TEXT NOT NULL,
    fachada_foto_url TEXT NOT NULL,
    telefone_whatsapp TEXT NOT NULL,
    endereco_completo JSONB NOT NULL,
    is_kyc_approved BOOLEAN DEFAULT false,
    kyc_approved_at TIMESTAMPTZ,
    kyc_approved_by UUID REFERENCES auth.users(id),
    max_showcase_products INTEGER DEFAULT 10,
    pix_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own profile" ON public.vendors
    FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br');

CREATE POLICY "Vendors can update their own profile" ON public.vendors
    FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br');

CREATE POLICY "Public can view approved vendors" ON public.vendors
    FOR SELECT USING (is_kyc_approved = true);

-- 2. Tabela vendor_products
CREATE TABLE IF NOT EXISTS public.vendor_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    concentration TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0 NOT NULL,
    is_showcase BOOLEAN DEFAULT false,
    is_approved_by_admin BOOLEAN DEFAULT false,
    image_url TEXT NOT NULL,
    requires_prescription BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own products" ON public.vendor_products
    FOR ALL USING (
        vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) 
        OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    );

CREATE POLICY "Public can view showcase approved products" ON public.vendor_products
    FOR SELECT USING (is_showcase = true AND is_approved_by_admin = true);

-- 3. Tabela pharmacy_prescriptions_inbox
CREATE TABLE IF NOT EXISTS public.pharmacy_prescriptions_inbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
    patient_id UUID REFERENCES auth.users(id) NOT NULL,
    patient_name TEXT NOT NULL,
    prescription_id UUID, -- References public.prescriptions(id) se existir
    prescription_pdf_url TEXT NOT NULL,
    regulatory_hash TEXT NOT NULL,
    order_id UUID,
    dispatch_mode TEXT CHECK (dispatch_mode IN ('automatic_1click', 'manual_upload')) NOT NULL,
    status TEXT CHECK (status IN ('recebida', 'em_analise_farmaceutica', 'aprovada_dispensacao', 'medicamento_separado', 'despachado', 'entregue', 'recusada')) DEFAULT 'recebida',
    tracking_code TEXT,
    motivo_recusa TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pharmacy_prescriptions_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view and update their inbox" ON public.pharmacy_prescriptions_inbox
    FOR ALL USING (
        vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) 
        OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    );

CREATE POLICY "Patients can view and insert their own prescriptions" ON public.pharmacy_prescriptions_inbox
    FOR ALL USING (
        patient_id = auth.uid() OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    );

-- 4. Tabela vendor_sales_splits
CREATE TABLE IF NOT EXISTS public.vendor_sales_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
    total_item_amount NUMERIC(10,2) NOT NULL,
    platform_fee_5pct NUMERIC(10,2) NOT NULL,
    vendor_net_95pct NUMERIC(10,2) NOT NULL,
    payout_status TEXT CHECK (payout_status IN ('pending', 'processed', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vendor_sales_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their splits" ON public.vendor_sales_splits
    FOR SELECT USING (
        vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) 
        OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    );

-- Políticas de Admin Master Bypass adicionais
CREATE POLICY "Admins bypass all vendors" ON public.vendors FOR ALL USING (auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br');
CREATE POLICY "Admins bypass all vendor_products" ON public.vendor_products FOR ALL USING (auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br');
CREATE POLICY "Admins bypass all prescriptions_inbox" ON public.pharmacy_prescriptions_inbox FOR ALL USING (auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br');
CREATE POLICY "Admins bypass all sales_splits" ON public.vendor_sales_splits FOR ALL USING (auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br');
