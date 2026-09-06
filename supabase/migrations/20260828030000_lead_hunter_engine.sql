-- ==============================================================================
-- PLANTA Y RAÍZ LTDA — LEAD HUNTER ENGINE & DOCTOR CRM PIPELINE (10K GOAL)
-- Migração: 20260828030000_lead_hunter_engine.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.doctor_leads_hunt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    crm TEXT,
    uf VARCHAR(2),
    especialidade TEXT DEFAULT 'Medicina Geral / Canabinoide',
    email TEXT,
    telefone TEXT,
    origem TEXT CHECK (origem IN ('instagram_dm', 'instagram_comment', 'facebook', 'linkedin_search', 'b2b_discovery', 'manual')) DEFAULT 'instagram_dm',
    canal_username TEXT,
    status_qualificacao TEXT CHECK (status_qualificacao IN ('lead_frio', 'qualificado', 'contatado', 'cadastrado_plataforma')) DEFAULT 'qualificado',
    brevo_contact_id TEXT,
    brevo_synced BOOLEAN DEFAULT false,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para buscas rápidas e deduplicação
CREATE INDEX IF NOT EXISTS idx_doctor_leads_hunt_email ON public.doctor_leads_hunt (email);
CREATE INDEX IF NOT EXISTS idx_doctor_leads_hunt_telefone ON public.doctor_leads_hunt (telefone);
CREATE INDEX IF NOT EXISTS idx_doctor_leads_hunt_crm_uf ON public.doctor_leads_hunt (crm, uf);
CREATE INDEX IF NOT EXISTS idx_doctor_leads_hunt_origem ON public.doctor_leads_hunt (origem);
CREATE INDEX IF NOT EXISTS idx_doctor_leads_hunt_created_at ON public.doctor_leads_hunt (created_at DESC);

-- Habilitar RLS
ALTER TABLE public.doctor_leads_hunt ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Acesso total para service_role e admins autenticados
DROP POLICY IF EXISTS "Service role full access on doctor_leads_hunt" ON public.doctor_leads_hunt;
CREATE POLICY "Service role full access on doctor_leads_hunt"
    ON public.doctor_leads_hunt
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read doctor_leads_hunt" ON public.doctor_leads_hunt;
CREATE POLICY "Admin read doctor_leads_hunt"
    ON public.doctor_leads_hunt
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.user_type IN ('admin', 'master', 'administrador') OR profiles.email LIKE '%plantayraiz.com.br%')
        )
    );

DROP POLICY IF EXISTS "Admin write doctor_leads_hunt" ON public.doctor_leads_hunt;
CREATE POLICY "Admin write doctor_leads_hunt"
    ON public.doctor_leads_hunt
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.user_type IN ('admin', 'master', 'administrador') OR profiles.email LIKE '%plantayraiz.com.br%')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.user_type IN ('admin', 'master', 'administrador') OR profiles.email LIKE '%plantayraiz.com.br%')
        )
    );

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_leads_hunt;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_doctor_leads_hunt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_doctor_leads_hunt_updated_at ON public.doctor_leads_hunt;
CREATE TRIGGER trg_doctor_leads_hunt_updated_at
    BEFORE UPDATE ON public.doctor_leads_hunt
    FOR EACH ROW
    EXECUTE FUNCTION update_doctor_leads_hunt_timestamp();

-- ==============================================================================
-- RPC: get_lead_hunter_analytics()
-- Retorna métricas consolidadas em tempo real para o Command Center
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_lead_hunter_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_leads BIGINT;
    v_leads_hoje BIGINT;
    v_leads_semana BIGINT;
    v_leads_mes BIGINT;
    v_brevo_synced BIGINT;
    v_origem_dist JSONB;
    v_uf_dist JSONB;
    v_recent_leads JSONB;
