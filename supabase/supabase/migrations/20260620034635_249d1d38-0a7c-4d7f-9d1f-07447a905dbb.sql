
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS geo_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS signup_role text;

CREATE INDEX IF NOT EXISTS idx_profiles_geo ON public.profiles(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_signup_role ON public.profiles(signup_role);

-- Mark all 12 agents as active for testing phase
UPDATE public.agent_registry SET is_active = true WHERE is_active IS DISTINCT FROM true;
