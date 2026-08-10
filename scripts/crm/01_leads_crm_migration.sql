-- 🌿 Planta y Raíz — Migration CRM leads_crm
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/shmbwdjuddvquszwkvuq/sql

-- ====================================================
-- TABELA PRINCIPAL: leads_crm
-- ====================================================
CREATE TABLE IF NOT EXISTS public.leads_crm (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT,
  phone         TEXT UNIQUE NOT NULL,
  email         TEXT,
  state         TEXT,                        -- Estado/UF
  country       TEXT DEFAULT 'BR',           -- País
  specialty     TEXT,                        -- Especialidade médica
  source        TEXT DEFAULT 'manual',       -- instagram | google | cfm | manual | whatsapp
  instagram_url TEXT,                        -- URL do perfil no Instagram
  status        TEXT DEFAULT 'scraped'
    CHECK (status IN (
      'scraped',      -- Lead capturado
      'invited',      -- Mensagem enviada
      'responded',    -- Interagiu/Respondeu
      'in_progress',  -- Tirando dúvidas com a IA
      'registered',   -- Cadastro concluído na plataforma
      'rejected',     -- Não tem interesse
      'blocked'       -- Bloqueou o número
    )),
  follow_up_count   INTEGER DEFAULT 0,
  last_contact_at   TIMESTAMPTZ,
  first_contact_at  TIMESTAMPTZ,
  registered_at     TIMESTAMPTZ,             -- Data do cadastro confirmado
  notes             TEXT,                    -- Observações manuais
  ai_conversation   JSONB DEFAULT '[]'::jsonb, -- Histórico de conversa com Brisa AI
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- TABELA: crm_messages (histórico de cada mensagem)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.crm_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     UUID REFERENCES public.leads_crm(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  direction   TEXT CHECK (direction IN ('outbound', 'inbound')),
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  message_type TEXT DEFAULT 'invite' CHECK (message_type IN ('invite', 'followup', 'ai_response', 'manual')),
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- TABELA: crm_campaigns (controle de campanhas)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.crm_campaigns (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  target_count    INTEGER DEFAULT 500,
  current_count   INTEGER DEFAULT 0,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir campanha inicial
INSERT INTO public.crm_campaigns (name, target_count)
VALUES ('Campanha Meta 500 Médicos — Planta y Raíz 2026', 500)
ON CONFLICT DO NOTHING;

-- ====================================================
-- INDEXES para performance
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_leads_crm_status ON public.leads_crm(status);
CREATE INDEX IF NOT EXISTS idx_leads_crm_phone ON public.leads_crm(phone);
CREATE INDEX IF NOT EXISTS idx_leads_crm_last_contact ON public.leads_crm(last_contact_at);
CREATE INDEX IF NOT EXISTS idx_crm_messages_lead_id ON public.crm_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_phone ON public.crm_messages(phone);

-- ====================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_crm_updated_at ON public.leads_crm;
CREATE TRIGGER update_leads_crm_updated_at
  BEFORE UPDATE ON public.leads_crm
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- RLS: habilitar segurança por linha
-- ====================================================
ALTER TABLE public.leads_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;

-- Permitir acesso total para service_role (scripts do backend)
CREATE POLICY "service_role_all_leads_crm" ON public.leads_crm
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_crm_messages" ON public.crm_messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_crm_campaigns" ON public.crm_campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- ====================================================
-- VIEW: resumo do funil de vendas
-- ====================================================
CREATE OR REPLACE VIEW public.crm_funnel_summary AS
SELECT 
  status,
  COUNT(*) as total,
  MAX(created_at) as last_added
FROM public.leads_crm
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'scraped'     THEN 1
    WHEN 'invited'     THEN 2
    WHEN 'responded'   THEN 3
    WHEN 'in_progress' THEN 4
    WHEN 'registered'  THEN 5
    WHEN 'rejected'    THEN 6
    WHEN 'blocked'     THEN 7
  END;

-- ====================================================
-- MIGRAÇÃO DA LISTA EXISTENTE (438 médicos campanha)
-- ====================================================
-- Os 438 médicos já contactados serão importados
-- com status 'invited' automaticamente pelo script

SELECT 'Migration CRM executada com sucesso! ✅' as resultado;
