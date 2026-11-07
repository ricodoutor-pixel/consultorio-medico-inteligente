ALTER TABLE public.ot_reports ADD COLUMN educational_released_at timestamptz;
ALTER TABLE public.ot_reports ADD COLUMN generation_ms integer;
ALTER TABLE public.ot_reports ADD COLUMN content_hash text;
ALTER TABLE public.ot_reports ADD COLUMN rejection_reason text;
CREATE POLICY ot_reports_educational_read ON public.ot_reports FOR SELECT TO authenticated USING (user_id=auth.uid() AND status='draft' AND educational_released_at IS NOT NULL);
UPDATE public.ot_reports SET educational_released_at=now() WHERE status='draft';
ALTER TABLE public.ot_web_sessions ADD COLUMN report_generation_started_at timestamptz;