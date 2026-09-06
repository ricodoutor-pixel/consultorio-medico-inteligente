-- ================================================================
-- CLEANUP: Remover seeds de teste do KYC
-- Manter APENAS registros reais de produção
-- ================================================================

-- Criar log de cleanup
CREATE TABLE IF NOT EXISTS public.cleanup_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT,
  records_deleted INTEGER DEFAULT 0,
  condition TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Remover KYC docs de médicos de teste (se existir a tabela)
DO $$
DECLARE del_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'doctor_kyc_documents') THEN
    DELETE FROM public.doctor_kyc_documents dkd
    WHERE dkd.doctor_id IN (
      SELECT d.id FROM public.doctors d
      JOIN auth.users u ON u.id = d.user_id
      WHERE u.email ILIKE '%@test.%'
         OR u.email ILIKE '%@example.%'
         OR u.email ILIKE '%lovable.dev%'
    );
    GET DIAGNOSTICS del_count = ROW_COUNT;
    INSERT INTO public.cleanup_log (table_name, records_deleted, condition)
    VALUES ('doctor_kyc_documents', del_count, 'test email domains');
  END IF;
END $$;

-- 2. Limpar job_queue de jobs de teste antigos (> 7 dias)
DO $$
DECLARE del_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_queue') THEN
    DELETE FROM public.job_queue
    WHERE payload::text ILIKE '%test%'
      AND status IN ('pending', 'failed')
      AND created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS del_count = ROW_COUNT;
    INSERT INTO public.cleanup_log (table_name, records_deleted, condition)
    VALUES ('job_queue', del_count, 'test payloads older than 7 days');
  END IF;
END $$;

-- 3. Limpar error_logs antigos (> 30 dias) para performance
DO $$
DECLARE del_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'error_logs') THEN
    DELETE FROM public.error_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS del_count = ROW_COUNT;
    INSERT INTO public.cleanup_log (table_name, records_deleted, condition)
    VALUES ('error_logs', del_count, 'older than 30 days');
  END IF;
END $$;

-- 4. Limpar audit_log antigos (> 90 dias)
DO $$
DECLARE del_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    DELETE FROM public.audit_log
    WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS del_count = ROW_COUNT;
    INSERT INTO public.cleanup_log (table_name, records_deleted, condition)
    VALUES ('audit_log', del_count, 'older than 90 days');
  END IF;
END $$;

-- 5. Verificar resultado
SELECT table_name, records_deleted, executed_at
FROM public.cleanup_log
ORDER BY executed_at DESC;
