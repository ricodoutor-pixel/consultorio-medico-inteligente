-- ============================================================================
-- MIGRATION: 20261114190000_crm_email_bridge_and_doctor_emails.sql
--
-- Corrige integralmente os apontamentos da Auditoria de E-mail, Brevo e CRM (14/11/2026):
-- 1. Adiciona e sincroniza a coluna `email` em `public.profiles` e `public.doctors`
--    diretamente de `auth.users.email` (backfill + triggers automáticos).
-- 2. Completa telefone e e-mail dos médicos da vitrine identificados na base verificada
--    (Dr. Alexandre Stramandinoli Correa da Silva e Dr. Gustavo Nobre Damiani Pereira).
-- 3. Cria/garante `public.medicos_parceiros_leads` e popula `medicos_parceiros_leads`,
--    `pacientes_leads` e `leads_contatos` a partir dos leads auditados e dos 2 médicos
--    que responderam ao convite por e-mail (Dr. Claudio Paciornik e Dr. Alex Sandro dos Santos).
-- 4. Registra endereços sintéticos/bounced em `public.suppressed_emails`.
-- ============================================================================

-- 1. Coluna `email` em `public.profiles` e `public.doctors`
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);

-- Backfill imediato a partir de auth.users
UPDATE public.profiles p
SET email = lower(trim(u.email))
FROM auth.users u
WHERE p.id = u.id
  AND u.email IS NOT NULL
  AND (p.email IS NULL OR trim(p.email) = '');

UPDATE public.doctors d
SET email = lower(trim(u.email))
FROM auth.users u
WHERE d.user_id = u.id
  AND u.email IS NOT NULL
  AND (d.email IS NULL OR trim(d.email) = '');

-- Backfill de telefone e e-mail dos médicos verificados da vitrine encontrados na base curada
UPDATE public.profiles
SET
  phone = COALESCE(NULLIF(trim(phone), ''), '5583981145210'),
  email = COALESCE(NULLIF(trim(email), ''), 'alexgoju2@gmail.com')
WHERE full_name ILIKE '%Alexandre Stramandinoli%';

UPDATE public.doctors d
SET email = COALESCE(NULLIF(trim(d.email), ''), 'alexgoju2@gmail.com')
FROM public.profiles p
WHERE d.user_id = p.id
  AND p.full_name ILIKE '%Alexandre Stramandinoli%';

UPDATE public.profiles
SET
  phone = COALESCE(NULLIF(trim(phone), ''), '5545991421515'),
  email = COALESCE(NULLIF(trim(email), ''), 'drgustavodamiani@gmail.com')
WHERE full_name ILIKE '%Gustavo%Damiani%';

UPDATE public.doctors d
SET email = COALESCE(NULLIF(trim(d.email), ''), 'drgustavodamiani@gmail.com')
FROM public.profiles p
WHERE d.user_id = p.id
  AND p.full_name ILIKE '%Gustavo%Damiani%';

-- Triggers para manter `profiles.email` e `doctors.email` sempre sincronizados com `auth.users.email`
CREATE OR REPLACE FUNCTION public.sync_auth_email_to_profiles_and_doctors()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.profiles
    SET email = lower(trim(NEW.email))
    WHERE id = NEW.id AND (email IS DISTINCT FROM lower(trim(NEW.email)));

    UPDATE public.doctors
    SET email = lower(trim(NEW.email))
    WHERE user_id = NEW.id AND (email IS DISTINCT FROM lower(trim(NEW.email)));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_auth_email_to_profiles_and_doctors ON auth.users;
CREATE TRIGGER trg_sync_auth_email_to_profiles_and_doctors
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_email_to_profiles_and_doctors();

CREATE OR REPLACE FUNCTION public.populate_doctor_email_on_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    SELECT lower(trim(u.email)) INTO v_email
    FROM auth.users u
    WHERE u.id = NEW.user_id;

    IF v_email IS NOT NULL THEN
      NEW.email := v_email;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_populate_doctor_email_on_write ON public.doctors;
CREATE TRIGGER trg_populate_doctor_email_on_write
  BEFORE INSERT OR UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_doctor_email_on_write();

-- 2. Tabela `public.medicos_parceiros_leads` (CRM de Médicos Prospectados e Respondentes)
CREATE TABLE IF NOT EXISTS public.medicos_parceiros_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  crm TEXT,
  uf TEXT,
  cidade TEXT,
  especialidade TEXT,
  origem TEXT DEFAULT 'brevo_crm',
  status TEXT DEFAULT 'invited',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_medicos_parceiros_leads_telefone_uniq
  ON public.medicos_parceiros_leads(telefone)
  WHERE telefone IS NOT NULL AND telefone <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_medicos_parceiros_leads_email_uniq
  ON public.medicos_parceiros_leads(email)
  WHERE email IS NOT NULL AND email <> '';

