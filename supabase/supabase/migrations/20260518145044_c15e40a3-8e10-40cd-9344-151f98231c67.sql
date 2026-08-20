
-- 1) consultation_queue: remove direct doctor UPDATE policy (accept handled by edge function via service role)
DROP POLICY IF EXISTS "Doctors can accept queue entries" ON public.consultation_queue;

-- 2) payout_history: mask pix_key at rest
CREATE OR REPLACE FUNCTION public.mask_payout_pix_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean text;
BEGIN
  IF NEW.pix_key IS NULL OR length(NEW.pix_key) = 0 THEN
    RETURN NEW;
  END IF;
  v_clean := btrim(NEW.pix_key);
  IF v_clean ~ '\*{2,}' THEN
    -- already masked
    NEW.pix_key := v_clean;
    RETURN NEW;
  END IF;
  IF length(v_clean) <= 8 THEN
    NEW.pix_key := repeat('*', length(v_clean));
  ELSE
    NEW.pix_key := substring(v_clean, 1, 4) || repeat('*', greatest(length(v_clean) - 8, 4)) || substring(v_clean, length(v_clean) - 3, 4);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mask_payout_pix_key ON public.payout_history;
CREATE TRIGGER trg_mask_payout_pix_key
  BEFORE INSERT OR UPDATE OF pix_key ON public.payout_history
  FOR EACH ROW EXECUTE FUNCTION public.mask_payout_pix_key();

-- Backfill existing rows: mask any unmasked pix_key
UPDATE public.payout_history
SET pix_key = CASE
  WHEN pix_key IS NULL OR length(pix_key) = 0 THEN pix_key
  WHEN pix_key ~ '\*{2,}' THEN pix_key
  WHEN length(btrim(pix_key)) <= 8 THEN repeat('*', length(btrim(pix_key)))
  ELSE substring(btrim(pix_key), 1, 4)
       || repeat('*', greatest(length(btrim(pix_key)) - 8, 4))
       || substring(btrim(pix_key), length(btrim(pix_key)) - 3, 4)
END
WHERE pix_key IS NOT NULL
  AND pix_key !~ '\*{2,}';
