
-- Create appointment_alerts table
CREATE TABLE IF NOT EXISTS public.appointment_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL DEFAULT 'reminder',
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create alert_history table
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.appointment_alerts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  recipient TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered BOOLEAN DEFAULT false,
  error_message TEXT,
  metadata JSONB
);

-- Create health_subscriptions table for SaaS model
CREATE TABLE IF NOT EXISTS public.health_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic',
  plan_name TEXT NOT NULL DEFAULT 'Plano Saúde',
  amount NUMERIC NOT NULL DEFAULT 49.90,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  payment_method TEXT DEFAULT 'pix',
  external_subscription_id TEXT,
  features JSONB DEFAULT '{"brisa_24h": true, "marketplace_discount": 10, "quarterly_consultation": true}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_billing_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create triage_abandonment_tracking for Brisa closer
CREATE TABLE IF NOT EXISTS public.triage_abandonment_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  patient_phone TEXT,
  patient_name TEXT,
  triage_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  abandoned_at TIMESTAMPTZ,
  coupon_sent BOOLEAN DEFAULT false,
  coupon_code TEXT,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  manychat_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointment_alerts_patient ON public.appointment_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_alerts_status ON public.appointment_alerts(status);
CREATE INDEX IF NOT EXISTS idx_appointment_alerts_scheduled ON public.appointment_alerts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert ON public.alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_health_subscriptions_user ON public.health_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_health_subscriptions_status ON public.health_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_triage_abandonment_session ON public.triage_abandonment_tracking(session_id);

-- Enable RLS
ALTER TABLE public.appointment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_abandonment_tracking ENABLE ROW LEVEL SECURITY;

-- RLS: appointment_alerts
CREATE POLICY "Patients see own alerts" ON public.appointment_alerts
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors see their patient alerts" ON public.appointment_alerts
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Admins manage all alerts" ON public.appointment_alerts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert alerts" ON public.appointment_alerts
  FOR INSERT WITH CHECK (true);

-- RLS: alert_history
CREATE POLICY "Admins manage alert history" ON public.alert_history
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert alert history" ON public.alert_history
  FOR INSERT WITH CHECK (true);

-- RLS: health_subscriptions
CREATE POLICY "Users see own subscriptions" ON public.health_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscription" ON public.health_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all subscriptions" ON public.health_subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: triage_abandonment_tracking
CREATE POLICY "Admins manage triage tracking" ON public.triage_abandonment_tracking
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert triage tracking" ON public.triage_abandonment_tracking
  FOR INSERT WITH CHECK (true);

-- Enable realtime for subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_alerts;
