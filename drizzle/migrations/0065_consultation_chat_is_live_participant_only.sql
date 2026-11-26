CREATE OR REPLACE FUNCTION public.consultation_chat_is_live(_appointment_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (
   SELECT 1 FROM public.appointments a
   WHERE a.id = _appointment_id AND a.payment_status = 'paid' AND a.status = 'in_progress'
     AND (a.patient_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = a.doctor_id AND d.user_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin'))
 )
$$;
REVOKE ALL ON FUNCTION public.consultation_chat_is_live(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consultation_chat_is_live(uuid) TO authenticated;