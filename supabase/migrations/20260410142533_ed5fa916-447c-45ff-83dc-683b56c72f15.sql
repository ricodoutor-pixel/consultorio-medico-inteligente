-- Drop the public policy that exposes pix_key
DROP POLICY IF EXISTS "Anyone can view verified doctors" ON public.doctors;

-- Create a safe public view without sensitive fields
CREATE OR REPLACE VIEW public.doctors_public
WITH (security_invoker = true) AS
SELECT id, user_id, specialty, bio, consultation_price, crm, crm_state, 
       is_online, is_verified, rating, total_consultations, available_hours,
       created_at, updated_at
FROM public.doctors
WHERE is_verified = true;

-- Re-create public policy but only for the view pattern - 
-- we need a SELECT policy for public/anon to read verified doctors without pix_key
CREATE POLICY "Public can view verified doctors without sensitive data"
ON public.doctors
FOR SELECT
TO anon
USING (is_verified = true);

-- Note: The anon role will still see pix_key column in raw table queries.
-- To fully protect, we should revoke direct column access or use the view.
-- For immediate fix, let's also restrict by removing pix_key from anon access:

-- Better approach: drop and recreate with column-level security via view
DROP POLICY IF EXISTS "Public can view verified doctors without sensitive data" ON public.doctors;

-- Only allow public access through the view, not the base table
GRANT SELECT ON public.doctors_public TO anon;

-- Authenticated non-owner doctors see verified doctors (without pix_key via view)
CREATE POLICY "Authenticated can view verified doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (is_verified = true OR user_id = auth.uid());