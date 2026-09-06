INSERT INTO storage.buckets (id, name, public) VALUES ('social-posts', 'social-posts', true) ON CONFLICT (id) DO UPDATE SET public = true;
DROP POLICY IF EXISTS "Public read social-posts" ON storage.objects;
CREATE POLICY "Public read social-posts" ON storage.objects FOR SELECT USING (bucket_id = 'social-posts');
DROP POLICY IF EXISTS "Service write social-posts" ON storage.objects;
CREATE POLICY "Service write social-posts" ON storage.objects FOR INSERT TO authenticated, service_role WITH CHECK (bucket_id = 'social-posts');