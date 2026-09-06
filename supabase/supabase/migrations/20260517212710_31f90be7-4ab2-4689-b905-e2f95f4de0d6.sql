-- Tighten consultation_queue policies to authenticated role only
DROP POLICY IF EXISTS "Patients see own queue entries" ON public.consultation_queue;
DROP POLICY IF EXISTS "Patients can join queue" ON public.consultation_queue;

CREATE POLICY "Patients see own queue entries"
ON public.consultation_queue
FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can join queue"
ON public.consultation_queue
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = patient_id);

-- Fix manus_sentinel_runs INSERT policy: should be service_role, not admin user
DROP POLICY IF EXISTS "service write sentinel" ON public.manus_sentinel_runs;
CREATE POLICY "service write sentinel"
ON public.manus_sentinel_runs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Validate that pix_key on withdrawals belongs to the requesting user
-- (matches a previously stored pix_key for that user, when available)
CREATE OR REPLACE FUNCTION public.validate_withdrawal_pix_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_known_count int;
BEGIN
  -- Service role / admins bypass
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Owner check
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot create withdrawal for another user';
  END IF;

  -- Basic format check
  IF NEW.pix_key IS NULL OR length(btrim(NEW.pix_key)) < 5 OR length(NEW.pix_key) > 140 THEN
    RAISE EXCEPTION 'Invalid pix_key';
  END IF;

  -- If user has previous successful/approved withdrawals with a pix_key,
  -- new requests must reuse one of those keys (prevents redirecting payouts).
  SELECT count(*) INTO v_known_count
  FROM public.affiliate_withdrawals
  WHERE user_id = NEW.user_id
    AND pix_key IS NOT NULL
    AND status IN ('approved','paid','completed');

  IF v_known_count > 0 AND NOT EXISTS (
    SELECT 1 FROM public.affiliate_withdrawals
    WHERE user_id = NEW.user_id
      AND pix_key = NEW.pix_key
      AND status IN ('approved','paid','completed')
  ) THEN
    RAISE EXCEPTION 'pix_key does not match a previously approved key for this user. Contact support to update payout key.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_affiliate_withdrawal_pix ON public.affiliate_withdrawals;
CREATE TRIGGER trg_validate_affiliate_withdrawal_pix
BEFORE INSERT ON public.affiliate_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_pix_key();

DROP TRIGGER IF EXISTS trg_validate_withdrawal_requests_pix ON public.withdrawal_requests;
CREATE TRIGGER trg_validate_withdrawal_requests_pix
BEFORE INSERT ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_pix_key();