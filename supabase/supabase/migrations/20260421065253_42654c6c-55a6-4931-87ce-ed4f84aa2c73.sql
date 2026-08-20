-- Recreate doctors_public view WITHOUT sensitive fields (crm, crm_state, document_type, kyc_status, is_crm_valid, last_crm_check)
DROP VIEW IF EXISTS public.doctors_public;

CREATE VIEW public.doctors_public
WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  specialty,
  bio,
  consultation_price,
  is_online,
  is_verified,
  rating,
  total_consultations,
  available_hours,
  rqe,
  organization_id,
  created_at,
  updated_at
FROM public.doctors
WHERE is_verified = true;

-- Add a SELECT policy so authenticated users can read verified doctor profiles via the view
-- This scoped policy only grants SELECT (not INSERT/UPDATE/DELETE) on the base table
CREATE POLICY "Authenticated users can view verified doctors"
  ON public.doctors FOR SELECT
  TO authenticated
  USING (is_verified = true);