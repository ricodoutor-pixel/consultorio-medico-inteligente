-- ======================================================================
-- MIGRATION: 20260831000001_automated_invoicing_engine.sql
-- Motor Automático de Emissão de Notas Fiscais, Recibos IRPF e Faturamento
-- Planta y Raíz LTDA - CNPJ 58.283.475/0001-00
-- ======================================================================

-- 1. TABELA DE FATURAMENTO E NOTAS FISCAIS
CREATE TABLE IF NOT EXISTS public.fiscal_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_type TEXT CHECK (order_type IN ('orientacao_tecnica', 'consulta_medica', 'assinatura_clube', 'produto_farmacia')) NOT NULL,
    reference_id UUID NOT NULL, -- ID do appointment, orientacao_order, subscription ou vendor_transaction
    recipient_name TEXT NOT NULL,
    recipient_cpf_cnpj VARCHAR(18) NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_address JSONB DEFAULT '{}'::jsonb,
    gross_amount NUMERIC(10,2) NOT NULL,
    platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    net_provider_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    invoice_type TEXT CHECK (invoice_type IN ('nfse_servico', 'recibo_medico_irpf', 'nfe_produto', 'fatura_saas')) NOT NULL,
    invoice_status TEXT CHECK (invoice_status IN ('pending', 'authorized', 'rejected', 'cancelled')) DEFAULT 'pending',
    external_invoice_id TEXT, -- ID no gateway de NF (Focus/eNotas/PlugNotas)
    nfe_number TEXT,
    nfe_series TEXT DEFAULT '1',
    nfe_verification_code TEXT,
    xml_url TEXT,
    pdf_url TEXT NOT NULL,
    cryptographic_hash TEXT NOT NULL, -- SHA-512 do documento
    created_at TIMESTAMPTZ DEFAULT now(),
    authorized_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_user ON public.fiscal_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_reference ON public.fiscal_invoices(reference_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_status ON public.fiscal_invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_type ON public.fiscal_invoices(order_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_created ON public.fiscal_invoices(created_at DESC);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.fiscal_invoices ENABLE ROW LEVEL SECURITY;

-- Política 1: Paciente lê suas próprias notas e recibos
DROP POLICY IF EXISTS "Pacientes leem seus proprios recibos e notas" ON public.fiscal_invoices;
CREATE POLICY "Pacientes leem seus proprios recibos e notas"
    ON public.fiscal_invoices
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
    );

-- Política 2: Médicos leem recibos vinculados a suas consultas
DROP POLICY IF EXISTS "Medicos leem recibos de seus atendimentos" ON public.fiscal_invoices;
CREATE POLICY "Medicos leem recibos de seus atendimentos"
    ON public.fiscal_invoices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = fiscal_invoices.reference_id
            AND a.doctor_id IN (
                SELECT d.id FROM public.doctors d WHERE d.user_id = auth.uid()
            )
        )
    );

-- Política 3: Administradores têm acesso total (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins possuem controle total sobre notas fiscais" ON public.fiscal_invoices;
CREATE POLICY "Admins possuem controle total sobre notas fiscais"
    ON public.fiscal_invoices
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles r
            WHERE r.user_id = auth.uid() AND r.role = 'admin'
        )
        OR (
            auth.jwt() ->> 'email' IN (
                'contato@plantayraiz.com.br',
                'contatoplantaeraiz@gmail.com',
                'admin@plantayraiz.com.br',
                'ricodoutor@gmail.com',
                'dredilsonbezerra@gmail.com'
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles r
            WHERE r.user_id = auth.uid() AND r.role = 'admin'
        )
        OR (
            auth.jwt() ->> 'email' IN (
                'contato@plantayraiz.com.br',
                'contatoplantaeraiz@gmail.com',
                'admin@plantayraiz.com.br',
                'ricodoutor@gmail.com',
                'dredilsonbezerra@gmail.com'
            )
        )
    );

-- 3. STORAGE BUCKET: INVOICES
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permissão de leitura pública para download de recibos e NFS-e
DROP POLICY IF EXISTS "Permitir download publico de invoices" ON storage.objects;
CREATE POLICY "Permitir download publico de invoices"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'invoices');

-- Permissão de gravação para usuários autenticados e service role
DROP POLICY IF EXISTS "Permitir upload de invoices autenticados" ON storage.objects;
CREATE POLICY "Permitir upload de invoices autenticados"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'invoices');
