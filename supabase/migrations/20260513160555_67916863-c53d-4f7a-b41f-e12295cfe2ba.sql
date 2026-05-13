
-- 1. Replace `WITH CHECK (true)` policies with explicit field-level checks
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads_contatos;
CREATE POLICY "Anyone can insert leads"
ON public.leads_contatos
FOR INSERT
TO anon, authenticated
WITH CHECK (
  nome IS NOT NULL AND length(btrim(nome)) >= 2
  AND telefone IS NOT NULL AND length(telefone) >= 10
);

DROP POLICY IF EXISTS "Anyone can insert downloads" ON public.app_downloads;
CREATE POLICY "Anyone can insert downloads"
ON public.app_downloads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  platform IS NOT NULL AND platform IN ('android','ios','web','desktop','unknown')
);

-- 2. Drop list-all SELECT policies on public buckets (public CDN URLs still work)
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Public read ebooks" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for strain images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view experience images" ON storage.objects;

-- 3. Revoke anonymous EXECUTE on internal RLS helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, public;

-- 4. Convert search_scientific_articles to SECURITY INVOKER
ALTER FUNCTION public.search_scientific_articles(text, integer) SECURITY INVOKER;
