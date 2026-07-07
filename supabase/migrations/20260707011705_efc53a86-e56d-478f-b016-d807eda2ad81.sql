
CREATE TABLE IF NOT EXISTS public.tcle_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID,
  doctor_name TEXT,
  version TEXT NOT NULL DEFAULT '2026.1',
  checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hint TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tcle_consents_user_id_idx ON public.tcle_consents(user_id);
CREATE INDEX IF NOT EXISTS tcle_consents_accepted_at_idx ON public.tcle_consents(accepted_at DESC);

GRANT SELECT, INSERT ON public.tcle_consents TO authenticated;
GRANT ALL ON public.tcle_consents TO service_role;

ALTER TABLE public.tcle_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own TCLE consent"
  ON public.tcle_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read their own TCLE consent"
  ON public.tcle_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all TCLE consents"
  ON public.tcle_consents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
