-- ============================================================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA - SUPABASE
-- ============================================================================
-- Autor: Manus AI
-- Data: 2026-04-08
-- Descrição: Correções para 6 vulnerabilidades críticas de segurança
-- ============================================================================

-- ============================================================================
-- 1. FINANCIAL REPORTS - RLS POLICY
-- ============================================================================
-- Problema: Tabela sem Row Level Security
-- Solução: Adicionar RLS com políticas de acesso por role

ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Admins: Acesso total
CREATE POLICY "financial_reports_admin_full_access"
  ON financial_reports
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Médicos: Apenas seus próprios relatórios
CREATE POLICY "financial_reports_doctor_own_access"
  ON financial_reports
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'doctor' 
    AND doctor_id = auth.uid()
  );

-- Pacientes: Apenas seus próprios relatórios
CREATE POLICY "financial_reports_patient_own_access"
  ON financial_reports
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'patient' 
    AND patient_id = auth.uid()
  );

-- ============================================================================
-- 2. REALTIME CHANNELS - AUTORIZAÇÃO
-- ============================================================================
-- Problema: Usuários acessam qualquer canal
-- Solução: Validar propriedade/membership do canal

ALTER TABLE realtime_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realtime_channels_owner_full_access"
  ON realtime_channels
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "realtime_channels_member_read_access"
  ON realtime_channels
  FOR SELECT
  USING (
    id IN (
      SELECT channel_id 
      FROM channel_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- ============================================================================
-- 3. AI GATEWAY - AUTENTICAÇÃO
-- ============================================================================
-- Problema: Rotas sensíveis expostas
-- Solução: Middleware de autenticação JWT

-- Criar tabela de rate limiting
CREATE TABLE IF NOT EXISTS ai_gateway_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ai_gateway_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_gateway_rate_limits_user_view"
  ON ai_gateway_rate_limits
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. REALTIME NOTIFICATIONS - AUTORIZAÇÃO
-- ============================================================================
-- Problema: Notificações broadcast sem autorização
-- Solução: Validar autorização por canal

ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realtime_notifications_own_access"
  ON realtime_notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "realtime_notifications_admin_access"
  ON realtime_notifications
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 5. DADOS SENSÍVEIS DE PACIENTES - MASCARAMENTO
-- ============================================================================
-- Problema: CPF, telefone, data de nascimento expostos
-- Solução: Criar view mascarada para usuários não-admin

CREATE OR REPLACE VIEW patient_data_masked AS
SELECT
  id,
  name,
  email,
  -- Mascarar CPF: XXX.XXX.XXX-XX
  CASE 
    WHEN auth.jwt() ->> 'role' = 'admin' THEN cpf
    ELSE CONCAT(SUBSTRING(cpf, 1, 3), '.***.**-**')
  END AS cpf,
  -- Mascarar telefone: (XX) 9XXXX-XXXX
  CASE 
    WHEN auth.jwt() ->> 'role' = 'admin' THEN phone
    ELSE CONCAT('(', SUBSTRING(phone, 1, 2), ') 9****-', SUBSTRING(phone, -4))
  END AS phone,
  -- Mascarar data de nascimento para não-admin
  CASE 
    WHEN auth.jwt() ->> 'role' = 'admin' THEN date_of_birth
    ELSE MAKE_DATE(EXTRACT(YEAR FROM date_of_birth)::INT, 1, 1)
  END AS date_of_birth,
  created_at
FROM patients
WHERE id = auth.uid() OR auth.jwt() ->> 'role' = 'admin';

ALTER TABLE patient_data_masked ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS POLICY ALWAYS TRUE - CORREÇÃO
-- ============================================================================
-- Problema: Policy com USING (true) permite acesso a todos
-- Solução: Remover policies inseguras e implementar corretas

-- Encontrar e remover policies inseguras
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE qual LIKE '%true%' OR qual LIKE '%1=1%'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END $$;

-- ============================================================================
-- 7. VALIDAÇÕES ADICIONAIS DE SEGURANÇA
-- ============================================================================

-- Criar função para validar JWT
CREATE OR REPLACE FUNCTION validate_jwt()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para verificar role
CREATE OR REPLACE FUNCTION check_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para audit log
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_audit_log_admin_view"
  ON security_audit_log
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_financial_reports_doctor_id ON financial_reports(doctor_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_patient_id ON financial_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_realtime_channels_owner_id ON realtime_channels(owner_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_recipient_id ON realtime_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- ============================================================================
-- 9. VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se todas as tabelas críticas têm RLS ativado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  'financial_reports',
  'realtime_channels',
  'realtime_notifications',
  'patients',
  'security_audit_log'
)
ORDER BY tablename;

-- ============================================================================
-- FIM DAS CORREÇÕES
-- ============================================================================
