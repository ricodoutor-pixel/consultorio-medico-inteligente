CREATE TABLE IF NOT EXISTS public.meta_messenger_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('messenger','instagram')),
  sender_id text NOT NULL,
  message_in text,
  reply_out text,
  red_flag boolean NOT NULL DEFAULT false,
  error text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_messenger_log_sender ON public.meta_messenger_log(sender_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_messenger_log_channel ON public.meta_messenger_log(channel, processed_at DESC);

ALTER TABLE public.meta_messenger_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view meta messenger log"
ON public.meta_messenger_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));