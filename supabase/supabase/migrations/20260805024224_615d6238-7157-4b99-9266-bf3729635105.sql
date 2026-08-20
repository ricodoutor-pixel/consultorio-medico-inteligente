-- Mantém o status do plantão sempre coerente: online e disponível andam juntos
CREATE OR REPLACE FUNCTION public.sync_doctor_online_flags()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_online IS DISTINCT FROM OLD.is_online THEN
    NEW.is_available := NEW.is_online;
  ELSIF NEW.is_available IS DISTINCT FROM OLD.is_available THEN
    NEW.is_online := NEW.is_available;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_doctor_online_flags ON public.doctors;
CREATE TRIGGER trg_sync_doctor_online_flags
BEFORE UPDATE OF is_online, is_available ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_online_flags();

-- Normaliza estados divergentes existentes
UPDATE public.doctors SET is_online = false, is_available = false
WHERE is_online = true AND is_available = false;