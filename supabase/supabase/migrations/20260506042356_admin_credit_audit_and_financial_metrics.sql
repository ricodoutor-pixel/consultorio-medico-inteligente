-- Migração: Auditoria de Créditos e Métricas Financeiras
-- Data: 2026-05-06

-- Tabela de Auditoria de Créditos
CREATE TABLE IF NOT EXISTS public.credit_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id)
);

-- Tabela de Métricas Financeiras (Split 60/20/10/10)
CREATE TABLE IF NOT EXISTS public.financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT,
    doctor_id UUID,
    gross_amount DECIMAL(12,2) NOT NULL,
    doctor_amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) NOT NULL,
    marketing_fee DECIMAL(12,2) NOT NULL,
    reserve_fee DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.credit_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Apenas Admins)
CREATE POLICY "Admins can manage credit audits" ON public.credit_audits
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view financial metrics" ON public.financial_metrics
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_audits_user ON public.credit_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_doctor ON public.financial_metrics(doctor_id);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_created ON public.financial_metrics(created_at);
