-- Allow public read of ebook files (intentional lead-magnet bucket)
DROP POLICY IF EXISTS "ebooks public read" ON storage.objects;
CREATE POLICY "ebooks public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'ebooks');