-- ============================================================================
-- Explicit SELECT policies for public marketing buckets
-- (documents intent — these buckets are public by design)
-- ============================================================================

DROP POLICY IF EXISTS "Public read access to ebooks" ON storage.objects;
CREATE POLICY "Public read access to ebooks"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ebooks');

DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
CREATE POLICY "Public read access to avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public read access to experience-images" ON storage.objects;
CREATE POLICY "Public read access to experience-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'experience-images');

DROP POLICY IF EXISTS "Public read access to strain-images" ON storage.objects;
CREATE POLICY "Public read access to strain-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'strain-images');

-- ============================================================================
-- conversion_leads: explicit denial for client-side inserts
-- (writes happen exclusively via edge functions using service_role,
--  which bypasses RLS — this policy makes the restriction explicit)
-- ============================================================================

DROP POLICY IF EXISTS "Block client-side inserts on conversion_leads" ON public.conversion_leads;
CREATE POLICY "Block client-side inserts on conversion_leads"
  ON public.conversion_leads
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);