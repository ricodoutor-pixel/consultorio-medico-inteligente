
CREATE TABLE public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_intent TEXT,
  patient_id UUID,
  triage_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_wa_conv_phone ON public.whatsapp_conversations (phone_number);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.whatsapp_conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
