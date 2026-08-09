CREATE TABLE IF NOT EXISTS public.doctor_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id text NOT NULL,
  scenario_title text,
  difficulty text,
  score integer NOT NULL DEFAULT 0,
  plantacoins_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.doctor_simulations TO authenticated;
GRANT ALL ON public.doctor_simulations TO service_role;

ALTER TABLE public.doctor_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors_select_own_simulations" ON public.doctor_simulations
  FOR SELECT TO authenticated USING (doctor_id = auth.uid());

CREATE POLICY "doctors_insert_own_simulations" ON public.doctor_simulations
  FOR INSERT TO authenticated WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "admins_select_all_simulations" ON public.doctor_simulations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_doctor_simulations_doctor ON public.doctor_simulations(doctor_id, created_at DESC);