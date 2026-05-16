
CREATE OR REPLACE FUNCTION public.nullify_offer_location_after_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    NEW.patient_lat := NULL;
    NEW.patient_lng := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nullify_offer_location ON public.consultation_offers;
CREATE TRIGGER trg_nullify_offer_location
BEFORE UPDATE OF status ON public.consultation_offers
FOR EACH ROW EXECUTE FUNCTION public.nullify_offer_location_after_pending();

-- Backfill: clear lat/lng for non-pending historical rows
UPDATE public.consultation_offers
   SET patient_lat = NULL, patient_lng = NULL
 WHERE status <> 'pending'
   AND (patient_lat IS NOT NULL OR patient_lng IS NOT NULL);