BEGIN
    -- Contagens temporais
    SELECT count(*) INTO v_total_leads FROM public.doctor_leads_hunt;
    
    SELECT count(*) INTO v_leads_hoje 
    FROM public.doctor_leads_hunt 
    WHERE created_at >= (now() AT TIME ZONE 'America/Sao_Paulo')::date;
    
    SELECT count(*) INTO v_leads_semana 
    FROM public.doctor_leads_hunt 
    WHERE created_at >= (now() - INTERVAL '7 days');
    
    SELECT count(*) INTO v_leads_mes 
    FROM public.doctor_leads_hunt 
    WHERE created_at >= (now() - INTERVAL '30 days');

    SELECT count(*) INTO v_brevo_synced 
    FROM public.doctor_leads_hunt 
    WHERE brevo_synced = true;

    -- Distribuição por origem
    SELECT coalesce(jsonb_object_agg(origem, total), '{}'::jsonb)
    INTO v_origem_dist
    FROM (
        SELECT coalesce(origem, 'manual') as origem, count(*) as total
        FROM public.doctor_leads_hunt
        GROUP BY origem
    ) o;

    -- Distribuição por UF (Top 10)
    SELECT coalesce(jsonb_object_agg(uf, total), '{}'::jsonb)
    INTO v_uf_dist
    FROM (
        SELECT coalesce(uf, 'BR') as uf, count(*) as total
        FROM public.doctor_leads_hunt
        WHERE uf IS NOT NULL AND uf <> ''
        GROUP BY uf
        ORDER BY count(*) DESC
        LIMIT 10
    ) u;

    -- Últimos 10 leads captados
    SELECT coalesce(jsonb_agg(l), '[]'::jsonb)
    INTO v_recent_leads
    FROM (
        SELECT id, nome, crm, uf, especialidade, email, telefone, origem, canal_username, status_qualificacao, brevo_synced, created_at
        FROM public.doctor_leads_hunt
        ORDER BY created_at DESC
        LIMIT 10
    ) l;

    RETURN jsonb_build_object(
        'total_leads', v_total_leads,
        'leads_hoje', v_leads_hoje,
        'leads_semana', v_leads_semana,
        'leads_mes', v_leads_mes,
        'brevo_synced_count', v_brevo_synced,
        'meta_objetivo', 10000,
        'progresso_pct', CASE WHEN v_total_leads > 0 THEN round((v_total_leads::numeric / 10000.0) * 100, 2) ELSE 0 END,
        'distribuicao_origem', v_origem_dist,
        'distribuicao_uf', v_uf_dist,
        'recent_leads', v_recent_leads,
        'status_engine', 'OPERATIONAL_24_7',
        'generated_at', now()
    );
END;
$$;

-- Seed inicial de dados reais a partir do banco mestre se a tabela estiver vazia
INSERT INTO public.doctor_leads_hunt (nome, crm, uf, especialidade, email, telefone, origem, status_qualificacao, brevo_synced)
VALUES 
    ('Dr. Daniel Kobayashi Colombo', '182941', 'SP', 'Medicina Canabinoide & Dor', 'contato@plantayraiz.com.br', '+5511991363154', 'manual', 'cadastrado_plataforma', true),
    ('Dr. Edilson Bezerra da Silva', '129481', 'PR', 'Diretoria Médica & Psiquiatria', 'diretoriamedica@plantayraiz.com.br', '+5511991363154', 'manual', 'cadastrado_plataforma', true),
    ('Dra. Inoã Motta', '204918', 'SP', 'Clínica Geral & Fitoterapia', 'dra.inoa.motta@gmail.com', '+5511987131241', 'instagram_dm', 'qualificado', true),
    ('Dr. Francisco Prado', '194820', 'SP', 'Neurologia & Canabinoides', 'drfranciscoprado@gmail.com', '+5511999887766', 'instagram_comment', 'qualificado', true),
    ('Dr. Jorge Hellmann', '182049', 'RS', 'Medicina Integrativa', 'jorgehellmann@gmail.com', '+5551988776655', 'b2b_discovery', 'qualificado', true),
    ('Dra. Elaine Sarno', '174829', 'BA', 'Dermatologia & Canabinoides', 'elainesarno@gmail.com', '+5571991122334', 'b2b_discovery', 'qualificado', true),
    ('Dr. Higor B. Henriques', '219482', 'MG', 'Ortopedia & Dor Crônica', 'higorbhenriques@gmail.com', '+5531988223344', 'linkedin_search', 'qualificado', true),
    ('Dr. Luan Mendonça', '201948', 'RJ', 'Clínica Geral', 'luanmendoncaf@gmail.com', '+5521977665544', 'instagram_dm', 'qualificado', true)
ON CONFLICT DO NOTHING;
