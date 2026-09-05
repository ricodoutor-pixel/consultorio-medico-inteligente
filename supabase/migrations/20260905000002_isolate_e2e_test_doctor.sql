-- ======================================================================
-- MIGRATION: ISOLAMENTO DE REGISTROS DE TESTE E2E (Tarefa 0.7)
-- Data: 2026-09-05
-- ======================================================================

-- 1. Adiciona flag de registro de teste na tabela doctors
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS is_test_record BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS test_notes TEXT;

-- 2. Identifica e isola registros de teste conhecidos (ex: CRM E2E-TEST-0001)
-- REGRA CRÍTICA: Dr. Edilson Bezerra da Silva (CRM-SP 214589) é diretor clínico real
-- e NUNCA deve ser classificado como teste ou excluído.
UPDATE public.doctors
SET 
  is_test_record = true,
  test_notes = 'Registro gerado durante suite de testes automatizados E2E',
  is_approved_by_admin = false,
  is_verified = false,
  is_online = false,
  is_available = false,
  approval_status = 'blocked'
WHERE 
  (
    crm ILIKE '%TEST%' OR 
    crm = 'E2E-TEST-0001' OR 
    full_name ILIKE '%E2E-TEST%' OR 
    full_name ILIKE '%Robô de Teste%'
  )
  AND crm NOT IN ('214589', '186358', '49354', '198742')
  AND (full_name IS NULL OR full_name NOT ILIKE '%Edilson%');

-- 3. Índice para filtros rápidos excluindo registros de teste
CREATE INDEX IF NOT EXISTS idx_doctors_is_test_record ON public.doctors(is_test_record);

-- 4. Comentário descritivo para governança e auditoria CFM
COMMENT ON COLUMN public.doctors.is_test_record IS 'Flag indicativa de registro de automação de testes sintéticos E2E; mantido para integridade referencial com bloqueio público irrestrito.';
