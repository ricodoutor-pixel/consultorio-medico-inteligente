
CREATE OR REPLACE FUNCTION public.set_caption_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public','extensions'
AS $function$
BEGIN
  NEW.caption_hash := encode(extensions.digest(lower(btrim(COALESCE(NEW.caption, NEW.script, ''))), 'sha256'), 'hex');
  RETURN NEW;
END;
$function$;
