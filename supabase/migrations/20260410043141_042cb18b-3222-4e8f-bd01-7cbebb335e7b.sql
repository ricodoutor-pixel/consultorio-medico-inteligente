-- 1. Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active vendors" ON public.vendors;

-- 2. Add authenticated-only SELECT for active vendors (full row access for logged-in users)
CREATE POLICY "Authenticated users can view active vendors"
  ON public.vendors FOR SELECT TO authenticated
  USING (is_active = true);

-- 3. Create a public view without sensitive columns
CREATE OR REPLACE VIEW public.vendors_public
WITH (security_invoker = true)
AS
SELECT
  id,
  store_name,
  store_description,
  store_logo_url,
  store_banner_url,
  rating,
  total_products,
  is_active,
  created_at
FROM public.vendors
WHERE is_active = true;

-- 4. Grant public access to the view
GRANT SELECT ON public.vendors_public TO anon;
GRANT SELECT ON public.vendors_public TO authenticated;