
-- Fix 1: Prevent privilege escalation on profiles - drop and recreate UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND (
    user_type IS NOT DISTINCT FROM (SELECT user_type FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Fix 2: Restrict INSERT on payment_webhooks to admins/service role only
DROP POLICY IF EXISTS "Auth users can insert webhooks" ON public.payment_webhooks;
DROP POLICY IF EXISTS "Anyone can insert webhooks" ON public.payment_webhooks;

CREATE POLICY "Only admins can insert payment webhooks"
ON public.payment_webhooks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix 3: Restrict site_counters UPDATE to authenticated users
DROP POLICY IF EXISTS "Anyone can update counters" ON public.site_counters;
DROP POLICY IF EXISTS "Public can update counters" ON public.site_counters;

CREATE POLICY "Authenticated users can update counters"
ON public.site_counters
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix 4: Make verdinho_conversations.user_id NOT NULL
ALTER TABLE public.verdinho_conversations ALTER COLUMN user_id SET NOT NULL;
