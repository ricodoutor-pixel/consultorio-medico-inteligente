-- 1. Add NPS columns to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS nps_score INTEGER CHECK (nps_score BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS nps_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS nps_comment TEXT;

-- 2. Add nps_score to doctors if missing
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS nps_score NUMERIC(3,1);

-- 3. Create NPS Dashboard View
CREATE OR REPLACE VIEW public.nps_dashboard AS
SELECT 
    DATE_TRUNC('week', a.updated_at) AS semana,
    COUNT(*) AS consultas_concluidas,
    COUNT(a.nps_score) AS nps_respondidos,
    ROUND(AVG(a.nps_score), 1) AS nps_medio,
    COUNT(CASE WHEN a.nps_score >= 9 THEN 1 END) AS promotores,
    COUNT(CASE WHEN a.nps_score BETWEEN 7 AND 8 THEN 1 END) AS neutros,
    COUNT(CASE WHEN a.nps_score <= 6 THEN 1 END) AS detratores,
    ROUND(
        (COUNT(CASE WHEN a.nps_score >= 9 THEN 1 END)::decimal - COUNT(CASE WHEN a.nps_score <= 6 THEN 1 END)::decimal) 
        / NULLIF(COUNT(a.nps_score), 0) * 100, 0
    ) AS nps_real
FROM public.appointments a
WHERE a.status = 'completed' AND a.payment_status = 'paid'
GROUP BY DATE_TRUNC('week', a.updated_at)
ORDER BY semana DESC;

GRANT SELECT ON public.nps_dashboard TO authenticated;

-- 4. Create real-time trigger for doctor NPS average
CREATE OR REPLACE FUNCTION public.update_doctor_nps()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.doctors
    SET nps_score = (
        SELECT ROUND(AVG(nps_score), 1)
        FROM public.appointments
        WHERE doctor_id = NEW.doctor_id
        AND status = 'completed'
        AND nps_score IS NOT NULL
        AND updated_at > now() - interval '90 days'
    )
    WHERE id = NEW.doctor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_doctor_nps ON public.appointments;

CREATE TRIGGER trigger_update_doctor_nps
AFTER UPDATE OF nps_score ON public.appointments
FOR EACH ROW
WHEN (NEW.nps_score IS NOT NULL)
EXECUTE FUNCTION public.update_doctor_nps();

-- 5. RPCs for anonymous submission via email link (Security Definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.submit_appointment_nps(p_appointment_id UUID, p_score INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.appointments
    SET nps_score = p_score,
        nps_submitted_at = now()
    WHERE id = p_appointment_id
    AND nps_score IS NULL; -- Prevent double voting
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_appointment_nps_comment(p_appointment_id UUID, p_comment TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.appointments
    SET nps_comment = p_comment
    WHERE id = p_appointment_id;
END;
$$;
