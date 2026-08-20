ALTER VIEW public.doctors_public SET (security_invoker = off);
GRANT SELECT ON public.doctors TO anon, authenticated;
-- Note: doctors RLS still controls direct table access; view exposes only public-safe columns.