-- Keep the view security-invoker so it never bypasses caller permissions or RLS.
ALTER VIEW public.doctors_public SET (security_invoker = on);

-- Remove broad table grants and expose only the catalog columns used by the safe view.
REVOKE ALL ON public.doctors FROM anon, authenticated;

GRANT SELECT (
  id, user_id, specialty, crm, crm_state, rqe, bio, rating,
  consultation_price, is_verified, is_online, plan_tier,
  total_consultations, available_hours, is_available,
  document_type, country, city, created_at,
  price_video_chat, price_chat_only, price_return
) ON public.doctors TO anon, authenticated;

-- Signed-in doctors can still create and update their own records under existing RLS.
GRANT INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
GRANT SELECT ON public.doctors_public TO anon, authenticated;

-- Row visibility for the catalog; column grants above block all internal fields.
DROP POLICY IF EXISTS "Public can view verified doctors" ON public.doctors;
CREATE POLICY "Public can view verified doctors"
  ON public.doctors FOR SELECT TO anon, authenticated
  USING (is_verified = true);

-- Existing owner/admin policy remains in force but is also bounded by column grants
-- for direct Data API calls; protected admin RPCs/service operations retain full access.