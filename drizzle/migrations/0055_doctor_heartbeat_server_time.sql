CREATE OR REPLACE FUNCTION public.doctor_heartbeat_server_time()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.last_seen_online IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.last_seen_online IS DISTINCT FROM OLD.last_seen_online) THEN
    NEW.last_seen_online := now();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_doctor_heartbeat_server_time ON public.doctors;
CREATE TRIGGER trg_doctor_heartbeat_server_time BEFORE INSERT OR UPDATE OF last_seen_online ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.doctor_heartbeat_server_time();