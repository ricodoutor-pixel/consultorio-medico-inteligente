CREATE TABLE public.lawyer_profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE,
 full_name text NOT NULL, oab_number text NOT NULL, oab_state text NOT NULL,
 city text NOT NULL DEFAULT '', bio text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 verification_source text, verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(oab_number,oab_state),
 CHECK (length(trim(full_name)) BETWEEN 3 AND 160),
 CHECK (oab_number ~ '^[0-9]{1,10}$'),
 CHECK (oab_state IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
);
GRANT SELECT ON public.lawyer_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.lawyer_profiles TO authenticated;
GRANT ALL ON public.lawyer_profiles TO service_role;
ALTER TABLE public.lawyer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY lawyer_profile_read ON public.lawyer_profiles FOR SELECT USING (status='approved' OR user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY lawyer_profile_create ON public.lawyer_profiles FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND status='pending' AND verified_at IS NULL AND verification_source IS NULL);
CREATE POLICY lawyer_profile_edit ON public.lawyer_profiles FOR UPDATE TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.guard_lawyer_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') AND coalesce(auth.role(),'') <> 'service_role' THEN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.verified_at IS DISTINCT FROM OLD.verified_at OR NEW.verification_source IS DISTINCT FROM OLD.verification_source THEN RAISE EXCEPTION 'Manual administrator approval required'; END IF;
  IF (NEW.full_name,NEW.oab_number,NEW.oab_state,NEW.bio,NEW.city) IS DISTINCT FROM (OLD.full_name,OLD.oab_number,OLD.oab_state,OLD.bio,OLD.city) THEN
   NEW.status='pending'; NEW.verified_at=NULL; NEW.verification_source=NULL;
  END IF;
 END IF;
 IF NEW.status='approved' AND (NEW.verified_at IS NULL OR length(trim(coalesce(NEW.verification_source,'')))<5) THEN RAISE EXCEPTION 'Record OAB verification before approval'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_lawyer_profile BEFORE UPDATE ON public.lawyer_profiles FOR EACH ROW EXECUTE FUNCTION public.guard_lawyer_profile();
