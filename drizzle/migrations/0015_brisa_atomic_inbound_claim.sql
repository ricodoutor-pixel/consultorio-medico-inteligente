CREATE TABLE public.brisa_processed_messages (
 wa_message_id text PRIMARY KEY,
 remote_jid text NOT NULL,
 processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.brisa_processed_messages TO service_role;
REVOKE ALL ON public.brisa_processed_messages FROM anon, authenticated;
ALTER TABLE public.brisa_processed_messages ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.brisa_processed_messages IS 'Server-only atomic inbound claims: a unique message identifier may start at most one bot response; ambiguous sends are not automatically replayed.';