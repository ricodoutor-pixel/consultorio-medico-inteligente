ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS price_video_chat numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_chat_only numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_return numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_approved_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_type text;