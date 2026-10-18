-- Migration: 20260908000001_phase05b_rating_and_councils.sql
-- Fase 0.5b: Zeramento de ratings fabricados, CHECK constraints, triggers e separação regulatória de conselhos (CRM, COREN, CRF, CRMV, A_CONFIRMAR)

-- 1. Colunas de conselho profissional
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS council_type TEXT NOT NULL DEFAULT 'CRM',
ADD COLUMN IF NOT EXISTS council_number TEXT;

-- 2. Zerar rating em todos os registros com 0 consultas
UPDATE public.doctors
SET rating = NULL
WHERE total_consultations = 0 OR total_consultations IS NULL;

-- 3. CHECK constraint para impedir rating com total_consultations = 0
ALTER TABLE public.doctors
DROP CONSTRAINT IF EXISTS doctors_rating_requires_consultations;

ALTER TABLE public.doctors
ADD CONSTRAINT doctors_rating_requires_consultations
CHECK (total_consultations > 0 OR rating IS NULL);

-- 4. Trigger de integridade que força rating = NULL quando total_consultations = 0
CREATE OR REPLACE FUNCTION public.enforce_doctor_rating_check()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.total_consultations = 0 OR NEW.total_consultations IS NULL THEN
    NEW.rating := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_doctor_rating_check ON public.doctors;
CREATE TRIGGER trg_enforce_doctor_rating_check
  BEFORE INSERT OR UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_doctor_rating_check();

-- 5. CHECK constraint para tipos permitidos de conselho
ALTER TABLE public.doctors
DROP CONSTRAINT IF EXISTS doctors_council_type_check;

ALTER TABLE public.doctors
ADD CONSTRAINT doctors_council_type_check
CHECK (council_type IN ('CRM', 'COREN', 'CRF', 'CRMV', 'CRP', 'OUTRO', 'A_CONFIRMAR'));

-- 6. Atualização da view pública de médicos
CREATE OR REPLACE VIEW public.doctors_public AS
SELECT 
  id, user_id, crm, crm_state, rqe, specialty, bio, consultation_price,
  is_online, is_verified, rating, total_consultations, available_hours,
  created_at, updated_at, kyc_status, full_name, is_approved,
  consultation_fee, plan_tier, council_type, council_number
FROM public.doctors
WHERE is_approved = true AND is_verified = true;