ALTER TABLE public.medicos_parceiros_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins and service_role manage medicos_parceiros_leads"
    ON public.medicos_parceiros_leads
    FOR ALL
    USING (auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin'))
    WITH CHECK (auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Índice único em `leads_contatos(telefone)` e `pacientes_leads(whatsapp)` para suportar upsert idempotente da ponte CRM
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_contatos_telefone_uniq
  ON public.leads_contatos(telefone);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_leads_whatsapp_uniq
  ON public.pacientes_leads(whatsapp);

-- 3. Registra os 2 médicos reais que responderam ao convite por e-mail (Prioridade Máxima de Contato)
INSERT INTO public.medicos_parceiros_leads (nome, email, telefone, crm, uf, cidade, especialidade, origem, status, notas)
VALUES
  (
    'Dr. Claudio Paciornik',
    'claudiopaciornik@yahoo.com.br',
    '5541988942707',
    NULL,
    'PR',
    'Curitiba',
    'Mastologia, Ginecologia e Homeopatia',
    'resposta_email_convite_socio',
    'responded',
    'Respondeu ao e-mail de convite de Médico Sócio em 13/11/2026. Também consta na auditoria de WhatsApp (554188942707 - Recepção Clínica Paciornik). Prioridade máxima de acolhimento humano.'
  ),
  (
    'Dr. Alex Sandro dos Santos',
    NULL,
    '550000000001',
    NULL,
    'BR',
    NULL,
    'Medicina Canabinoide / Clínica Médica',
    'resposta_email_convite_socio',
    'responded',
    'Respondeu ao e-mail de convite de Médico Sócio em 09/11/2026 na caixa contato@plantayraiz.com.br. Prioridade máxima de acolhimento humano.'
  )
ON CONFLICT (telefone) WHERE telefone IS NOT NULL AND telefone <> ''
DO UPDATE SET
  email = COALESCE(EXCLUDED.email, public.medicos_parceiros_leads.email),
  status = 'responded',
  notas = EXCLUDED.notas,
  updated_at = now();

-- 4. Popula `leads_contatos`, `medicos_parceiros_leads` e `pacientes_leads` a partir dos 168 contatos auditados em `whatsapp_contacts`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_contacts') THEN
    -- 4a. Todos os contatos auditados -> leads_contatos
    INSERT INTO public.leads_contatos (nome, telefone, categoria, origem, idioma, tags)
    SELECT
      COALESCE(NULLIF(trim(wc.name), ''), 'Contato WhatsApp ' || wc.phone),
      wc.phone,
      COALESCE(wc.lead_category, '4-cadastro'),
      'auditoria_whatsapp_14_11_2026',
      'pt-BR',
      ARRAY[COALESCE(wc.lead_category, 'interessado'), COALESCE(wc.funnel_stage, 'audit_imported')]
    FROM public.whatsapp_contacts wc
    WHERE wc.phone IS NOT NULL AND wc.phone <> ''
    ON CONFLICT (telefone) DO UPDATE SET
      categoria = EXCLUDED.categoria,
      tags = EXCLUDED.tags;

    -- 4b. Médicos interessados (1-medico) -> medicos_parceiros_leads
    INSERT INTO public.medicos_parceiros_leads (nome, telefone, especialidade, origem, status, notas)
    SELECT
      COALESCE(NULLIF(trim(wc.name), ''), 'Dr(a). Contato ' || wc.phone),
      wc.phone,
      'Médico(a) Prescritor(a) / CRM',
      'auditoria_whatsapp_14_11_2026',
      'responded',
      wc.notes
    FROM public.whatsapp_contacts wc
    WHERE wc.lead_category = '1-medico'
      AND wc.phone IS NOT NULL AND wc.phone <> ''
    ON CONFLICT (telefone) WHERE telefone IS NOT NULL AND telefone <> ''
    DO NOTHING;

    -- 4c. Pacientes / Consultas / Orientação (2-orientacao e 3-consulta) -> pacientes_leads
    INSERT INTO public.pacientes_leads (nome, whatsapp, sintoma, source, payload)
    SELECT
      COALESCE(NULLIF(trim(wc.name), ''), 'Contato ' || wc.phone),
      wc.phone,
      CASE WHEN wc.lead_category = '2-orientacao' THEN 'Interesse em Orientação Técnica' ELSE 'Interesse em Consulta / Agendamento' END,
      'auditoria_whatsapp_14_11_2026',
      jsonb_build_object('lead_category', wc.lead_category, 'notes', wc.notes)
    FROM public.whatsapp_contacts wc
    WHERE wc.lead_category IN ('2-orientacao', '3-consulta')
      AND wc.phone IS NOT NULL AND wc.phone <> ''
    ON CONFLICT (whatsapp) DO NOTHING;
  END IF;
END $$;

-- 5. Suprime endereços sintéticos/bounced conhecidos em `public.suppressed_emails`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppressed_emails') THEN
    INSERT INTO public.suppressed_emails (email, reason, metadata)
    VALUES
      ('larissa.santos@drsaude.com.br', 'hard_bounce_550_5_1_1_synthetic_domain', '{"audit_date":"2026-11-14"}'::jsonb),
      ('suporte@doctoralia.com', 'role_account_excluded', '{"audit_date":"2026-11-14"}'::jsonb),
      ('info@galenicaonline.it', 'foreign_non_doctor_excluded', '{"audit_date":"2026-11-14"}'::jsonb)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
