ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS needs_scheduling boolean NOT NULL DEFAULT false;

GRANT SELECT ON public.doctor_availability TO anon;
DROP POLICY IF EXISTS "Public can view available slots" ON public.doctor_availability;
CREATE POLICY "Public can view available slots" ON public.doctor_availability FOR SELECT TO anon USING (status = 'available');

CREATE OR REPLACE FUNCTION public.book_paid_appointment_slot(_appointment_id uuid, _slot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _appt record;
  _slot record;
  _when timestamptz;
BEGIN
  SELECT * INTO _appt FROM public.appointments WHERE id = _appointment_id FOR UPDATE;
  IF _appt IS NULL OR _appt.patient_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF _appt.payment_status NOT IN ('paid','approved') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_paid');
  END IF;
  IF NOT _appt.needs_scheduling THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_scheduled');
  END IF;
  SELECT * INTO _slot FROM public.doctor_availability WHERE id = _slot_id FOR UPDATE;
  IF _slot IS NULL OR _slot.doctor_id <> _appt.doctor_id
     OR NOT (_slot.status = 'available' OR (_slot.status = 'reserved' AND _slot.reserved_by = auth.uid())) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'slot_taken');
  END IF;
  _when := ((_slot.slot_date::text || ' ' || _slot.time_slot)::timestamp AT TIME ZONE 'America/Sao_Paulo');
  IF _when <= now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'slot_past');
  END IF;
  UPDATE public.doctor_availability SET status = 'booked', appointment_id = _appointment_id, reserved_by = auth.uid(), updated_at = now() WHERE id = _slot_id;
  UPDATE public.appointments SET scheduled_at = _when, needs_scheduling = false, status = 'confirmed', updated_at = now() WHERE id = _appointment_id;
  RETURN jsonb_build_object('ok', true, 'scheduled_at', _when);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.book_paid_appointment_slot(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.book_paid_appointment_slot(uuid, uuid) TO authenticated;