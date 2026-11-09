ALTER TABLE public.ot_web_sessions ALTER COLUMN started_at DROP NOT NULL;
ALTER TABLE public.ot_web_sessions ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE public.ot_web_sessions ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false;
ALTER TABLE public.ot_web_sessions ADD COLUMN IF NOT EXISTS paused_by uuid;
ALTER TABLE public.ot_web_sessions ADD COLUMN IF NOT EXISTS paused_at timestamptz;