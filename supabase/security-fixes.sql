-- ============================================================================
-- CORREÇÕES DE SEGURANÇA - CONSULTÓRIO MÉDICO INTELIGENTE
-- ============================================================================
-- Implementação de Row Level Security (RLS) e políticas de autorização
-- Data: 2026-04-08
-- ============================================================================

-- ============================================================================
-- FASE 1: TABELA DE RELATÓRIOS FINANCEIROS - RLS
-- ============================================================================

-- Habilitar RLS na tabela financial_reports
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Política 1: Admins podem ver todos os relatórios
CREATE POLICY "admin_view_all_financial_reports" ON financial_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 2: Médicos podem ver apenas seus próprios relatórios
CREATE POLICY "doctor_view_own_financial_reports" ON financial_reports
  FOR SELECT
  USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 3: Apenas admins podem inserir relatórios
CREATE POLICY "admin_insert_financial_reports" ON financial_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 4: Apenas admins podem atualizar relatórios
CREATE POLICY "admin_update_financial_reports" ON financial_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 5: Apenas admins podem deletar relatórios
CREATE POLICY "admin_delete_financial_reports" ON financial_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- FASE 2: CANAIS EM TEMPO REAL - AUTORIZAÇÃO
-- ============================================================================

-- Habilitar RLS na tabela realtime_channels
ALTER TABLE realtime_channels ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuários podem se inscrever apenas em canais autorizados
CREATE POLICY "user_subscribe_authorized_channels" ON realtime_channels
  FOR SELECT
  USING (
    is_public = true
    OR channel_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = realtime_channels.id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Política 2: Apenas proprietários podem criar canais
CREATE POLICY "owner_create_channels" ON realtime_channels
  FOR INSERT
  WITH CHECK (
    channel_owner_id = auth.uid()
  );

-- Política 3: Apenas proprietários podem atualizar canais
CREATE POLICY "owner_update_channels" ON realtime_channels
  FOR UPDATE
  USING (channel_owner_id = auth.uid())
  WITH CHECK (channel_owner_id = auth.uid());

-- Política 4: Apenas proprietários podem deletar canais
CREATE POLICY "owner_delete_channels" ON realtime_channels
  FOR DELETE
  USING (channel_owner_id = auth.uid());

-- Habilitar RLS na tabela channel_members
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Política 5: Usuários podem ver membros de canais que pertencem
CREATE POLICY "user_view_channel_members" ON channel_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM realtime_channels
      WHERE realtime_channels.id = channel_members.channel_id
      AND (
        realtime_channels.is_public = true
        OR realtime_channels.channel_owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM channel_members cm
          WHERE cm.channel_id = realtime_channels.id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- FASE 3: AI GATEWAY - AUTENTICAÇÃO
-- ============================================================================

-- Criar tabela de rotas protegidas do AI Gateway
CREATE TABLE IF NOT EXISTS ai_gateway_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path TEXT NOT NULL UNIQUE,
  requires_auth BOOLEAN DEFAULT true,
  required_role TEXT DEFAULT 'user',
  rate_limit_per_minute INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE ai_gateway_routes ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem gerenciar rotas
CREATE POLICY "admin_manage_ai_routes" ON ai_gateway_routes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Inserir rotas sensíveis que requerem autenticação
INSERT INTO ai_gateway_routes (route_path, requires_auth, required_role, rate_limit_per_minute) VALUES
  ('/api/ai/medical-diagnosis', true, 'doctor', 30),
  ('/api/ai/prescription-generator', true, 'doctor', 20),
  ('/api/ai/patient-analysis', true, 'doctor', 30),
  ('/api/ai/admin-reports', true, 'admin', 10),
  ('/api/ai/system-audit', true, 'admin', 5);

-- ============================================================================
-- FASE 4: NOTIFICAÇÕES EM TEMPO REAL - AUTORIZAÇÃO
-- ============================================================================

-- Habilitar RLS na tabela realtime_notifications
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuários podem ver apenas suas notificações
CREATE POLICY "user_view_own_notifications" ON realtime_notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

-- Política 2: Sistema pode inserir notificações
CREATE POLICY "system_insert_notifications" ON realtime_notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' IN ('admin', 'system')
        OR auth.users.id = sender_id
      )
    )
  );

-- Política 3: Usuários podem marcar suas notificações como lidas
CREATE POLICY "user_update_own_notifications" ON realtime_notifications
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Política 4: Usuários podem deletar suas notificações
CREATE POLICY "user_delete_own_notifications" ON realtime_notifications
  FOR DELETE
  USING (recipient_id = auth.uid());

-- ============================================================================
-- FASE 5: REGISTROS DE EVENTOS IA - POLÍTICA SELECT
-- ============================================================================

-- Habilitar RLS na tabela ai_event_logs
ALTER TABLE ai_event_logs ENABLE ROW LEVEL SECURITY;

-- Política 1: Admins podem ver todos os logs
CREATE POLICY "admin_view_all_ai_logs" ON ai_event_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 2: Usuários podem ver apenas seus próprios logs
CREATE POLICY "user_view_own_ai_logs" ON ai_event_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 3: Sistema pode inserir logs
CREATE POLICY "system_insert_ai_logs" ON ai_event_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'system')
    )
  );

-- ============================================================================
-- FASE 6: PREVENÇÃO DE ESCALAÇÃO DE PRIVILÉGIOS
-- ============================================================================

-- Habilitar RLS na tabela user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política 1: Apenas admins podem ver roles
CREATE POLICY "admin_view_user_roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 2: Usuários podem ver apenas suas próprias roles
CREATE POLICY "user_view_own_roles" ON user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 3: Apenas admins podem inserir roles (CRÍTICO)
CREATE POLICY "admin_insert_user_roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 4: Apenas admins podem atualizar roles (CRÍTICO)
CREATE POLICY "admin_update_user_roles" ON user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política 5: Apenas admins podem deletar roles
CREATE POLICY "admin_delete_user_roles" ON user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- VALIDAÇÃO E TESTES
-- ============================================================================

-- Verificar RLS habilitado em todas as tabelas críticas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'financial_reports',
  'realtime_channels',
  'channel_members',
  'realtime_notifications',
  'ai_event_logs',
  'user_roles'
);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- FIM DAS CORREÇÕES
-- ============================================================================
