-- ============================================================================
-- Migração Brisa v2: Segurança, Identificador Único, Opt-Out e Onboarding Médico
-- Planta y Raíz Ltda — Lovable Cloud Oficial (shmbwdjuddvquszwkvuq)
-- ============================================================================

-- 1. whatsapp_contacts: Unificação de @lid e número normal sob identificador único
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  jid_normalizado TEXT PRIMARY KEY,
  jids_alternativos JSONB NOT NULL DEFAULT '[]'::jsonb,
  nome_limpo TEXT,
  tipo TEXT NOT NULL DEFAULT 'desconhecido' CHECK (tipo IN ('medico', 'paciente', 'farmacia', 'empresa', 'desconhecido')),
  origem_do_contato TEXT NOT NULL DEFAULT 'diretorios_medicos_abertos_lgpd',
  crm TEXT,
  crm_state TEXT,
  doctor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_tipo ON public.whatsapp_contacts(tipo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_crm ON public.whatsapp_contacts(crm);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_doctor ON public.whatsapp_contacts(doctor_user_id);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role tem acesso total a whatsapp_contacts"
  ON public.whatsapp_contacts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins podem visualizar whatsapp_contacts"
  ON public.whatsapp_contacts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins podem gerenciar whatsapp_contacts"
  ON public.whatsapp_contacts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 2. whatsapp_conversation_state: Controle de pausa e detecção de atendente humano (24h)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_state (
  jid_normalizado TEXT PRIMARY KEY REFERENCES public.whatsapp_contacts(jid_normalizado) ON DELETE CASCADE,
  ai_paused BOOLEAN NOT NULL DEFAULT false,
  motivo TEXT,
  pausado_em TIMESTAMPTZ,
  pausado_por TEXT,
  retomar_em TIMESTAMPTZ,
  last_human_activity_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_state_paused ON public.whatsapp_conversation_state(ai_paused);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_state_retomar ON public.whatsapp_conversation_state(retomar_em);

ALTER TABLE public.whatsapp_conversation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role tem acesso total a whatsapp_conversation_state"
  ON public.whatsapp_conversation_state FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar whatsapp_conversation_state"
  ON public.whatsapp_conversation_state FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 3. whatsapp_optouts: Registro de cancelamento LGPD (Zero Tolerância)
CREATE TABLE IF NOT EXISTS public.whatsapp_optouts (
  jid_normalizado TEXT PRIMARY KEY,
  motivo TEXT NOT NULL DEFAULT 'solicitacao_direta_usuario',
  texto_solicitacao TEXT,
  ip_address TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_optouts_criado ON public.whatsapp_optouts(criado_em DESC);

ALTER TABLE public.whatsapp_optouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role tem acesso total a whatsapp_optouts"
  ON public.whatsapp_optouts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins podem ler whatsapp_optouts"
  ON public.whatsapp_optouts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 4. whatsapp_handoffs: Fila de transbordo e atendimento humano com SLA
CREATE TABLE IF NOT EXISTS public.whatsapp_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jid_normalizado TEXT NOT NULL REFERENCES public.whatsapp_contacts(jid_normalizado) ON DELETE CASCADE,
  nome_contato TEXT,
  motivo TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'resolvido', 'cancelado')),
  atribuido_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_limite_em TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 hours'),
  resolvido_em TIMESTAMPTZ,
  notas JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_status ON public.whatsapp_handoffs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_prioridade ON public.whatsapp_handoffs(prioridade);
CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_sla ON public.whatsapp_handoffs(sla_limite_em) WHERE status = 'pendente';

ALTER TABLE public.whatsapp_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role tem acesso total a whatsapp_handoffs"
  ON public.whatsapp_handoffs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar whatsapp_handoffs"
  ON public.whatsapp_handoffs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 5. doctor_onboarding: Controle do funil de credenciamento e KYC médico
CREATE TABLE IF NOT EXISTS public.doctor_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jid_normalizado TEXT NOT NULL REFERENCES public.whatsapp_contacts(jid_normalizado) ON DELETE CASCADE,
  doctor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  crm TEXT,
  crm_state TEXT,
  nome_medico TEXT NOT NULL,
  email TEXT,
  etapa TEXT NOT NULL DEFAULT 'convidado' CHECK (
    etapa IN (
      'convidado',
      'respondeu',
      'interessado',
      'link_enviado',
      'documentos_em_analise',
      'aprovado_vitrine',
      'primeira_consulta',
      'recusado'
    )
  ),
  documentos_recebidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  documentos_pendentes JSONB NOT NULL DEFAULT '["crm", "comprovante_residencia", "diploma_ou_rqe", "chave_pix"]'::jsonb,
  prazo_estimado TEXT NOT NULL DEFAULT 'Em até 24 a 48 horas úteis',
  historico_etapas JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctor_onboarding_etapa ON public.doctor_onboarding(etapa);
CREATE INDEX IF NOT EXISTS idx_doctor_onboarding_crm ON public.doctor_onboarding(crm);
CREATE INDEX IF NOT EXISTS idx_doctor_onboarding_doctor ON public.doctor_onboarding(doctor_user_id);

ALTER TABLE public.doctor_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role tem acesso total a doctor_onboarding"
  ON public.doctor_onboarding FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar doctor_onboarding"
  ON public.doctor_onboarding FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
