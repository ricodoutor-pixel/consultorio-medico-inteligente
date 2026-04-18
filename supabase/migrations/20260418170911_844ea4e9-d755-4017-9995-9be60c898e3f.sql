-- 1. Restrict automation_flows SELECT to admins only
DROP POLICY IF EXISTS "Authenticated can view automation_flows" ON public.automation_flows;

CREATE POLICY "Admins can view automation_flows"
ON public.automation_flows
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Lock down social_interactions subscriber PII — admin/service_role only for SELECT
-- Drop any permissive SELECT policies that might exist
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'social_interactions'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.social_interactions', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.social_interactions ENABLE ROW LEVEL SECURITY;

-- Only admins can read subscriber PII
CREATE POLICY "Admins can view social_interactions"
ON public.social_interactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));