
-- 1) Lock down anon-executable SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.get_active_contingency_pix() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_payment_status_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_ot_order_insert() FROM PUBLIC, anon, authenticated;

-- Keep admin/authenticated access where it makes sense
GRANT EXECUTE ON FUNCTION public.get_active_contingency_pix() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_status_summary() TO authenticated;

-- 2) Replace broad SELECT policies on public buckets with admin-only listing.
--    Direct file access via CDN still works because the buckets remain public.
DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to ebooks" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to experience-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to strain-images" ON storage.objects;

CREATE POLICY "avatars admin list" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "ebooks admin list" ON storage.objects
  FOR SELECT USING (bucket_id = 'ebooks' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "experience-images admin list" ON storage.objects
  FOR SELECT USING (bucket_id = 'experience-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "strain-images admin list" ON storage.objects
  FOR SELECT USING (bucket_id = 'strain-images' AND has_role(auth.uid(), 'admin'::app_role));
