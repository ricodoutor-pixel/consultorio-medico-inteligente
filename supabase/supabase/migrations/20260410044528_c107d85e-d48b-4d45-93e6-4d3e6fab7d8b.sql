
CREATE OR REPLACE FUNCTION public.validate_nps_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score < 0 OR NEW.score > 10 THEN
    RAISE EXCEPTION 'Score must be between 0 and 10';
  END IF;
  IF NEW.category NOT IN ('detractor', 'passive', 'promoter') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  IF NEW.sentiment IS NOT NULL AND NEW.sentiment NOT IN ('positive', 'negative', 'neutral') THEN
    RAISE EXCEPTION 'Invalid sentiment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;
