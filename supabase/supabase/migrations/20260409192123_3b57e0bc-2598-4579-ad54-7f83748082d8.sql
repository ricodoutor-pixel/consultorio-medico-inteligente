
CREATE TABLE public.product_alert_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone text NOT NULL,
  channels text[] NOT NULL DEFAULT '{whatsapp}',
  categories text[] NOT NULL DEFAULT '{shopping,club}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_alert_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_product_alert_user ON public.product_alert_subscriptions(user_id);

CREATE POLICY "Users can view own subscriptions"
ON public.product_alert_subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscription"
ON public.product_alert_subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
ON public.product_alert_subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own subscription"
ON public.product_alert_subscriptions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins manage all subscriptions"
ON public.product_alert_subscriptions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
