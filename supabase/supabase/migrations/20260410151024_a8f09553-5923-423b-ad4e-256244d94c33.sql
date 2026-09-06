-- Fix: Remove overly permissive SELECT policy on vendors that exposes balance/total_sales
DROP POLICY IF EXISTS "Authenticated users can view active vendors" ON public.vendors;

-- Replace with owner-only SELECT (admins already have ALL)
CREATE POLICY "Vendors can view own store"
ON public.vendors
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Public access to vendor metadata is already handled by vendors_public view
