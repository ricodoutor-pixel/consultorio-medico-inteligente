CREATE OR REPLACE FUNCTION public.guard_patient_appointment_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR auth.uid() IS NULL
     OR auth.uid() <> OLD.patient_id THEN
    RETURN NEW;
  END IF;

  -- patient acting on own appointment: cannot change doctor, date or type
  NEW.doctor_id     := OLD.doctor_id;
  NEW.scheduled_at  := OLD.scheduled_at;
  NEW.type          := OLD.type;

  -- allowed status transitions for the patient:
  --  * anything -> 'cancelled'
  --  * 'in_progress' -> 'completed' (leaving the video room)
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status <> 'cancelled'
     AND NOT (OLD.status = 'in_progress' AND NEW.status = 'completed') THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$$;