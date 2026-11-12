-- Additive application of 0022: preserve any historical read_at column.
CREATE TABLE IF NOT EXISTS public.consultation_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  sender_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.consultation_chats TO authenticated;
GRANT ALL ON public.consultation_chats TO service_role;
ALTER TABLE public.consultation_chats ALTER COLUMN appointment_id SET NOT NULL;
ALTER TABLE public.consultation_chats ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.consultation_chats DROP CONSTRAINT IF EXISTS consultation_chats_sender_type_check;
ALTER TABLE public.consultation_chats ADD CONSTRAINT consultation_chats_sender_type_check CHECK (sender_type IN ('patient', 'doctor', 'system'));
ALTER TABLE public.consultation_chats DROP CONSTRAINT IF EXISTS consultation_chats_content_length;
ALTER TABLE public.consultation_chats ADD CONSTRAINT consultation_chats_content_length CHECK (char_length(btrim(content)) BETWEEN 1 AND 4000);
CREATE INDEX IF NOT EXISTS consultation_chats_appointment_created_idx ON public.consultation_chats (appointment_id, created_at);
CREATE OR REPLACE FUNCTION public.consultation_chat_role(_appointment_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT CASE WHEN a.patient_id = auth.uid() THEN 'patient'
 WHEN EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = a.doctor_id AND d.user_id = auth.uid()) THEN 'doctor' ELSE NULL END
 FROM public.appointments a WHERE a.id = _appointment_id
$$;
REVOKE ALL ON FUNCTION public.consultation_chat_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consultation_chat_role(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.consultation_chat_is_live(_appointment_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = _appointment_id AND a.payment_status = 'paid' AND a.status = 'in_progress')
$$;
REVOKE ALL ON FUNCTION public.consultation_chat_is_live(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consultation_chat_is_live(uuid) TO authenticated;
ALTER TABLE public.consultation_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view chats of their appointments" ON public.consultation_chats;
DROP POLICY IF EXISTS "Users can insert chats in their appointments" ON public.consultation_chats;
DROP POLICY IF EXISTS consultation_chats_participants_read ON public.consultation_chats;
DROP POLICY IF EXISTS consultation_chats_participants_send ON public.consultation_chats;
CREATE POLICY consultation_chats_participants_read ON public.consultation_chats FOR SELECT TO authenticated
 USING (public.consultation_chat_role(appointment_id) IS NOT NULL OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY consultation_chats_participants_send ON public.consultation_chats FOR INSERT TO authenticated
 WITH CHECK (sender_id = auth.uid() AND sender_type IN ('patient', 'doctor') AND sender_type = public.consultation_chat_role(appointment_id) AND public.consultation_chat_is_live(appointment_id));
REVOKE ALL ON public.consultation_chats FROM anon;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'consultation_chats') THEN
 ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_chats;
END IF; END $$;