
-- 1) Publicar cards de médicos verificados sem exigir login
--    Muda a view doctors_public para security_invoker=off para bypassar
--    o RLS restritivo da tabela base doctors, mantendo apenas colunas seguras.
ALTER VIEW public.doctors_public SET (security_invoker=off);

GRANT SELECT ON public.doctors_public TO anon, authenticated;

-- 2) Garantir que médicos autenticados leem sua própria linha para editar
--    (política já existe, mas garantimos idempotência)
DROP POLICY IF EXISTS "Doctors can view own profile" ON public.doctors;
CREATE POLICY "Doctors can view own profile"
  ON public.doctors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 3) Atualizar avatar da Dra. Suelen para o asset local
UPDATE public.profiles
SET avatar_url = '/avatars/dra-suelen.png'
WHERE id = '51c28fdd-ccd4-4b84-a0da-3cf604233804';

-- 4) Storage: garantir upload/update de avatars por usuários autenticados
--    (política já existe; recriar para idempotência e assegurar TO authenticated)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5) Storage: doctor-kyc-documents — permitir médico gerenciar seus próprios docs
DROP POLICY IF EXISTS "Doctors upload own kyc" ON storage.objects;
CREATE POLICY "Doctors upload own kyc"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'doctor-kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Doctors read own kyc" ON storage.objects;
CREATE POLICY "Doctors read own kyc"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'doctor-kyc-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR has_role(auth.uid(), 'admin'::app_role))
  );

DROP POLICY IF EXISTS "Doctors update own kyc" ON storage.objects;
CREATE POLICY "Doctors update own kyc"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'doctor-kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'doctor-kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
