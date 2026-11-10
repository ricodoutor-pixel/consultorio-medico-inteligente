REVOKE ALL ON public.lawyer_profiles,public.lawyer_terms,public.lawyer_slots,public.lawyer_appointments FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lawyer_profiles,public.lawyer_slots TO anon;
GRANT SELECT,INSERT,UPDATE ON public.lawyer_profiles,public.lawyer_terms TO authenticated;
GRANT SELECT,INSERT ON public.lawyer_slots TO authenticated;
GRANT SELECT ON public.lawyer_appointments TO authenticated;
GRANT ALL ON public.lawyer_profiles,public.lawyer_terms,public.lawyer_slots,public.lawyer_appointments TO service_role;
CREATE OR REPLACE FUNCTION public.validate_lawyer_slot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.lawyer_id::text,0));
 IF NEW.starts_at<=now() THEN RAISE EXCEPTION 'Choose a future time'; END IF;
 IF EXISTS(SELECT 1 FROM public.lawyer_slots s WHERE s.lawyer_id=NEW.lawyer_id AND s.status<>'cancelled' AND s.starts_at<NEW.ends_at AND s.ends_at>NEW.starts_at) THEN RAISE EXCEPTION 'Overlapping slot'; END IF;
 RETURN NEW;
END $$;