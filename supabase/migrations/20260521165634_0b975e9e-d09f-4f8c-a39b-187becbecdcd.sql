-- ============================================
-- BRISA OMNICHANNEL 360° — Memória Cross-Channel
-- ============================================

-- 1. UNIFIED CONTACTS (1 pessoa = 1 registro, múltiplos handles)
CREATE TABLE IF NOT EXISTS public.brisa_unified_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 TEXT UNIQUE, -- chave primária natural quando disponível
  whatsapp_jid TEXT UNIQUE,
  instagram_id TEXT UNIQUE,
  instagram_username TEXT,
  facebook_psid TEXT UNIQUE,
  display_name TEXT,
  lead_classification TEXT CHECK (lead_classification IN ('patient','professional','b2b','influencer','unknown')) DEFAULT 'unknown',
  funnel_stage TEXT CHECK (funnel_stage IN ('new','triaged','paid_30','scheduled','consulted','recurring','lost')) DEFAULT 'new',
  intent_history JSONB DEFAULT '[]'::jsonb,
  total_messages INT DEFAULT 0,
  last_channel TEXT,
  last_message_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buc_phone ON public.brisa_unified_contacts(phone_e164);
CREATE INDEX IF NOT EXISTS idx_buc_ig ON public.brisa_unified_contacts(instagram_id);
CREATE INDEX IF NOT EXISTS idx_buc_fb ON public.brisa_unified_contacts(facebook_psid);
CREATE INDEX IF NOT EXISTS idx_buc_lastmsg ON public.brisa_unified_contacts(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_buc_stage ON public.brisa_unified_contacts(funnel_stage, lead_classification);

-- 2. UNIFIED CONVERSATIONS (mensagens cross-channel)
CREATE TABLE IF NOT EXISTS public.brisa_unified_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.brisa_unified_contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','instagram_dm','messenger','fb_comment','ig_comment')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','audio','image','video','document','reaction')),
  content TEXT,
  audio_transcript TEXT,
  intent TEXT,
  urgency_score NUMERIC(3,2),
  raw_payload JSONB,
  external_message_id TEXT,
  is_bot_handled BOOLEAN DEFAULT true,
  human_takeover_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buconv_contact ON public.brisa_unified_conversations(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buconv_channel ON public.brisa_unified_conversations(channel, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_buconv_extid ON public.brisa_unified_conversations(channel, external_message_id) WHERE external_message_id IS NOT NULL;

-- 3. HUMAN TAKEOVER (silencia bot por X minutos)
CREATE TABLE IF NOT EXISTS public.brisa_human_takeover (
  contact_id UUID PRIMARY KEY REFERENCES public.brisa_unified_contacts(id) ON DELETE CASCADE,
  taken_by UUID NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_takeover_expires ON public.brisa_human_takeover(expires_at);

-- 4. RLS — admin-only (PII)
ALTER TABLE public.brisa_unified_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brisa_unified_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brisa_human_takeover ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read unified contacts"
  ON public.brisa_unified_contacts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access contacts"
  ON public.brisa_unified_contacts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Deny anon contacts" ON public.brisa_unified_contacts
  AS RESTRICTIVE FOR SELECT TO anon USING (false);

CREATE POLICY "Admins read unified conversations"
  ON public.brisa_unified_conversations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access conversations"
  ON public.brisa_unified_conversations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Deny anon conversations" ON public.brisa_unified_conversations
  AS RESTRICTIVE FOR SELECT TO anon USING (false);

CREATE POLICY "Admins manage takeover"
  ON public.brisa_human_takeover FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access takeover"
  ON public.brisa_human_takeover FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Deny anon takeover" ON public.brisa_human_takeover
  AS RESTRICTIVE FOR SELECT TO anon USING (false);

-- 5. FUNÇÃO upsert_unified_contact (merge inteligente cross-channel)
CREATE OR REPLACE FUNCTION public.upsert_unified_contact(
  _channel TEXT,
  _phone TEXT DEFAULT NULL,
  _whatsapp_jid TEXT DEFAULT NULL,
  _instagram_id TEXT DEFAULT NULL,
  _instagram_username TEXT DEFAULT NULL,
  _facebook_psid TEXT DEFAULT NULL,
  _display_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_clean_phone TEXT;
BEGIN
  IF _phone IS NOT NULL THEN
    v_clean_phone := regexp_replace(_phone, '\D', '', 'g');
    IF length(v_clean_phone) < 10 OR length(v_clean_phone) > 15 THEN
      v_clean_phone := NULL;
    END IF;
  END IF;

  -- Tenta encontrar contato existente por qualquer handle
  SELECT id INTO v_id FROM public.brisa_unified_contacts
  WHERE (v_clean_phone IS NOT NULL AND phone_e164 = v_clean_phone)
     OR (_whatsapp_jid IS NOT NULL AND whatsapp_jid = _whatsapp_jid)
     OR (_instagram_id IS NOT NULL AND instagram_id = _instagram_id)
     OR (_facebook_psid IS NOT NULL AND facebook_psid = _facebook_psid)
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.brisa_unified_contacts (
      phone_e164, whatsapp_jid, instagram_id, instagram_username, facebook_psid,
      display_name, last_channel, last_message_at, total_messages
    ) VALUES (
      v_clean_phone, _whatsapp_jid, _instagram_id, _instagram_username, _facebook_psid,
      _display_name, _channel, now(), 1
    ) RETURNING id INTO v_id;
  ELSE
    -- Merge: preenche handles vazios
    UPDATE public.brisa_unified_contacts SET
      phone_e164 = COALESCE(phone_e164, v_clean_phone),
      whatsapp_jid = COALESCE(whatsapp_jid, _whatsapp_jid),
      instagram_id = COALESCE(instagram_id, _instagram_id),
      instagram_username = COALESCE(instagram_username, _instagram_username),
      facebook_psid = COALESCE(facebook_psid, _facebook_psid),
      display_name = COALESCE(display_name, _display_name),
      last_channel = _channel,
      last_message_at = now(),
      total_messages = total_messages + 1,
      updated_at = now()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- 6. FUNÇÃO log_unified_message
CREATE OR REPLACE FUNCTION public.log_unified_message(
  _contact_id UUID,
  _channel TEXT,
  _direction TEXT,
  _content TEXT,
  _message_type TEXT DEFAULT 'text',
  _external_id TEXT DEFAULT NULL,
  _intent TEXT DEFAULT NULL,
  _urgency NUMERIC DEFAULT NULL,
  _audio_transcript TEXT DEFAULT NULL,
  _raw JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.brisa_unified_conversations (
    contact_id, channel, direction, message_type, content,
    audio_transcript, intent, urgency_score, raw_payload, external_message_id
  ) VALUES (
    _contact_id, _channel, _direction, _message_type, _content,
    _audio_transcript, _intent, _urgency, _raw, _external_id
  )
  ON CONFLICT (channel, external_message_id) WHERE external_message_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 7. FUNÇÃO is_human_takeover_active (bot consulta antes de responder)
CREATE OR REPLACE FUNCTION public.is_human_takeover_active(_contact_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brisa_human_takeover
    WHERE contact_id = _contact_id AND expires_at > now()
  );
$$;

-- 8. TRIGGER updated_at
CREATE TRIGGER trg_buc_updated
  BEFORE UPDATE ON public.brisa_unified_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();