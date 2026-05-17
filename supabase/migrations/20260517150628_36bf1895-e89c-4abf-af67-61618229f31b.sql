-- Passaporte Canábico Digital
CREATE TABLE IF NOT EXISTS public.patient_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  patient_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  access_count integer NOT NULL DEFAULT 0,
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_passports_token ON public.patient_passports(token);
CREATE INDEX IF NOT EXISTS idx_patient_passports_patient ON public.patient_passports(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_passports_appointment ON public.patient_passports(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_passports_expires ON public.patient_passports(expires_at);

ALTER TABLE public.patient_passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own passports"
  ON public.patient_passports FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Patients create own passports"
  ON public.patient_passports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients update own passports"
  ON public.patient_passports FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete passports"
  ON public.patient_passports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_patient_passports_updated_at
  BEFORE UPDATE ON public.patient_passports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função pública: leitura por token (sem login)
CREATE OR REPLACE FUNCTION public.get_passport_by_token(_token text)
RETURNS TABLE(
  id uuid,
  appointment_id uuid,
  metadata jsonb,
  expires_at timestamptz,
  created_at timestamptz,
  is_expired boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_expired boolean;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN RETURN; END IF;

  SELECT p.id, (p.expires_at < now()) INTO v_id, v_expired
  FROM public.patient_passports p
  WHERE p.token = _token
  LIMIT 1;

  IF v_id IS NULL THEN RETURN; END IF;

  UPDATE public.patient_passports
  SET access_count = access_count + 1, last_accessed_at = now()
  WHERE id = v_id;

  RETURN QUERY
  SELECT
    p.id,
    p.appointment_id,
    CASE WHEN v_expired THEN jsonb_build_object('patient_display_name', p.metadata->>'patient_display_name') ELSE p.metadata END,
    p.expires_at,
    p.created_at,
    v_expired
  FROM public.patient_passports p
  WHERE p.id = v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_passport_by_token(text) TO anon, authenticated;