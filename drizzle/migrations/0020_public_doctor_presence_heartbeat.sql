ALTER TABLE public.doctors_public ADD COLUMN IF NOT EXISTS last_seen_online timestamptz;
COMMENT ON COLUMN public.doctors_public.last_seen_online IS 'Public availability heartbeat; private doctor records remain restricted.';
CREATE OR REPLACE FUNCTION public.sync_public_doctor_presence_heartbeat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.doctors_public
  SET last_seen_online = NEW.last_seen_online
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_public_doctor_presence_heartbeat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_public_doctor_presence_heartbeat() TO service_role;
CREATE TRIGGER trg_sync_public_doctor_presence_heartbeat
AFTER INSERT OR UPDATE ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.sync_public_doctor_presence_heartbeat();
UPDATE public.doctors_public AS catalog
SET last_seen_online = doctor.last_seen_online
FROM public.doctors AS doctor
WHERE catalog.id = doctor.id;