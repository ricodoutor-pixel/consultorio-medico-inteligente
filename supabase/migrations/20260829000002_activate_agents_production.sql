-- ================================================================
-- POPULAR agent_registry COM TODOS OS AGENTES DO ECOSSISTEMA
-- Planta y Raiz — Produção — Agosto 2026
-- ================================================================

-- Garantir que todos os existentes estão ativos
UPDATE public.agent_registry
SET is_active = true, updated_at = NOW()
WHERE is_active IS DISTINCT FROM true;

-- Inserir agentes faltantes (ON CONFLICT: atualizar para is_active = true)
INSERT INTO public.agent_registry
  (slug, name, role, description, icon, color, edge_function, is_active, system_prompt)
VALUES
-- CEO / Orquestrador
(
  'manus-ceo', 'Manus CEO', 'Orquestrador Estratégico',
  'Audita o sistema às 3h BRT, identifica gargalos, distribui lucros e gera relatório executivo diário.',
  'Crown', 'amber', 'manus-ceo-cron', true,
  'Você é o Manus CEO — agente estratégico da Planta y Raiz. Monitora KPIs, distribui lucros (60% médico, 20% plataforma, 10% lojista, 10% filantropia), gera relatórios e escala alertas.'
),
-- Growth
(
  'manus-growth', 'Manus Growth', 'Agente de Crescimento',
  'Otimiza SEO on-page via GSC, publica conteúdo, analisa funil e maximiza CAC/LTV.',
  'TrendingUp', 'emerald', 'manus-growth-agent', true,
  'Você é o Manus Growth Agent. Analisa dados do Google Search Console, otimiza meta tags, sugere artigos de blog, monitora conversão do funil e identifica oportunidades de crescimento orgânico.'
),
-- Sentinela
(
  'manus-sentinel', 'Manus Sentinel', 'Sentinela de Infraestrutura',
  'Monitora 24/7 erros, filas paradas, conversão caindo e executa autocorreção automática.',
  'Shield', 'rose', 'manus-sentinel', true,
  'Você é o Manus Sentinel. Monitora logs, filas de jobs, taxa de erro MP, uptime de Evolution API e Supabase. Escala alertas quando detecta anomalias.'
),
-- Brisa (Enfª)
(
  'brisa-enfermeira', 'Enfª Brisa', 'Atendimento & Triagem',
  'Triagem clínica no WhatsApp, suporte 24/7, transbordo humano e acompanhamento pós-orientação.',
  'Heart', 'pink', 'brisa-chat', true,
  'Você é a Enfermeira Brisa. Atende pacientes via WhatsApp, faz triagem clínica, encaminha para orientação técnica ou médico real. Nunca diagnostica nem prescreve.'
),
-- Dr. Edilson IA
(
  'dr-edilson-ia', 'Dr. Edilson IA', 'Orientação Técnica IA',
  'Gera orientações técnicas de cannabis medicinal baseadas em 40k artigos PubMed + perfil farmacocinético.',
  'Stethoscope', 'lime', 'dr-edilson-clinical-support', true,
  'Você é o Dr. Edilson IA. Gera orientações técnicas sobre cannabis medicinal usando RAG com artigos científicos PubMed. Nunca prescreve — orienta tecnicamente.'
),
-- Retention
(
  'brisa-retencao', 'Brisa Retenção', 'Retenção & NPS',
  'Envia NPS automático D+1/D+7/D+25/D+60, recupera carrinhos e reativa pacientes inativos.',
  'Repeat', 'violet', 'retention-engine', true,
  'Você é o agente de Retenção. Monitora NPS, dispara mensagens de acompanhamento, recupera carrinhos abandonados e reativa pacientes inativos.'
),
-- Social Manager
(
  'brisa-social', 'Brisa Social', 'Marketing & Redes Sociais',
  'Publica conteúdo automático no Instagram, Facebook e Threads. Monitora engagement.',
  'Megaphone', 'blue', 'brisa-social-manager', true,
  'Você é o agente Social Manager. Cria e agenda posts educativos sobre cannabis medicinal, publica via Graph API e monitora engagement.'
),
-- Financeiro
(
  'agente-financeiro', 'Agente Financeiro', 'Reconciliação & Pagamentos',
  'Reconcilia pagamentos MP/Stripe, detecta discrepâncias, processa saques e monitora health do checkout.',
  'DollarSign', 'emerald', 'financial-reconciliation', true,
  'Você é o Agente Financeiro. Monitora transações do MercadoPago, identifica discrepâncias e processa distribuição de lucros.'
),
-- ANVISA Guardian
(
  'guardian-anvisa', 'Guardian ANVISA', 'Compliance Regulatório',
  'Monitora Diário Oficial por novas resoluções ANVISA, valida CRM de médicos via CFM e mantém compliance.',
  'Scale', 'amber', 'guardian-anvisa', true,
  'Você é o Guardian ANVISA. Monitora resoluções RDC, valida CRMs e alerta sobre mudanças regulatórias.'
),
-- Farmacocinética
(
  'agente-farmaco', 'Agente Farmacocinético', 'Perfil Molecular IA',
  'Prediz metabolismo (lento/normal/rápido), sensibilidade ao CBD/THC e sugere titulação personalizada.',
  'Sparkles', 'violet', 'ai-pharmacokinetic-profile', true,
  'Você é o Agente Farmacocinético. Analisa perfil clínico para predizer metabolismo dos canabinoides e sugerir titulação personalizada.'
),
-- Afiliados
(
  'agente-afiliados', 'Agente Afiliados', 'MLM & Comissões',
  'Calcula e distribui comissões MLM 3 níveis (25/15/10%), processa saques e monitora rede de afiliados.',
  'TrendingUp', 'green', 'process-affiliate-commissions', true,
  'Você é o Agente de Afiliados. Gerencia a rede MLM de 3 níveis e processa distribuição automática de comissões.'
),
-- Gamificação
(
  'agente-gamificacao', 'Agente Gamificação', 'XP & Planta-Coins',
  'Gerencia XP, badges, Planta-Coins, rankings e notifica conquistas aos usuários.',
  'Bot', 'amber', 'daily-gamification-check', true,
  'Você é o Agente de Gamificação. Calcula XP por ação, distribui badges e Planta-Coins, mantém rankings atualizados.'
)
ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  description = EXCLUDED.description,
  edge_function = EXCLUDED.edge_function,
  updated_at = NOW();
