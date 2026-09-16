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

  -- patient acting on own appointment: only cancellation allowed
  NEW.doctor_id     := OLD.doctor_id;
  NEW.scheduled_at  := OLD.scheduled_at;
  NEW.type          := OLD.type;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_patient_appointment_update ON public.appointments;
CREATE TRIGGER guard_patient_appointment_update
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.guard_patient_appointment_update();

CREATE OR REPLACE FUNCTION public.guard_patient_slot_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_owner boolean;
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = OLD.doctor_id AND d.user_id = auth.uid()
  ) INTO _is_owner;

  IF _is_owner THEN
    RETURN NEW;
  END IF;

  -- patient reserving: pin everything except reservation fields
  NEW.doctor_id := OLD.doctor_id;
  NEW.slot_date := OLD.slot_date;
  NEW.time_slot := OLD.time_slot;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_patient_slot_update ON public.doctor_availability;
CREATE TRIGGER guard_patient_slot_update
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW EXECUTE FUNCTION public.guard_patient_slot_update();