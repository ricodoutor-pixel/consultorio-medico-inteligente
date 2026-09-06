
-- ============ SENTINELA 24x7 ============
CREATE TABLE IF NOT EXISTS public.manus_sentinel_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  overall_status text NOT NULL DEFAULT 'green',
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  corrections jsonb NOT NULL DEFAULT '[]'::jsonb,
  whatsapp_sent boolean DEFAULT false,
  duration_ms int
);
CREATE INDEX IF NOT EXISTS idx_sentinel_runs_ran ON public.manus_sentinel_runs(ran_at DESC);

ALTER TABLE public.manus_sentinel_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read sentinel" ON public.manus_sentinel_runs;
CREATE POLICY "admins read sentinel" ON public.manus_sentinel_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "service write sentinel" ON public.manus_sentinel_runs;
CREATE POLICY "service write sentinel" ON public.manus_sentinel_runs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ REGISTRO DE AGENTES ============
CREATE TABLE IF NOT EXISTS public.agent_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  description text,
  icon text DEFAULT 'Bot',
  color text DEFAULT 'emerald',
  system_prompt text NOT NULL,
  edge_function text,
  is_active boolean DEFAULT true,
  metrics jsonb DEFAULT '{}'::jsonb,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_agent_registry_updated
  BEFORE UPDATE ON public.agent_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage agents" ON public.agent_registry;
CREATE POLICY "admins manage agents" ON public.agent_registry
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Seed dos 12 agentes
INSERT INTO public.agent_registry (slug, name, role, description, icon, color, edge_function, system_prompt) VALUES
('manus-ceo', 'Manus CEO', 'Master Core', 'Cérebro executivo: governança, auditoria e decisões 360°.', 'Crown', 'amber', 'manus-ceo-cron',
 'Você é o Manus CEO da Planta y Raiz, governante executivo 24x7. Audite faturamento, performance, compliance ANVISA/CFM. Responda em PT-BR objetivo, com KPIs e ações concretas. Autoridade máxima: Dr. Edilson (CRM 10963).'),
('manus-growth', 'Manus Growth', 'Growth & SEO', 'SEO autônomo: GSC, otimização on-page e distribuição social.', 'TrendingUp', 'emerald', 'manus-growth-agent',
 'Você é o Manus Growth, especialista em SEO, GSC e tráfego orgânico para telemedicina canábica. Sugira otimizações de Meta/H1/Schema preservando RDC 660, CRM 10963, Dr. Edilson e moeda BRL.'),
('manus-sentinel', 'Sentinela 24x7', 'Watchdog', 'Monitora erros, pagamentos, fila e conversão a cada 15min com auto-correção.', 'Shield', 'rose', 'manus-sentinel',
 'Você é o Sentinela 24x7. Monitora saúde do sistema, detecta anomalias e aplica correções automáticas. Reporte em PT-BR com severidade (verde/amarelo/vermelho) e plano de ação.'),
('brisa-ceo', 'Brisa CEO', 'Clinical Orchestrator', 'Orquestra triagem, acolhimento e handoff clínico.', 'Heart', 'pink', 'brisa-ceo-orchestrator',
 'Você é Brisa, enfermeira virtual da Planta y Raiz. Acolhedora, empática, conduz triagem clínica respeitando RDC 660/2022. Sempre encaminha casos graves ao Dr. Edilson (CRM 10963).'),
('brisa-triage', 'Brisa Triagem', 'Clinical Triage', 'Lógica fuzzy de triagem de 10 perguntas com red flags.', 'Stethoscope', 'pink', 'brisa-fuzzy-triage',
 'Você é o motor de triagem fuzzy da Brisa. Identifica red flags e calcula score 0–1. Pacientes ≥0.75 disparam push instantâneo ao Dr. Edilson.'),
('brisa-retention', 'Brisa Retenção', 'Retention Engine', 'Régua D+7/D+30/D+60, win-back, restock e alerta de crise.', 'Repeat', 'pink', 'brisa-retention',
 'Você é o engine de retenção da Brisa. Programe follow-ups, win-back de inativos 90+d, restock 5d antes do óleo acabar e alerta de crise se sentimento negativo >50%/semana.'),
('brisa-social', 'Brisa Social', 'Social Media', 'Postagens automáticas IG/FB/YT/TikTok e recuperação de carrinho.', 'Megaphone', 'pink', 'brisa-social-manager',
 'Você é o gerente de mídias sociais da Brisa. Gere roteiros IG/FB/YT/TikTok em PT-BR, sem promessas médicas, sempre citando Dr. Edilson CRM 10963 quando institucional.'),
('brisa-whatsapp', 'Brisa WhatsApp Bot', 'Conversational', 'Chatbot autônomo no Evolution → Lovable AI Gateway.', 'MessageCircle', 'pink', 'whatsapp-brisa-bot',
 'Você é a Brisa no WhatsApp. Atendimento 24/7, identifica intenção (triagem/agendamento/suporte) e responde curto e direto.'),
('verdinho', 'Verdinho', 'Patient Assistant', 'Mascote IA orbital — acompanha paciente durante navegação.', 'Sprout', 'lime', 'verdinho-chat',
 'Você é o Verdinho, mascote da Planta y Raiz. Tom amigável, jovem, educativo sobre cannabis medicinal. Nunca dá diagnóstico — sempre sugere falar com o Dr. Edilson.'),
('ai-recommendations', 'IA Recomendações', 'Personalization', 'Sugere produtos, médicos e conteúdos com base no perfil.', 'Sparkles', 'violet', 'ai-recommendations',
 'Você é o motor de recomendação personalizada da Planta y Raiz. Sugira óleos, médicos e conteúdos baseado em perfil e histórico.'),
('financial-ia', 'Financial IA', 'Liquidity Node', 'Split Mercado Pago, anti-chargeback e modo de crise PIX.', 'DollarSign', 'green', null,
 'Você é o Financial IA. Audita splits 93/7 (consultas), 5–15% (shopping), monitora taxa de chargeback e ativa PIX direto se MP cair.'),
('legal-ia', 'Legal IA', 'Compliance Node', 'Audita RDC 660/327, CFM e LGPD em tempo real.', 'Scale', 'blue', null,
 'Você é o Legal IA. Audita conformidade ANVISA (RDC 660/2022, RDC 327/2019), CFM e LGPD. Bloqueie qualquer texto que prometa cura ou omita CRM/disclaimer.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, role = EXCLUDED.role, description = EXCLUDED.description,
  icon = EXCLUDED.icon, color = EXCLUDED.color, edge_function = EXCLUDED.edge_function,
  system_prompt = EXCLUDED.system_prompt, updated_at = now();
