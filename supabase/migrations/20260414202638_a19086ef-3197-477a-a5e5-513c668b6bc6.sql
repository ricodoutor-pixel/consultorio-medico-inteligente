
-- Recovery campaigns tracking table
CREATE TABLE public.recovery_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'lead_frio_24h',
  status TEXT NOT NULL DEFAULT 'pending',
  coupon_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  affiliate_notified BOOLEAN DEFAULT false,
  message_sent_via TEXT DEFAULT 'whatsapp',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recovery_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recovery campaigns"
ON public.recovery_campaigns FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own recovery campaigns"
ON public.recovery_campaigns FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_recovery_campaigns_user ON public.recovery_campaigns(user_id);
CREATE INDEX idx_recovery_campaigns_trigger ON public.recovery_campaigns(trigger_type, status);
