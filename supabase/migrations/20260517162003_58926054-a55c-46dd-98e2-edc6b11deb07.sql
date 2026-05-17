
-- 1) doctors.is_available
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_doctors_available ON public.doctors(is_available) WHERE is_available = true AND is_online = true;

-- 2) pacientes_leads
CREATE TABLE IF NOT EXISTS public.pacientes_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  whatsapp text NOT NULL,
  cidade text,
  sintoma text,
  intensidade integer,
  idade integer,
  peso numeric,
  clinical_score integer,
  payload jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'quiz_triagem',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pacientes_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads" ON public.pacientes_leads
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view all leads" ON public.pacientes_leads
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update leads" ON public.pacientes_leads
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_pacientes_leads_wa ON public.pacientes_leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_pacientes_leads_created ON public.pacientes_leads(created_at DESC);

-- Reuse validation: rate-limit anonymous inserts
CREATE OR REPLACE FUNCTION public.validate_pacientes_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_phone text; v_recent int;
BEGIN
  IF NEW.nome IS NULL OR length(btrim(NEW.nome)) < 2 OR length(NEW.nome) > 120 THEN
    RAISE EXCEPTION 'Invalid nome';
  END IF;
  v_phone := regexp_replace(COALESCE(NEW.whatsapp,''), '\D', '', 'g');
  IF v_phone !~ '^\d{10,15}$' THEN RAISE EXCEPTION 'Invalid whatsapp'; END IF;
  NEW.whatsapp := v_phone;
  IF NEW.clinical_score IS NOT NULL AND (NEW.clinical_score < 0 OR NEW.clinical_score > 100) THEN
    RAISE EXCEPTION 'clinical_score out of range';
  END IF;
  IF auth.uid() IS NULL THEN
    SELECT count(*) INTO v_recent FROM public.pacientes_leads
    WHERE whatsapp = NEW.whatsapp AND created_at > now() - interval '10 minutes';
    IF v_recent >= 3 THEN RAISE EXCEPTION 'Rate limit exceeded'; END IF;
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_validate_pacientes_lead BEFORE INSERT ON public.pacientes_leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_pacientes_lead();

-- 3) patient_symptom_diary
CREATE TABLE IF NOT EXISTS public.patient_symptom_diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  pain_level integer CHECK (pain_level BETWEEN 0 AND 10),
  sleep_quality integer CHECK (sleep_quality BETWEEN 0 AND 10),
  mood integer CHECK (mood BETWEEN 0 AND 10),
  drops_used numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_symptom_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own diary" ON public.patient_symptom_diary
  FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Admins view all diaries" ON public.patient_symptom_diary
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_diary_patient_date ON public.patient_symptom_diary(patient_id, entry_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_diary_patient_day ON public.patient_symptom_diary(patient_id, entry_date);

-- 4) treatment_subscriptions
CREATE TABLE IF NOT EXISTS public.treatment_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  plan_code text NOT NULL DEFAULT 'continuo_79',
  monthly_amount numeric NOT NULL DEFAULT 79.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','canceled','past_due')),
  next_charge_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  last_charge_at timestamptz,
  mp_subscription_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.treatment_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own subscription" ON public.treatment_subscriptions
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients cancel own subscription" ON public.treatment_subscriptions
  FOR UPDATE USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id AND status IN ('canceled','paused'));
CREATE POLICY "Admins manage subscriptions" ON public.treatment_subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_treatment_subs_patient ON public.treatment_subscriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_subs_next ON public.treatment_subscriptions(next_charge_at) WHERE status = 'active';

CREATE TRIGGER trg_treatment_subs_updated BEFORE UPDATE ON public.treatment_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) RPC: find first available online doctor (queue orchestrator)
CREATE OR REPLACE FUNCTION public.get_next_available_doctor()
RETURNS TABLE(doctor_id uuid, user_id uuid, specialty text, rating numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.user_id, d.specialty, d.rating
  FROM public.doctors d
  WHERE d.is_online = true
    AND d.is_available = true
    AND d.kyc_status = 'approved'
    AND COALESCE(d.suspended_at, 'epoch'::timestamptz) < 'epoch'::timestamptz + interval '1 second'
    AND COALESCE(d.fraud_score, 100) >= 50
  ORDER BY d.rating DESC NULLS LAST, d.total_consultations DESC
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_next_available_doctor() TO anon, authenticated;
