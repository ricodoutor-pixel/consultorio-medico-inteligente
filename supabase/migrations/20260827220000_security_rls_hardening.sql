-- =====================================================================
-- 🛡️ SECURITY & RLS HARDENING (Auditoria Red-Team Consolidação 2026-08-27)
-- =====================================================================

-- 1. Tabela ai_anamnesis (Dados Médicos e Sintomatologia)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_anamnesis') THEN
    ALTER TABLE public.ai_anamnesis ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any to avoid duplicates
    DROP POLICY IF EXISTS "Users can read own anamnesis" ON public.ai_anamnesis;
    DROP POLICY IF EXISTS "Users can insert own anamnesis" ON public.ai_anamnesis;
    DROP POLICY IF EXISTS "Doctors can read anamnesis" ON public.ai_anamnesis;
    DROP POLICY IF EXISTS "Admins have full access to anamnesis" ON public.ai_anamnesis;

    -- Patient can read own records
    CREATE POLICY "Users can read own anamnesis" ON public.ai_anamnesis
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = patient_id OR 
        auth.uid()::text = patient_id::text
      );

    -- Patient can create own records
    CREATE POLICY "Users can insert own anamnesis" ON public.ai_anamnesis
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = patient_id OR 
        auth.uid()::text = patient_id::text
      );

    -- Verified doctors can read anamnesis for clinical care
    CREATE POLICY "Doctors can read anamnesis" ON public.ai_anamnesis
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.doctors 
          WHERE user_id = auth.uid() 
          AND (is_verified = true OR is_approved = true OR status = 'approved')
        )
      );

    -- Administrators have full read access
    CREATE POLICY "Admins have full access to anamnesis" ON public.ai_anamnesis
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- 2. Tabela btc_subscriptions (Assinaturas Bitcoin / Cripto)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'btc_subscriptions') THEN
    ALTER TABLE public.btc_subscriptions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own btc subscriptions" ON public.btc_subscriptions;
    DROP POLICY IF EXISTS "Users can insert own btc subscriptions" ON public.btc_subscriptions;
    DROP POLICY IF EXISTS "Admins manage all btc subscriptions" ON public.btc_subscriptions;

    CREATE POLICY "Users can view own btc subscriptions" ON public.btc_subscriptions
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- INSERT strictly enforcing user_id = auth.uid()
    CREATE POLICY "Users can insert own btc subscriptions" ON public.btc_subscriptions
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Admins manage all btc subscriptions" ON public.btc_subscriptions
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- 3. Tabela wallets (Saldos e Carteiras Financeiras)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
    ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can read own wallet" ON public.wallets;
    DROP POLICY IF EXISTS "Admins can manage wallets" ON public.wallets;

    CREATE POLICY "Users can read own wallet" ON public.wallets
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "Admins can manage wallets" ON public.wallets
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- 4. Tabela brisa_triages (Triagens Clínicas da Brisa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brisa_triages') THEN
    ALTER TABLE public.brisa_triages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can read own triages" ON public.brisa_triages;
    DROP POLICY IF EXISTS "Users can insert own triages" ON public.brisa_triages;
    DROP POLICY IF EXISTS "Doctors and admins can read triages" ON public.brisa_triages;

    CREATE POLICY "Users can read own triages" ON public.brisa_triages
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() OR 
        patient_id = auth.uid()
      );

    CREATE POLICY "Users can insert own triages" ON public.brisa_triages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid() OR 
        patient_id = auth.uid()
      );

    CREATE POLICY "Doctors and admins can read triages" ON public.brisa_triages
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- 5. Storage Buckets Constraints (MIME Types e Limites de Tamanho Server-Side)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    -- Bucket doctor-kyc-documents: Max 10MB, apenas imagens e PDFs
    UPDATE storage.buckets
    SET
      file_size_limit = 10485760, -- 10MB
      allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
      ]
    WHERE id = 'doctor-kyc-documents';

    -- Bucket strain-images: Max 5MB, imagens apenas
    UPDATE storage.buckets
    SET
      file_size_limit = 5242880, -- 5MB
      allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ]
    WHERE id = 'strain-images';
  END IF;
END $$;
