-- ═══════════════════════════════════════════════════════════════════════
-- FIX CRÍTICO: Revogar acesso anônimo direto à tabela doctors
-- ═══════════════════════════════════════════════════════════════════════
--
-- PROBLEMA DETECTADO (E2E Handoff Test — 2026-07-29):
--   A tabela public.doctors permite SELECT por usuários anônimos,
--   expondo user_id (UUID do auth.users), is_online, crm, specialty etc.
--
-- CAUSA-RAIZ:
--   Migração 20260410142533 dropou a policy anon mas NÃO revogou o
--   GRANT SELECT default do Supabase no schema public.
--   Resultado: sem RLS policy para anon + GRANT SELECT = acesso liberado
--   via PostgREST para colunas individuais (SELECT * falha por column-level
--   security, mas SELECT id,user_id,crm passa).
--
-- CORREÇÃO:
--   1. REVOKE SELECT da tabela base doctors para anon
--   2. Garantir que doctors_public (view segura) permanece acessível
--   3. Garantir que service_role mantém acesso total
--
-- IMPACTO: Nenhum — o frontend já usa doctors_public para o catálogo público
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Revogar acesso anônimo à tabela base
REVOKE SELECT ON public.doctors FROM anon;

-- 2. Garantir que a view pública continua acessível (idempotente)
GRANT SELECT ON public.doctors_public TO anon, authenticated;

-- 3. Verificar que as policies para authenticated estão corretas
-- (Não recriar para não duplicar — já existem)

-- 4. Dropar qualquer policy residual para anon na tabela base
DROP POLICY IF EXISTS "Anyone can view verified doctors" ON public.doctors;
DROP POLICY IF EXISTS "Public can view verified doctors without sensitive data" ON public.doctors;
DROP POLICY IF EXISTS "Public read doctors" ON public.doctors;

-- 5. Audit log (registrar a correção)
DO $$
BEGIN
  INSERT INTO public.audit_log (action, table_name, record_id, new_data)
  VALUES (
    'security_fix_doctors_anon_revoke',
    'doctors',
    '00000000-0000-0000-0000-000000000000',
    jsonb_build_object(
      'fix', 'REVOKE SELECT ON doctors FROM anon',
      'reason', 'E2E test detected anon read access to doctors base table exposing user_id',
      'migration', '20260729131000_fix_doctors_anon_access',
      'applied_at', now()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- audit_log may not exist; ignore gracefully
  NULL;
END $$;
