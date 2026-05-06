-- 1) ai_personas: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Personas readable by everyone" ON public.ai_personas;
DROP POLICY IF EXISTS "Personas readable by authenticated users" ON public.ai_personas;
CREATE POLICY "Personas readable by authenticated users"
  ON public.ai_personas
  FOR SELECT
  TO authenticated
  USING (true);

-- 2) triage_abandonment_tracking: remove permissive anon INSERT
DROP POLICY IF EXISTS "Anon can insert triage tracking" ON public.triage_abandonment_tracking;

-- 3) vendors_public: drop+recreate safe view
DROP VIEW IF EXISTS public.vendors_public;
CREATE VIEW public.vendors_public
WITH (security_invoker = true) AS
SELECT
  id,
  store_name,
  store_logo_url,
  store_description,
  rating
FROM public.vendors
WHERE COALESCE(is_active, true) = true;

GRANT SELECT ON public.vendors_public TO anon, authenticated;