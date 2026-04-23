-- Drop the overly permissive INSERT policy on social_interactions
DROP POLICY IF EXISTS "Authenticated users can insert own tracking" ON public.social_interactions;