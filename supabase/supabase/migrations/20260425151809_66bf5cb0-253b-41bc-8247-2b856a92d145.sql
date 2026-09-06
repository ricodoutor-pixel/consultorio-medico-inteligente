
INSERT INTO storage.buckets (id, name, public) VALUES ('ebooks', 'ebooks', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read ebooks"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'ebooks');

CREATE POLICY "Admin upload ebooks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebooks'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin update ebooks"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ebooks'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin delete ebooks"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ebooks'
  AND public.has_role(auth.uid(), 'admin')
);
