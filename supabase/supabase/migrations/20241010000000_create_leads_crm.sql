-- Criando o tipo Enum para os status do funil
CREATE TYPE public.lead_status AS ENUM (
    'scraped',
    'invited',
    'responded',
    'in_progress',
    'registered'
);

-- Criando a tabela de leads
CREATE TABLE IF NOT EXISTS public.leads_crm (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'instagram',
    status public.lead_status DEFAULT 'scraped',
    last_contact_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    follow_up_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security)
ALTER TABLE public.leads_crm ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Leads são acessíveis por administradores" ON public.leads_crm
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.leads_crm IS 'Tabela para gerenciar o funil de captação de novos médicos';
COMMENT ON COLUMN public.leads_crm.phone IS 'Número de telefone único com DDI, sem o `+`';