CREATE TABLE public.lawyer_terms (
 lawyer_id uuid PRIMARY KEY REFERENCES public.lawyer_profiles(id),
 consultation_fee numeric(12,2) NOT NULL CHECK (consultation_fee>0),
 scope text NOT NULL DEFAULT 'Consulta jurídica inicial. Não inclui processo judicial nem custas.'
);
GRANT SELECT, INSERT, UPDATE ON public.lawyer_terms TO authenticated;
GRANT ALL ON public.lawyer_terms TO service_role;
ALTER TABLE public.lawyer_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY lawyer_terms_owner ON public.lawyer_terms FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.lawyer_profiles p WHERE p.id=lawyer_id AND p.user_id=auth.uid()) OR public.has_role(auth.uid(),'admin')) WITH CHECK (EXISTS(SELECT 1 FROM public.lawyer_profiles p WHERE p.id=lawyer_id AND p.user_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.lawyer_slots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lawyer_id uuid NOT NULL REFERENCES public.lawyer_profiles(id),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','booked','cancelled')),
 UNIQUE(lawyer_id,starts_at), CHECK(ends_at>starts_at)
);
GRANT SELECT ON public.lawyer_slots TO anon;
GRANT SELECT, INSERT ON public.lawyer_slots TO authenticated;
GRANT ALL ON public.lawyer_slots TO service_role;
ALTER TABLE public.lawyer_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY lawyer_slots_read ON public.lawyer_slots FOR SELECT USING (EXISTS(SELECT 1 FROM public.lawyer_profiles p WHERE p.id=lawyer_id AND (p.user_id=auth.uid() OR (p.status='approved' AND status='available'))) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY lawyer_slots_create ON public.lawyer_slots FOR INSERT TO authenticated WITH CHECK (status='available' AND EXISTS(SELECT 1 FROM public.lawyer_profiles p WHERE p.id=lawyer_id AND p.user_id=auth.uid() AND p.status='approved'));
CREATE FUNCTION public.validate_lawyer_slot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.starts_at<=now() THEN RAISE EXCEPTION 'Choose a future time'; END IF;
 IF EXISTS(SELECT 1 FROM public.lawyer_slots s WHERE s.lawyer_id=NEW.lawyer_id AND s.status<>'cancelled' AND s.starts_at<NEW.ends_at AND s.ends_at>NEW.starts_at) THEN RAISE EXCEPTION 'Overlapping slot'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_lawyer_slot BEFORE INSERT ON public.lawyer_slots FOR EACH ROW EXECUTE FUNCTION public.validate_lawyer_slot();
CREATE TABLE public.lawyer_appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slot_id uuid NOT NULL REFERENCES public.lawyer_slots(id),
 lawyer_id uuid NOT NULL REFERENCES public.lawyer_profiles(id), client_id uuid NOT NULL,
 fee numeric(12,2) NOT NULL, scope text NOT NULL,
 status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','cancelled','completed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX lawyer_slot_one_booking ON public.lawyer_appointments(slot_id) WHERE status<>'cancelled';
GRANT SELECT ON public.lawyer_appointments TO authenticated;
GRANT ALL ON public.lawyer_appointments TO service_role;
ALTER TABLE public.lawyer_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY lawyer_appointment_participants ON public.lawyer_appointments FOR SELECT TO authenticated USING (client_id=auth.uid() OR EXISTS(SELECT 1 FROM public.lawyer_profiles p WHERE p.id=lawyer_id AND p.user_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.get_lawyer_private_quote(_lawyer_id uuid) RETURNS TABLE(consultation_fee numeric,scope text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 RETURN QUERY SELECT t.consultation_fee,t.scope FROM public.lawyer_terms t JOIN public.lawyer_profiles p ON p.id=t.lawyer_id WHERE p.id=_lawyer_id AND p.status='approved';
END $$;
REVOKE ALL ON FUNCTION public.get_lawyer_private_quote(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_lawyer_private_quote(uuid) TO authenticated;
CREATE FUNCTION public.book_lawyer_slot(_slot_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.lawyer_slots; t public.lawyer_terms; booking uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT * INTO s FROM public.lawyer_slots WHERE id=_slot_id FOR UPDATE;
 IF s.id IS NULL OR s.status<>'available' OR s.starts_at<=now() THEN RAISE EXCEPTION 'Time no longer available'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lawyer_profiles p WHERE p.id=s.lawyer_id AND p.status='approved' AND p.user_id<>auth.uid()) THEN RAISE EXCEPTION 'Lawyer unavailable or own schedule'; END IF;
 SELECT * INTO t FROM public.lawyer_terms WHERE lawyer_id=s.lawyer_id;
 IF t.lawyer_id IS NULL THEN RAISE EXCEPTION 'Lawyer must define fees first'; END IF;
 INSERT INTO public.lawyer_appointments(slot_id,lawyer_id,client_id,fee,scope) VALUES(s.id,s.lawyer_id,auth.uid(),t.consultation_fee,t.scope) RETURNING id INTO booking;
 UPDATE public.lawyer_slots SET status='booked' WHERE id=s.id;
 RETURN booking;
END $$;
REVOKE ALL ON FUNCTION public.book_lawyer_slot(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.book_lawyer_slot(uuid) TO authenticated;
CREATE FUNCTION public.close_lawyer_appointment(_id uuid,_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.lawyer_appointments; owner_id uuid;
BEGIN
 IF auth.uid() IS NULL OR _status NOT IN ('cancelled','completed') THEN RAISE EXCEPTION 'Invalid request'; END IF;
 SELECT * INTO a FROM public.lawyer_appointments WHERE id=_id FOR UPDATE;
 SELECT user_id INTO owner_id FROM public.lawyer_profiles WHERE id=a.lawyer_id;
 IF a.id IS NULL OR a.status<>'scheduled' OR (auth.uid()<>owner_id AND (auth.uid()<>a.client_id OR _status<>'cancelled')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 UPDATE public.lawyer_appointments SET status=_status WHERE id=a.id;
 IF _status='cancelled' THEN UPDATE public.lawyer_slots SET status='available' WHERE id=a.slot_id; END IF;
END $$;
REVOKE ALL ON FUNCTION public.close_lawyer_appointment(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.close_lawyer_appointment(uuid,text) TO authenticated;