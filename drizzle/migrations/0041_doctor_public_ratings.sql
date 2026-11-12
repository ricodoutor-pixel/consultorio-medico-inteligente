-- Nota pública real dos médicos (vitrine e Google), autorizada pelo Dr. Edilson em 12/11/2026.
-- Só contam avaliações de consultas pagas, feitas pelo paciente da própria consulta, para o médico que atendeu.
-- A nota só é publicada com 5 avaliações ou mais; nada de comentários de pacientes (regras de publicidade do CFM).
CREATE OR REPLACE FUNCTION public.doctor_public_ratings()
RETURNS TABLE (doctor_id uuid, rating_avg numeric, rating_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.professional_id AS doctor_id,
         round(avg(r.stars)::numeric, 1) AS rating_avg,
         count(*)::integer AS rating_count
  FROM public.consultation_ratings r
  JOIN public.appointments a
    ON a.id = r.consultation_id
   AND a.patient_id = r.patient_id
   AND a.doctor_id = r.professional_id
   AND a.payment_status = 'paid'
  WHERE r.stars BETWEEN 1 AND 5
  GROUP BY r.professional_id
  HAVING count(*) >= 5
$$;

REVOKE ALL ON FUNCTION public.doctor_public_ratings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.doctor_public_ratings() TO anon, authenticated;
