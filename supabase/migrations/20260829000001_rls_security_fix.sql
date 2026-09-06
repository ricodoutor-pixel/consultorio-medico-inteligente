-- ================================================================
-- SECURITY FIX P0: RLS em tabelas sem proteção
-- Auditoria Red-Team Planta y Raiz — Agosto 2026
-- ================================================================

-- 1. ai_anamnesis — dados médicos sensíveis (LGPD Art. 46)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_anamnesis') THEN
    ALTER TABLE public.ai_anamnesis ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "patient_own_anamnesis" ON public.ai_anamnesis;
    CREATE POLICY "patient_own_anamnesis"
      ON public.ai_anamnesis FOR ALL
      USING (patient_id = auth.uid());

    DROP POLICY IF EXISTS "doctor_read_anamnesis" ON public.ai_anamnesis;
    CREATE POLICY "doctor_read_anamnesis"
      ON public.ai_anamnesis FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.appointments a
          WHERE a.id = ai_anamnesis.appointment_id
            AND a.doctor_id IN (
              SELECT id FROM public.doctors WHERE user_id = auth.uid()
            )
        )
      );

    DROP POLICY IF EXISTS "admin_all_anamnesis" ON public.ai_anamnesis;
    CREATE POLICY "admin_all_anamnesis"
      ON public.ai_anamnesis FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );

    DROP POLICY IF EXISTS "service_all_anamnesis" ON public.ai_anamnesis;
    CREATE POLICY "service_all_anamnesis"
      ON public.ai_anamnesis FOR ALL
      USING (auth.role() = 'service_role');

    RAISE NOTICE 'OK: RLS ativado em ai_anamnesis';
  ELSE
    RAISE NOTICE 'SKIP: tabela ai_anamnesis não existe';
  END IF;
END $$;

-- 2. wallets — dados financeiros
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallets') THEN
    ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "user_own_wallet" ON public.wallets;
    CREATE POLICY "user_own_wallet"
      ON public.wallets FOR ALL
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "admin_all_wallets" ON public.wallets;
    CREATE POLICY "admin_all_wallets"
      ON public.wallets FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );

    DROP POLICY IF EXISTS "service_all_wallets" ON public.wallets;
    CREATE POLICY "service_all_wallets"
      ON public.wallets FOR ALL
      USING (auth.role() = 'service_role');

    RAISE NOTICE 'OK: RLS ativado em wallets';
  ELSE
    RAISE NOTICE 'SKIP: tabela wallets não existe';
  END IF;
END $$;

-- 3. brisa_triages — dados clínicos de triagem
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brisa_triages') THEN
    ALTER TABLE public.brisa_triages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "patient_own_triage" ON public.brisa_triages;
    CREATE POLICY "patient_own_triage"
      ON public.brisa_triages FOR ALL
      USING (patient_id = auth.uid());

    DROP POLICY IF EXISTS "service_all_triages" ON public.brisa_triages;
    CREATE POLICY "service_all_triages"
      ON public.brisa_triages FOR ALL
      USING (auth.role() = 'service_role');

    RAISE NOTICE 'OK: RLS ativado em brisa_triages';
  ELSE
    RAISE NOTICE 'SKIP: tabela brisa_triages não existe';
  END IF;
END $$;
