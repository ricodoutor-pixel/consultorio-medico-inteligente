DROP VIEW IF EXISTS public.vendors_public;

CREATE OR REPLACE FUNCTION public.list_public_vendors()
RETURNS TABLE(
  id uuid,
  store_name text,
  logo_url text,
  store_description text,
  rating numeric,
  cidade text,
  estado text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id,
    COALESCE(v.nome_fantasia, v.store_name) AS store_name,
    COALESCE(v.store_logo_url, v.logo_url) AS logo_url,
    v.store_description,
    v.rating,
    (v.endereco_completo->>'cidade') AS cidade,
    (v.endereco_completo->>'estado') AS estado
  FROM public.vendors v
  WHERE v.is_kyc_approved = true
    AND COALESCE(v.is_active, true) = true
  ORDER BY v.created_at
$$;

REVOKE ALL ON FUNCTION public.list_public_vendors() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_vendors() TO anon, authenticated, service_role;