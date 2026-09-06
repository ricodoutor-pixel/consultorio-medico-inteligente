-- =====================================================================
-- RLS HARDENING + AUDIT LOG (idempotente, com rollback automático)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tabela de auditoria
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rls_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,
  user_role   text,
  action      text NOT NULL,           -- INSERT | UPDATE | DELETE | SELECT_DENIED | ACCESS_GRANTED
  table_name  text NOT NULL,
  was_allowed boolean NOT NULL,
  reason      text,
  row_pk      text,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rls_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_audit_log: admins read" ON public.rls_audit_log;
CREATE POLICY "rls_audit_log: admins read"
  ON public.rls_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_rls_audit_log_table_time
  ON public.rls_audit_log (table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rls_audit_log_user
  ON public.rls_audit_log (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 2. Função de auditoria (SECURITY DEFINER para bypassar RLS no insert)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_is_admin boolean := false;
  v_pk      text;
BEGIN
  IF v_uid IS NOT NULL THEN
    v_is_admin := public.has_role(v_uid, 'admin'::app_role);
  END IF;

  BEGIN
    v_pk := COALESCE(NEW.id::text, OLD.id::text);
  EXCEPTION WHEN OTHERS THEN
    v_pk := NULL;
  END;

  INSERT INTO public.rls_audit_log
    (user_id, user_role, action, table_name, was_allowed, reason, row_pk)
  VALUES (
    v_uid,
    CASE
      WHEN v_uid IS NULL THEN 'service_or_anon'
      WHEN v_is_admin    THEN 'admin'
      ELSE 'authenticated_non_admin'
    END,
    TG_OP,
    TG_TABLE_NAME,
    true, -- só dispara em operações que passaram pelo RLS
    'Operation passed RLS policies',
    v_pk
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ---------------------------------------------------------------------
-- 3. Helper para garantir RLS admin-only + trigger de auditoria
-- ---------------------------------------------------------------------
DO $$
DECLARE
  t text;
  sensitive_tables text[] := ARRAY[
    'social_interactions',
    'whatsapp_conversations',
    'whatsapp_routing_log',
    'alert_history',
    'pagamentos_audit',
    'webhook_events'
  ];
  policy_name text := 'admins_full_access';
  trig_name   text;
BEGIN
  FOREACH t IN ARRAY sensitive_tables LOOP
    -- Pular se a tabela não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE 'Skipping % (table does not exist)', t;
      CONTINUE;
    END IF;

    -- Habilita RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Recria política admin-only (idempotente)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL
         USING (public.has_role(auth.uid(), ''admin''::app_role))
         WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))',
      policy_name, t
    );

    -- Trigger de auditoria (idempotente)
    trig_name := 'audit_' || t;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trig_name, t);
    EXECUTE format(
      'CREATE TRIGGER %I
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access()',
      trig_name, t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. Confirma que leads_contatos e app_downloads continuam abertos para INSERT anônimo
--    (sem alterar políticas existentes — apenas garante que RLS está ativo)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='leads_contatos') THEN
    EXECUTE 'ALTER TABLE public.leads_contatos ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='app_downloads') THEN
    EXECUTE 'ALTER TABLE public.app_downloads ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

COMMIT;