ALTER TABLE public.diagnostic_exams DROP CONSTRAINT IF EXISTS diagnostic_exams_exam_type_check;
ALTER TABLE public.diagnostic_exams ADD CONSTRAINT diagnostic_exams_exam_type_check CHECK (exam_type IN ('fundoscopy','oximetry','dermatoscopy','mobility','cardiac', 'pulmonary'));
