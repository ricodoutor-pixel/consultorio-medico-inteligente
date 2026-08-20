
CREATE TABLE public.clinical_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symptom_level INTEGER NOT NULL DEFAULT 5,
  mood TEXT NOT NULL DEFAULT '😐',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own check-ins"
ON public.clinical_outcomes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Patients can view own check-ins"
ON public.clinical_outcomes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Doctors can view patient check-ins"
ON public.clinical_outcomes FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT DISTINCT a.patient_id FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE d.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all check-ins"
ON public.clinical_outcomes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_clinical_outcomes_user_date ON public.clinical_outcomes (user_id, created_at DESC);
