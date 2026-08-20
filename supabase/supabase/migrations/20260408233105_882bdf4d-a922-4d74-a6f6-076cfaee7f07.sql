-- Fix strain-images storage bucket - remove overly permissive upload policy
DROP POLICY IF EXISTS "Service role can upload strain images" ON storage.objects;

-- Only admins can upload strain images
CREATE POLICY "Only admins can upload strain images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'strain-images' 
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );