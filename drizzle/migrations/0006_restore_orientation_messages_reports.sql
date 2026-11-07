CREATE TABLE public.ot_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL REFERENCES public.ot_web_sessions(id),
 role text NOT NULL CHECK (role IN ('patient','agent','supervisor','system')),
 content text NOT NULL,
 attachment_path text,
 attachment_name text,
 attachment_mime text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ot_messages TO authenticated;
GRANT ALL ON public.ot_messages TO service_role;
ALTER TABLE public.ot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ot_messages_read ON public.ot_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ot_web_sessions s WHERE s.id=ot_messages.session_id AND (s.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE INDEX idx_ot_messages_session ON public.ot_messages(session_id,created_at);
CREATE TABLE public.ot_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL REFERENCES public.ot_web_sessions(id),
 user_id uuid NOT NULL,
 content_md text NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected')),
 approved_by uuid,
 approved_at timestamptz,
 verification_code text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ot_reports TO authenticated;
GRANT ALL ON public.ot_reports TO service_role;
ALTER TABLE public.ot_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY ot_reports_read ON public.ot_reports FOR SELECT TO authenticated USING ((user_id=auth.uid() AND status='approved') OR public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_ot_reports_session ON public.ot_reports(session_id);
CREATE INDEX idx_ot_reports_user ON public.ot_reports(user_id,status);