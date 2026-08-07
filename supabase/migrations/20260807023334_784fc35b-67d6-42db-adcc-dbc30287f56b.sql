CREATE TABLE IF NOT EXISTS public.diagnostic_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  ai_diagnosis JSONB,
  results JSONB,
  risk_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_exams TO authenticated;
GRANT ALL ON public.diagnostic_exams TO service_role;

ALTER TABLE public.diagnostic_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own diagnostic exams" ON public.diagnostic_exams;
CREATE POLICY "Users manage own diagnostic exams"
ON public.diagnostic_exams FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all diagnostic exams" ON public.diagnostic_exams;
CREATE POLICY "Admins can view all diagnostic exams"
ON public.diagnostic_exams FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "deny_anon_diagnostic_exams" ON public.diagnostic_exams;
CREATE POLICY "deny_anon_diagnostic_exams"
ON public.diagnostic_exams AS RESTRICTIVE FOR ALL TO anon USING (false);

CREATE INDEX IF NOT EXISTS idx_diagnostic_exams_user_created ON public.diagnostic_exams (user_id, created_at DESC);