-- Fix: Remove the broad SELECT policy that exposes pix_key to all authenticated users
DROP POLICY IF EXISTS "Authenticated can view verified doctors" ON public.doctors;

-- Only doctors can see their own full record (including pix_key)
-- Admins already have ALL access via "Admins can manage doctors"
-- "Doctors can view own profile" already exists with (user_id = auth.uid())
-- Other authenticated users must use the doctors_public view (no pix_key)

-- Grant authenticated users SELECT on the safe view
GRANT SELECT ON public.doctors_public TO authenticated;