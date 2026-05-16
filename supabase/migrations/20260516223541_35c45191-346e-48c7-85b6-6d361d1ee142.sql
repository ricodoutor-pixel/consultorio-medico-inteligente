
ALTER PUBLICATION supabase_realtime DROP TABLE public.payment_provider_health;
ALTER PUBLICATION supabase_realtime DROP TABLE public.alert_history;

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public read strain-images" ON storage.objects;
CREATE POLICY "Public read strain-images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'strain-images');

DROP POLICY IF EXISTS "Public read experience-images" ON storage.objects;
CREATE POLICY "Public read experience-images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'experience-images');
