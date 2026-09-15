DROP POLICY IF EXISTS "Public can view approved vendors" ON public.vendors;

DROP VIEW IF EXISTS public.vendors_public;
CREATE VIEW public.vendors_public
WITH (security_invoker = false) AS
SELECT
  id,
  COALESCE(nome_fantasia, store_name) AS store_name,
  nome_fantasia,
  COALESCE(store_logo_url, logo_url) AS store_logo_url,
  logo_url,
  store_description,
  rating,
  is_kyc_approved,
  (endereco_completo->>'cidade') AS cidade,
  (endereco_completo->>'estado') AS estado,
  created_at
FROM public.vendors
WHERE is_kyc_approved = true
  AND COALESCE(is_active, true) = true;

GRANT SELECT ON public.vendors_public TO anon, authenticated;