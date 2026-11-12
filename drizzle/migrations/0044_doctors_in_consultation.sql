-- Luz amarela da vitrine: quais médicos estão atendendo agora (consulta paga em andamento).
-- Visitantes não leem appointments (RLS); esta função expõe só o id do médico, sem paciente nem detalhes.
-- Consultas "em andamento" há mais de 3 h são ignoradas (o guardião as encerra).
CREATE OR REPLACE FUNCTION public.doctors_in_consultation()
RETURNS TABLE (doctor_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT a.doctor_id
  FROM public.appointments a
  WHERE a.status = 'in_progress'
    AND a.payment_status = 'paid'
    AND a.doctor_id IS NOT NULL
    AND a.updated_at > now() - interval '3 hours'
$$;

REVOKE ALL ON FUNCTION public.doctors_in_consultation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.doctors_in_consultation() TO anon, authenticated;
