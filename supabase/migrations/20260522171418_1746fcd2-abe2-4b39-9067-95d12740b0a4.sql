-- Enforce payout_history.user_id matches the doctor's auth user_id to prevent PIX key cross-exposure
CREATE OR REPLACE FUNCTION public.validate_payout_history_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_doctor_user uuid;
BEGIN
  SELECT user_id INTO v_doctor_user FROM public.doctors WHERE id = NEW.doctor_id;
  IF v_doctor_user IS NULL THEN
    RAISE EXCEPTION 'Invalid doctor_id: %', NEW.doctor_id;
  END IF;
  IF NEW.user_id IS DISTINCT FROM v_doctor_user THEN
    RAISE EXCEPTION 'payout_history.user_id (%) must match doctors.user_id (%) for doctor %',
      NEW.user_id, v_doctor_user, NEW.doctor_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_payout_history_owner ON public.payout_history;
CREATE TRIGGER trg_validate_payout_history_owner
BEFORE INSERT OR UPDATE OF doctor_id, user_id ON public.payout_history
FOR EACH ROW EXECUTE FUNCTION public.validate_payout_history_owner();

-- Tighten SELECT policy: require BOTH user_id ownership AND that doctor record still maps to caller
DROP POLICY IF EXISTS "Doctors can view own payouts" ON public.payout_history;
CREATE POLICY "Doctors can view own payouts"
ON public.payout_history FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = payout_history.doctor_id
      AND d.user_id = auth.uid()
  )
);