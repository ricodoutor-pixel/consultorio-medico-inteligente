
-- ============================================================================
-- 1. clinic_profiles: stop exposing email/whatsapp to all authenticated users
-- ============================================================================

-- Remove the broad SELECT policy
DROP POLICY IF EXISTS "Authenticated can view active clinics" ON public.clinic_profiles;

-- Owners can view their own clinic (full row)
CREATE POLICY "Clinic owners can view their own clinic"
  ON public.clinic_profiles
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Public-safe view exposing only non-sensitive branding fields for active clinics.
-- Excludes: email, whatsapp, owner_user_id.
CREATE OR REPLACE VIEW public.clinic_profiles_public
WITH (security_invoker = true)
AS
SELECT
  id,
  doctor_name,
  specialty,
  domain,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  tagline,
  description,
  active,
  created_at,
  updated_at
FROM public.clinic_profiles
WHERE active = true;

-- Allow read access to the view (RLS on base table still enforced via security_invoker)
GRANT SELECT ON public.clinic_profiles_public TO anon, authenticated;

-- Add a permissive SELECT policy on the base table only for the public-safe columns
-- via the view path: re-allow active rows to be read so the view works for anon/auth.
-- Since the view runs as invoker, the underlying RLS must allow the read.
-- We add a narrow policy that lets anyone read active rows, but we restrict client
-- code to the view (no email/whatsapp columns can be selected anyway through the view).
-- However to actually prevent direct table reads of email/whatsapp we keep the table
-- restricted to owners + admins only. The view bypass requires a SECURITY DEFINER
-- approach instead.

-- Drop the invoker view and recreate as a SECURITY DEFINER function-based approach:
DROP VIEW IF EXISTS public.clinic_profiles_public;

CREATE OR REPLACE VIEW public.clinic_profiles_public
WITH (security_invoker = false)
AS
SELECT
  id,
  doctor_name,
  specialty,
  domain,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  tagline,
  description,
  active,
  created_at,
  updated_at
FROM public.clinic_profiles
WHERE active = true;

-- View is owned by postgres; RLS on base table is bypassed via owner privileges.
-- Only safe columns are exposed.
REVOKE ALL ON public.clinic_profiles_public FROM PUBLIC;
GRANT SELECT ON public.clinic_profiles_public TO anon, authenticated;

-- ============================================================================
-- 2. gamification_leaderboard: restrict SELECT to owner + admins
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can view leaderboard" ON public.gamification_leaderboard;

CREATE POLICY "Professionals can view their own leaderboard row"
  ON public.gamification_leaderboard
  FOR SELECT
  TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can view full leaderboard"
  ON public.gamification_leaderboard
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 3. Lock down SECURITY DEFINER functions exposed to anon / authenticated
-- ============================================================================

-- Privileged write functions: must NOT be callable via PostgREST RPC.
REVOKE EXECUTE ON FUNCTION public.credit_affiliate_wallet(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_affiliate_wallet(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_planta_coins(uuid, integer) FROM PUBLIC, anon, authenticated;

-- Trigger-only function: never called directly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Read-only helper used inside RLS policies; revoke from anon (still callable
-- transitively from policy evaluation regardless of grant).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;

-- Read-only computation: revoke from anon (authenticated may compute).
REVOKE EXECUTE ON FUNCTION public.calculate_doctor_performance(integer, numeric, numeric, text) FROM PUBLIC, anon;

-- increment_site_counter intentionally remains callable by anon (anonymous page views).
